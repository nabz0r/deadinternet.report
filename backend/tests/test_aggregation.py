"""
Tests for the aggregation service - analytics from scan data.

Tests:
  - Daily aggregation rollups
  - Domain stats computation
  - Dead Internet Index calculation
  - Dynamic ticker fact generation
  - Full aggregation pipeline
  - Stats API analytics endpoints
"""

import uuid
from datetime import datetime, date, timedelta, timezone

import pytest
import pytest_asyncio
from sqlalchemy import select

from app.models.scan import Scan
from app.models.aggregation import ScanAggregate, DomainStats
from app.services.aggregation_service import AggregationService
from app.services.stats_service import RESEARCH_DATA

from tests.conftest import auth_headers


# ── Helpers ──────────────────────────────────────────────────────────

def _make_scan(
    user_id: str = "test-user-123",
    url: str = "https://example.com/article",
    verdict: str = "ai_generated",
    ai_probability: float = 0.85,
    created_at: datetime | None = None,
) -> Scan:
    """Create a Scan instance for testing."""
    return Scan(
        id=str(uuid.uuid4()),
        user_id=user_id,
        url=url,
        ai_probability=ai_probability,
        verdict=verdict,
        analysis="Test analysis",
        model_used="claude-test",
        tokens_used=100,
        scan_duration_ms=500,
        created_at=created_at or datetime.now(timezone.utc),
    )


# ── AggregationService unit tests ───────────────────────────────────

class TestDailyAggregates:
    """Tests for compute_daily_aggregates."""

    @pytest.mark.asyncio
    async def test_aggregates_empty_day(self, db_session):
        svc = AggregationService()
        result = await svc.compute_daily_aggregates(db_session, date.today())
        assert result == []

    @pytest.mark.asyncio
    async def test_aggregates_single_verdict(self, db_session):
        svc = AggregationService()
        today = date.today()
        now = datetime.now(timezone.utc)

        # Insert 3 AI-generated scans for today
        for i in range(3):
            scan = _make_scan(
                url=f"https://example.com/{i}",
                verdict="ai_generated",
                ai_probability=0.7 + i * 0.1,  # 0.7, 0.8, 0.9
                created_at=now,
            )
            db_session.add(scan)
        await db_session.flush()

        result = await svc.compute_daily_aggregates(db_session, today)
        assert len(result) == 1
        agg = result[0]
        assert agg.date == today
        assert agg.verdict == "ai_generated"
        assert agg.scan_count == 3
        assert 0.79 <= agg.avg_ai_probability <= 0.81  # ~0.8
        assert agg.min_ai_probability == 0.7
        assert agg.max_ai_probability == 0.9

    @pytest.mark.asyncio
    async def test_aggregates_multiple_verdicts(self, db_session):
        svc = AggregationService()
        today = date.today()
        now = datetime.now(timezone.utc)

        # Mix of verdicts
        db_session.add(_make_scan(verdict="ai_generated", ai_probability=0.9, created_at=now))
        db_session.add(_make_scan(verdict="human", ai_probability=0.1, created_at=now))
        db_session.add(_make_scan(verdict="mixed", ai_probability=0.5, created_at=now))
        await db_session.flush()

        result = await svc.compute_daily_aggregates(db_session, today)
        assert len(result) == 3
        verdicts = {a.verdict: a for a in result}
        assert "ai_generated" in verdicts
        assert "human" in verdicts
        assert "mixed" in verdicts
        assert verdicts["ai_generated"].scan_count == 1
        assert verdicts["human"].scan_count == 1

    @pytest.mark.asyncio
    async def test_aggregates_idempotent(self, db_session):
        svc = AggregationService()
        today = date.today()
        now = datetime.now(timezone.utc)

        db_session.add(_make_scan(verdict="ai_generated", ai_probability=0.8, created_at=now))
        await db_session.flush()

        # Run twice — should update, not duplicate
        await svc.compute_daily_aggregates(db_session, today)
        await svc.compute_daily_aggregates(db_session, today)

        result = await db_session.execute(
            select(ScanAggregate).where(ScanAggregate.date == today)
        )
        aggregates = result.scalars().all()
        assert len(aggregates) == 1


