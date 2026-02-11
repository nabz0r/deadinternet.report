"""
Aggregation Service - computes analytics from raw scan data.

Responsibilities:
  - Daily rollup of scan verdicts → scan_aggregates table
  - Per-domain statistics → domain_stats table
  - Dynamic Dead Internet Index calculation
  - Blending live scan data with static research data
  - Generating dynamic ticker facts from scan trends
"""

import logging
from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlparse

from sqlalchemy import select, func, case, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.scan import Scan
from app.models.aggregation import ScanAggregate, DomainStats

logger = logging.getLogger(__name__)


class AggregationService:
    """Computes and stores analytics from raw scan data."""

    # ── Dead Internet Index weights ──────────────────────────────────
    # The DII blends published research data (authoritative but static)
    # with live scan data (real-time but biased toward scanned URLs).

    # Research weights (from published studies)
    WEIGHT_RESEARCH = 0.7
    # Live scan data weight
    WEIGHT_LIVE = 0.3

    # Sub-weights within research component
    WEIGHT_BOT_TRAFFIC = 0.4      # Imperva bot traffic %
    WEIGHT_AI_CONTENT = 0.4       # Ahrefs AI content %
    WEIGHT_AI_ARTICLES = 0.2      # Graphite AI articles %

    async def compute_daily_aggregates(
        self, db: AsyncSession, target_date: date | None = None,
    ) -> list[ScanAggregate]:
        """
        Roll up scan results for a given day into scan_aggregates.
        If target_date is None, aggregates yesterday's data.
        Uses upsert to be idempotent (safe to re-run).
        """
        if target_date is None:
            target_date = date.today() - timedelta(days=1)

        # Query raw scan data grouped by verdict for target_date
        stmt = (
            select(
                Scan.verdict,
                func.count(Scan.id).label("scan_count"),
                func.avg(Scan.ai_probability).label("avg_prob"),
                func.min(Scan.ai_probability).label("min_prob"),
                func.max(Scan.ai_probability).label("max_prob"),
                func.sum(Scan.tokens_used).label("total_tokens"),
                func.avg(Scan.scan_duration_ms).label("avg_duration"),
            )
            .where(func.date(Scan.created_at) == target_date)
            .group_by(Scan.verdict)
        )

        result = await db.execute(stmt)
        rows = result.all()

        aggregates = []
        for row in rows:
            # Check if aggregate already exists
            existing = await db.execute(
                select(ScanAggregate).where(
                    ScanAggregate.date == target_date,
                    ScanAggregate.verdict == row.verdict,
                )
            )
            agg = existing.scalar_one_or_none()

            if agg:
                # Update existing
                agg.scan_count = row.scan_count
                agg.avg_ai_probability = round(float(row.avg_prob or 0), 4)
                agg.min_ai_probability = round(float(row.min_prob or 0), 4)
                agg.max_ai_probability = round(float(row.max_prob or 0), 4)
                agg.total_tokens_used = int(row.total_tokens or 0)
                agg.avg_scan_duration_ms = int(row.avg_duration or 0)
            else:
                # Insert new
                agg = ScanAggregate(
                    date=target_date,
                    verdict=row.verdict,
                    scan_count=row.scan_count,
                    avg_ai_probability=round(float(row.avg_prob or 0), 4),
                    min_ai_probability=round(float(row.min_prob or 0), 4),
                    max_ai_probability=round(float(row.max_prob or 0), 4),
                    total_tokens_used=int(row.total_tokens or 0),
                    avg_scan_duration_ms=int(row.avg_duration or 0),
                )
                db.add(agg)

            aggregates.append(agg)

        await db.flush()
        logger.info(
            "Computed daily aggregates for %s: %d verdict groups",
            target_date, len(aggregates),
        )
        return aggregates

    async def compute_domain_stats(self, db: AsyncSession) -> int:
        """
        Recompute domain-level statistics from all scan data.
        Returns the number of domains updated.
        """
        # Extract domain from URL and aggregate
        stmt = (
            select(
                Scan.url,
                Scan.verdict,
                Scan.ai_probability,
                Scan.created_at,
            )
        )
        result = await db.execute(stmt)
        rows = result.all()

        # Aggregate in Python (handles URL parsing which SQL can't easily do)
        domain_data: dict[str, dict] = {}
        for row in rows:
            try:
                domain = urlparse(row.url).netloc.lower()
                if not domain:
                    continue
                # Strip www. prefix for consistency
                if domain.startswith("www."):
                    domain = domain[4:]
            except Exception:
                continue

            if domain not in domain_data:
                domain_data[domain] = {
                    "scan_count": 0,
                    "ai_generated_count": 0,
                    "mixed_count": 0,
                    "human_count": 0,
                    "prob_sum": 0.0,
                    "last_scanned_at": row.created_at,
                }

            d = domain_data[domain]
            d["scan_count"] += 1
            d["prob_sum"] += row.ai_probability

            if row.verdict == "ai_generated":
                d["ai_generated_count"] += 1
            elif row.verdict == "mixed":
                d["mixed_count"] += 1
            else:
                d["human_count"] += 1

            if row.created_at and (d["last_scanned_at"] is None or row.created_at > d["last_scanned_at"]):
                d["last_scanned_at"] = row.created_at

        # Upsert domain stats
        for domain, data in domain_data.items():
            existing = await db.execute(
                select(DomainStats).where(DomainStats.domain == domain)
            )
            ds = existing.scalar_one_or_none()

            avg_prob = round(data["prob_sum"] / data["scan_count"], 4) if data["scan_count"] > 0 else 0.0

            if ds:
                ds.scan_count = data["scan_count"]
                ds.ai_generated_count = data["ai_generated_count"]
                ds.mixed_count = data["mixed_count"]
                ds.human_count = data["human_count"]
                ds.avg_ai_probability = avg_prob
                ds.last_scanned_at = data["last_scanned_at"]
            else:
                ds = DomainStats(
                    domain=domain,
                    scan_count=data["scan_count"],
                    ai_generated_count=data["ai_generated_count"],
                    mixed_count=data["mixed_count"],
                    human_count=data["human_count"],
                    avg_ai_probability=avg_prob,
                    last_scanned_at=data["last_scanned_at"],
                )
                db.add(ds)

        await db.flush()
        logger.info("Updated domain stats for %d domains", len(domain_data))
        return len(domain_data)

    async def calculate_dead_internet_index(
        self,
        db: AsyncSession,
        research_data: dict,
    ) -> float:
        """
        Calculate the Dead Internet Index as a weighted blend of:
        1. Research data (published studies) — 70% weight
        2. Live scan data (user scans) — 30% weight

        The index represents the probability (0.0 - 1.0) that
        internet content encountered is non-human.

        Formula:
          research_score = (bot_traffic * 0.4) + (ai_content * 0.4) + (ai_articles * 0.2)
          live_score = avg AI probability across all scans (last 30 days)
          DII = (research_score * 0.7) + (live_score * 0.3)

        If no scan data exists, falls back to research-only score.
        """
        # Research component
        global_data = research_data.get("global", {})
        bot_traffic = global_data.get("bot_traffic_pct", 50.0) / 100.0
        ai_content = global_data.get("ai_content_new_pages_pct", 50.0) / 100.0
        ai_articles = global_data.get("ai_articles_pct", 50.0) / 100.0

        research_score = (
            bot_traffic * self.WEIGHT_BOT_TRAFFIC
            + ai_content * self.WEIGHT_AI_CONTENT
            + ai_articles * self.WEIGHT_AI_ARTICLES
        )

        # Live scan component (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        live_result = await db.execute(
            select(
                func.avg(Scan.ai_probability).label("avg_prob"),
                func.count(Scan.id).label("total_scans"),
            ).where(Scan.created_at >= thirty_days_ago)
        )
        live_row = live_result.one()
        live_avg = float(live_row.avg_prob) if live_row.avg_prob is not None else None
        total_scans = int(live_row.total_scans)

        if live_avg is not None and total_scans >= 10:
            # Blend research and live data
            dii = (research_score * self.WEIGHT_RESEARCH) + (live_avg * self.WEIGHT_LIVE)
        else:
            # Not enough scan data — use research only
            dii = research_score

        return round(min(max(dii, 0.0), 1.0), 4)

    async def get_scan_volume_trend(
        self, db: AsyncSession, days: int = 30,
    ) -> list[dict]:
        """
        Get daily scan volume for the last N days.
        Returns list of {date, total, ai_generated, mixed, human}.
        """
        start_date = date.today() - timedelta(days=days)

        stmt = (
            select(ScanAggregate)
            .where(ScanAggregate.date >= start_date)
            .order_by(ScanAggregate.date)
        )
        result = await db.execute(stmt)
        rows = result.scalars().all()

        # Group by date
        daily: dict[date, dict] = {}
        for row in rows:
            if row.date not in daily:
                daily[row.date] = {
                    "date": row.date.isoformat(),
                    "total": 0,
                    "ai_generated": 0,
                    "mixed": 0,
                    "human": 0,
                    "avg_ai_probability": 0.0,
                }
            d = daily[row.date]
            d["total"] += row.scan_count
            if row.verdict == "ai_generated":
                d["ai_generated"] = row.scan_count
            elif row.verdict == "mixed":
                d["mixed"] = row.scan_count
            else:
                d["human"] = row.scan_count
            # Weighted average across verdicts
            if d["total"] > 0:
                d["avg_ai_probability"] = round(
                    (d.get("_prob_sum", 0) + row.avg_ai_probability * row.scan_count) / d["total"], 4
                )
                d["_prob_sum"] = d.get("_prob_sum", 0) + row.avg_ai_probability * row.scan_count

        # Clean internal tracking fields
        results = list(daily.values())
        for r in results:
            r.pop("_prob_sum", None)

        return results

    async def get_top_domains(
        self, db: AsyncSession, limit: int = 20, min_scans: int = 2,
    ) -> list[dict]:
        """
        Get top domains by scan count with their AI detection stats.
        Requires at least min_scans to be included.
        """
        stmt = (
            select(DomainStats)
            .where(DomainStats.scan_count >= min_scans)
            .order_by(DomainStats.scan_count.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        domains = result.scalars().all()

        return [
            {
                "domain": d.domain,
                "scan_count": d.scan_count,
                "ai_generated_count": d.ai_generated_count,
                "mixed_count": d.mixed_count,
                "human_count": d.human_count,
                "avg_ai_probability": round(d.avg_ai_probability, 4),
                "ai_rate": round(d.ai_rate, 4),
                "last_scanned": d.last_scanned_at.isoformat() if d.last_scanned_at else None,
            }
            for d in domains
        ]

    async def get_most_ai_domains(
        self, db: AsyncSession, limit: int = 10, min_scans: int = 3,
    ) -> list[dict]:
        """Get domains with highest AI detection rate (min scan threshold)."""
        stmt = (
            select(DomainStats)
            .where(DomainStats.scan_count >= min_scans)
            .order_by(DomainStats.avg_ai_probability.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        domains = result.scalars().all()

        return [
            {
                "domain": d.domain,
                "scan_count": d.scan_count,
                "avg_ai_probability": round(d.avg_ai_probability, 4),
                "ai_rate": round(d.ai_rate, 4),
            }
            for d in domains
        ]

    async def get_global_scan_summary(self, db: AsyncSession) -> dict:
        """
        Get overall scan statistics across all users.
        Used to enrich the dashboard with live data.
        """
        result = await db.execute(
            select(
                func.count(Scan.id).label("total_scans"),
                func.avg(Scan.ai_probability).label("avg_ai_probability"),
                func.count(case((Scan.verdict == "ai_generated", 1))).label("ai_count"),
                func.count(case((Scan.verdict == "mixed", 1))).label("mixed_count"),
                func.count(case((Scan.verdict == "human", 1))).label("human_count"),
                func.sum(Scan.tokens_used).label("total_tokens"),
                func.avg(Scan.scan_duration_ms).label("avg_duration_ms"),
            )
        )
        row = result.one()

        total = int(row.total_scans)

        return {
            "total_scans": total,
            "avg_ai_probability": round(float(row.avg_ai_probability or 0), 4),
            "verdict_breakdown": {
                "ai_generated": int(row.ai_count),
                "mixed": int(row.mixed_count),
                "human": int(row.human_count),
            },
            "verdict_rates": {
                "ai_generated": round(int(row.ai_count) / total, 4) if total > 0 else 0,
                "mixed": round(int(row.mixed_count) / total, 4) if total > 0 else 0,
                "human": round(int(row.human_count) / total, 4) if total > 0 else 0,
            },
            "total_tokens_used": int(row.total_tokens or 0),
            "avg_scan_duration_ms": int(row.avg_duration_ms or 0),
        }

    async def generate_dynamic_ticker_facts(self, db: AsyncSession) -> list[str]:
        """
        Generate ticker facts from live scan data to supplement
        the static research-sourced facts.
        Returns up to 5 dynamic facts.
        """
        facts = []

        # Total scans processed
        total_result = await db.execute(select(func.count(Scan.id)))
        total_scans = total_result.scalar() or 0

        if total_scans > 0:
            facts.append(
                f"{total_scans:,} URLs analyzed by deadinternet.report scanners"
            )

        # AI detection rate
        if total_scans >= 10:
            ai_result = await db.execute(
                select(func.count(Scan.id)).where(Scan.verdict == "ai_generated")
            )
            ai_count = ai_result.scalar() or 0
            ai_rate = round((ai_count / total_scans) * 100, 1)
            facts.append(
                f"{ai_rate}% of scanned URLs contain AI-generated content"
            )

        # Average AI probability
        if total_scans >= 10:
            avg_result = await db.execute(
                select(func.avg(Scan.ai_probability))
            )
            avg_prob = avg_result.scalar()
            if avg_prob is not None:
                facts.append(
                    f"Average AI probability across all scans: {round(avg_prob * 100, 1)}%"
                )

        # Most scanned domain
        top_domain_result = await db.execute(
            select(DomainStats)
            .order_by(DomainStats.scan_count.desc())
            .limit(1)
        )
        top_domain = top_domain_result.scalar_one_or_none()
        if top_domain and top_domain.scan_count >= 3:
            facts.append(
                f"Most analyzed domain: {top_domain.domain} ({top_domain.scan_count} scans)"
            )

        # Highest AI domain
        ai_domain_result = await db.execute(
            select(DomainStats)
            .where(DomainStats.scan_count >= 3)
            .order_by(DomainStats.avg_ai_probability.desc())
            .limit(1)
        )
        ai_domain = ai_domain_result.scalar_one_or_none()
        if ai_domain:
            facts.append(
                f"Highest AI detection rate: {ai_domain.domain} at {round(ai_domain.avg_ai_probability * 100, 1)}%"
            )

        return facts[:5]

    async def run_full_aggregation(self, db: AsyncSession, research_data: dict) -> dict:
        """
        Run complete aggregation pipeline:
        1. Compute daily aggregates for recent days
        2. Recompute domain statistics
        3. Calculate dynamic Dead Internet Index
        4. Generate dynamic ticker facts

        Returns the enriched stats dict ready for caching.
        """
        # 1. Aggregate last 7 days of scan data (catches up if missed)
        for i in range(7):
            target = date.today() - timedelta(days=i + 1)
            await self.compute_daily_aggregates(db, target)

        # 2. Recompute domain stats
        await self.compute_domain_stats(db)

        # 3. Calculate dynamic DII
        dii = await self.calculate_dead_internet_index(db, research_data)

        # 4. Get live scan summary
        summary = await self.get_global_scan_summary(db)

        # 5. Generate dynamic ticker facts
        dynamic_facts = await self.generate_dynamic_ticker_facts(db)

        # 6. Get scan volume trend
        volume_trend = await self.get_scan_volume_trend(db, days=30)

        # 7. Get top domains
        top_domains = await self.get_top_domains(db)

        await db.commit()

        return {
            "dead_internet_index": dii,
            "scan_summary": summary,
            "dynamic_ticker_facts": dynamic_facts,
            "scan_volume_trend": volume_trend,
            "top_domains": top_domains,
        }


aggregation_service = AggregationService()
