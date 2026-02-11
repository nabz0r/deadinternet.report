"""
Stats endpoints - public dashboard data + live analytics.

GET /api/v1/stats/            -> Full dataset (research + live data)
GET /api/v1/stats/platforms    -> Platform breakdown only
GET /api/v1/stats/timeline     -> Historical data only
GET /api/v1/stats/ticker       -> Ticker tape facts (research + dynamic)
GET /api/v1/stats/index        -> Dead Internet Index score
GET /api/v1/stats/analytics    -> Live scan analytics (top domains, trends)
POST /api/v1/stats/aggregate   -> Trigger aggregation (internal only)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_internal
from app.services.stats_service import stats_service
from app.services.aggregation_service import aggregation_service

router = APIRouter()


@router.get("/")
async def get_all_stats():
    """Full stats dataset. Public, cached."""
    return await stats_service.get_stats()


@router.get("/platforms")
async def get_platforms():
    """Platform-specific bot/AI percentages."""
    stats = await stats_service.get_stats()
    return stats.get("platforms", {})


@router.get("/timeline")
async def get_timeline():
    """Historical timeline data for charts."""
    stats = await stats_service.get_stats()
    return stats.get("timeline", [])


@router.get("/ticker")
async def get_ticker():
    """Ticker tape facts for the scrolling bar."""
    stats = await stats_service.get_stats()
    return stats.get("ticker_facts", [])


@router.get("/index")
async def get_dead_index():
    """The Dead Internet Index score (dynamically calculated when live data exists)."""
    stats = await stats_service.get_stats()
    return {
        "index": stats.get("dead_internet_index", 0.0),
        "last_updated": stats.get("last_updated"),
    }


@router.get("/analytics")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
):
    """
    Live scan analytics. Public endpoint.
    Returns scan summary, top domains, and volume trend.
    Falls back to cached data if available.
    """
    # Try cache first
    live = await stats_service.get_live_stats()
    if live:
        return live

    # Compute on-demand if no cache
    research_data = stats_service.get_research_data()
    result = await aggregation_service.run_full_aggregation(db, research_data)

    # Cache for next request
    await stats_service.update_with_live_data(result)

    return result


@router.get("/domains")
async def get_top_domains(
    limit: int = Query(default=20, ge=1, le=100),
    min_scans: int = Query(default=2, ge=1, le=100),
    sort: str = Query(default="count", pattern="^(count|ai_rate|probability)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Top scanned domains with AI detection statistics.
    Sortable by scan count, AI rate, or average probability.
    """
    if sort == "ai_rate":
        domains = await aggregation_service.get_most_ai_domains(db, limit, min_scans)
    else:
        domains = await aggregation_service.get_top_domains(db, limit, min_scans)
    return domains


@router.get("/volume")
async def get_scan_volume(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Daily scan volume over the last N days."""
    return await aggregation_service.get_scan_volume_trend(db, days)


@router.post("/aggregate")
async def trigger_aggregation(
    _: dict = Depends(require_internal),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger the full aggregation pipeline.
    Internal-only (requires INTERNAL_API_SECRET).
    Designed to be called by a cron job or scheduler.
    """
    research_data = stats_service.get_research_data()
    result = await aggregation_service.run_full_aggregation(db, research_data)
    await stats_service.update_with_live_data(result)

    return {
        "status": "ok",
        "dead_internet_index": result.get("dead_internet_index"),
        "total_scans": result.get("scan_summary", {}).get("total_scans", 0),
        "domains_tracked": len(result.get("top_domains", [])),
    }
