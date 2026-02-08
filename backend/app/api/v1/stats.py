"""
Stats endpoints - public dashboard data.
All data is cached in Redis, sourced from published research.

GET /api/v1/stats/          -> Full dataset
GET /api/v1/stats/platforms  -> Platform breakdown only
GET /api/v1/stats/timeline   -> Historical data only
GET /api/v1/stats/ticker     -> Ticker tape facts
"""

from fastapi import APIRouter
from app.services.stats_service import stats_service

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
    """The Dead Internet Index score."""
    stats = await stats_service.get_stats()
    return {
        "index": stats.get("dead_internet_index", 0.0),
        "last_updated": stats.get("last_updated"),
    }