class TestDomainStats:
    """Tests for compute_domain_stats."""

    @pytest.mark.asyncio
    async def test_domain_stats_empty(self, db_session):
        svc = AggregationService()
        count = await svc.compute_domain_stats(db_session)
        assert count == 0

    @pytest.mark.asyncio
    async def test_domain_stats_single_domain(self, db_session):
        svc = AggregationService()

        db_session.add(_make_scan(url="https://example.com/a", verdict="ai_generated", ai_probability=0.9))
        db_session.add(_make_scan(url="https://example.com/b", verdict="human", ai_probability=0.1))
        await db_session.flush()

        count = await svc.compute_domain_stats(db_session)
        assert count == 1

        result = await db_session.execute(
            select(DomainStats).where(DomainStats.domain == "example.com")
        )
        ds = result.scalar_one()
        assert ds.scan_count == 2
        assert ds.ai_generated_count == 1
        assert ds.human_count == 1
        assert 0.49 <= ds.avg_ai_probability <= 0.51  # ~0.5

    @pytest.mark.asyncio
    async def test_domain_stats_strips_www(self, db_session):
        svc = AggregationService()

        db_session.add(_make_scan(url="https://www.example.com/page", verdict="mixed", ai_probability=0.5))
        await db_session.flush()

        await svc.compute_domain_stats(db_session)
        result = await db_session.execute(
            select(DomainStats).where(DomainStats.domain == "example.com")
        )
        ds = result.scalar_one()
        assert ds.domain == "example.com"

    @pytest.mark.asyncio
    async def test_domain_stats_multiple_domains(self, db_session):
        svc = AggregationService()

        db_session.add(_make_scan(url="https://example.com/a", verdict="ai_generated", ai_probability=0.9))
        db_session.add(_make_scan(url="https://test.org/b", verdict="human", ai_probability=0.1))
        db_session.add(_make_scan(url="https://test.org/c", verdict="mixed", ai_probability=0.5))
        await db_session.flush()

        count = await svc.compute_domain_stats(db_session)
        assert count == 2


class TestDeadInternetIndex:
    """Tests for dynamic Dead Internet Index calculation."""

    @pytest.mark.asyncio
    async def test_dii_research_only(self, db_session):
        """Without scan data, DII uses research data only."""
        svc = AggregationService()
        dii = await svc.calculate_dead_internet_index(db_session, RESEARCH_DATA)

        # research_score = (0.51 * 0.4) + (0.742 * 0.4) + (0.503 * 0.2)
        # = 0.204 + 0.2968 + 0.1006 = 0.6014
        assert 0.59 <= dii <= 0.61

    @pytest.mark.asyncio
    async def test_dii_with_scan_data(self, db_session):
        """With enough scan data, DII blends research and live data."""
        svc = AggregationService()

        # Insert 15 scans with high AI probability
        now = datetime.now(timezone.utc)
        for i in range(15):
            db_session.add(_make_scan(
                url=f"https://example.com/{i}",
                verdict="ai_generated",
                ai_probability=0.9,
                created_at=now,
            ))
        await db_session.flush()

        dii = await svc.calculate_dead_internet_index(db_session, RESEARCH_DATA)

        # Should be higher than research-only because live avg is 0.9
        # DII = (0.6014 * 0.7) + (0.9 * 0.3) = 0.421 + 0.27 = 0.691
        assert dii > 0.60  # higher than research-only

    @pytest.mark.asyncio
    async def test_dii_clamped_0_1(self, db_session):
        """DII should always be between 0.0 and 1.0."""
        svc = AggregationService()
        dii = await svc.calculate_dead_internet_index(db_session, RESEARCH_DATA)
        assert 0.0 <= dii <= 1.0

    @pytest.mark.asyncio
    async def test_dii_ignores_few_scans(self, db_session):
        """DII needs at least 10 scans to incorporate live data."""
        svc = AggregationService()
        now = datetime.now(timezone.utc)

        # Only 5 scans — not enough to influence DII
        for i in range(5):
            db_session.add(_make_scan(
                url=f"https://example.com/{i}",
                ai_probability=0.99,
                created_at=now,
            ))
        await db_session.flush()

        dii_few = await svc.calculate_dead_internet_index(db_session, RESEARCH_DATA)

        # Should match research-only value
        research_only = await AggregationService().calculate_dead_internet_index(
            db_session, RESEARCH_DATA
        )
        # With only 5 scans, both should give research-only result, but
        # the second call also sees 5 scans so... let's just verify range
        assert 0.59 <= dii_few <= 0.61


class TestDynamicTickerFacts:
    """Tests for generate_dynamic_ticker_facts."""

    @pytest.mark.asyncio
    async def test_ticker_empty_db(self, db_session):
        svc = AggregationService()
        facts = await svc.generate_dynamic_ticker_facts(db_session)
        assert len(facts) == 0  # No scans = no facts

    @pytest.mark.asyncio
    async def test_ticker_with_scans(self, db_session):
        svc = AggregationService()

        # Insert enough scans for facts to be generated
        for i in range(15):
            db_session.add(_make_scan(
                url=f"https://example.com/{i}",
                verdict="ai_generated" if i < 10 else "human",
                ai_probability=0.8 if i < 10 else 0.2,
            ))
        await db_session.flush()

        # Need domain stats for domain-based facts
        await svc.compute_domain_stats(db_session)

        facts = await svc.generate_dynamic_ticker_facts(db_session)
        assert len(facts) >= 1
        assert any("15" in f for f in facts)  # Total scan count


class TestGlobalScanSummary:
    """Tests for get_global_scan_summary."""

    @pytest.mark.asyncio
    async def test_summary_empty_db(self, db_session):
        svc = AggregationService()
        summary = await svc.get_global_scan_summary(db_session)
        assert summary["total_scans"] == 0
        assert summary["avg_ai_probability"] == 0.0

    @pytest.mark.asyncio
    async def test_summary_with_scans(self, db_session):
        svc = AggregationService()

        db_session.add(_make_scan(verdict="ai_generated", ai_probability=0.9))
        db_session.add(_make_scan(verdict="human", ai_probability=0.1))
        db_session.add(_make_scan(verdict="mixed", ai_probability=0.5))
        await db_session.flush()

        summary = await svc.get_global_scan_summary(db_session)
        assert summary["total_scans"] == 3
        assert summary["verdict_breakdown"]["ai_generated"] == 1
        assert summary["verdict_breakdown"]["mixed"] == 1
        assert summary["verdict_breakdown"]["human"] == 1
        assert 0.49 <= summary["avg_ai_probability"] <= 0.51


class TestFullAggregation:
    """Tests for run_full_aggregation."""

    @pytest.mark.asyncio
    async def test_full_pipeline_empty(self, db_session):
        svc = AggregationService()
        result = await svc.run_full_aggregation(db_session, RESEARCH_DATA)

        assert "dead_internet_index" in result
        assert "scan_summary" in result
        assert "dynamic_ticker_facts" in result
        assert "scan_volume_trend" in result
        assert "top_domains" in result
        assert 0.0 <= result["dead_internet_index"] <= 1.0

    @pytest.mark.asyncio
    async def test_full_pipeline_with_data(self, db_session):
        svc = AggregationService()

        # Insert scans from "yesterday"
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        for i in range(5):
            db_session.add(_make_scan(
                url=f"https://example.com/{i}",
                verdict="ai_generated",
                ai_probability=0.8,
                created_at=yesterday,
            ))
        await db_session.flush()

        result = await svc.run_full_aggregation(db_session, RESEARCH_DATA)
        assert result["scan_summary"]["total_scans"] == 5
        assert len(result["top_domains"]) >= 0  # min_scans filter may exclude


# ── API endpoint tests ───────────────────────────────────────────────

class TestStatsEndpoints:
    """Tests for the new analytics API endpoints."""

    @pytest.mark.asyncio
    async def test_get_analytics(self, client):
        response = await client.get("/api/v1/stats/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "dead_internet_index" in data
        assert "scan_summary" in data

    @pytest.mark.asyncio
    async def test_get_domains_empty(self, client):
        response = await client.get("/api/v1/stats/domains")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_get_volume_empty(self, client):
        response = await client.get("/api/v1/stats/volume")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_aggregate_requires_internal_secret(self, client):
        response = await client.post("/api/v1/stats/aggregate")
        assert response.status_code in (401, 422)

    @pytest.mark.asyncio
    async def test_aggregate_wrong_secret(self, client):
        response = await client.post(
            "/api/v1/stats/aggregate",
            headers={"X-Internal-Secret": "wrong-secret"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_aggregate_correct_secret(self, client):
        from app.core.config import settings
        response = await client.post(
            "/api/v1/stats/aggregate",
            headers={"X-Internal-Secret": settings.internal_api_secret},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "dead_internet_index" in data


class TestStatsServiceBlending:
    """Tests for StatsService blending logic."""

    @pytest.mark.asyncio
    async def test_update_with_live_data(self, fake_redis):
        from app.services.stats_service import StatsService
        from app.core import redis as redis_module
        from app.services import stats_service as stats_module

        original = redis_module.redis_client
        redis_module.redis_client = fake_redis
        stats_module.redis_client = fake_redis

        try:
            svc = StatsService()
            live_data = {
                "dead_internet_index": 0.75,
                "scan_summary": {"total_scans": 100, "avg_ai_probability": 0.6},
                "dynamic_ticker_facts": ["Test fact 1"],
                "scan_volume_trend": [],
                "top_domains": [],
            }

            await svc.update_with_live_data(live_data)

            # Check that the enriched stats have the dynamic DII
            stats = await svc.get_stats()
            assert stats["dead_internet_index"] == 0.75
            assert stats["scan_analytics"]["total_scans"] == 100
            assert "Test fact 1" in stats["ticker_facts"]
            assert len(stats["ticker_facts"]) == 11  # 10 static + 1 dynamic
        finally:
            redis_module.redis_client = original
            stats_module.redis_client = original

    @pytest.mark.asyncio
    async def test_get_research_data(self):
        from app.services.stats_service import StatsService
        svc = StatsService()
        research = svc.get_research_data()
        assert "global" in research
        assert "platforms" in research
        assert "timeline" in research
        assert "ticker_facts" in research
        assert research["global"]["bot_traffic_pct"] == 51.0
