"""
Stats Service - aggregates and caches Dead Internet metrics.

Blends two data sources:
  1. Research data — published studies (static, authoritative)
  2. Live scan data — user scan results (dynamic, real-time)

The Dead Internet Index dynamically combines both sources
using a weighted formula. Stats are cached in Redis.
"""

import json
import logging
from datetime import date

from app.core.redis import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Research data (from published reports) ────────────────────────────
# This is the canonical dataset of curated statistics.
# Updated manually when new research reports are published.
RESEARCH_DATA = {
    "global": {
        "bot_traffic_pct": 51.0,
        "ai_content_new_pages_pct": 74.2,
        "ai_articles_pct": 50.3,
        "source_bot_traffic": "Imperva/Thales Bad Bot Report 2024",
        "source_ai_pages": "Ahrefs bot_or_not study, 900k pages, April 2025",
        "source_ai_articles": "Graphite SEO study, 65k URLs, 2020-2025",
    },
    "platforms": {
        "x_twitter": {
            "bot_pct": 59.0,
            "label": "X / Twitter",
            "source": "X internal estimates + Mashable Super Bowl analysis",
            "trend": "up",
        },
        "reddit": {
            "bot_pct": 28.0,
            "label": "Reddit",
            "source": "Stanford Internet Observatory estimates",
            "trend": "up",
        },
        "linkedin": {
            "bot_pct": 35.0,
            "label": "LinkedIn",
            "source": "Industry estimates from AI content detection firms",
            "trend": "up",
        },
        "web_general": {
            "bot_pct": 51.0,
            "label": "Web (global)",
            "source": "Imperva/Thales 2024 Bad Bot Report",
            "trend": "stable",
        },
        "social_media": {
            "bot_pct": 20.0,
            "label": "Social Media (avg)",
            "source": "Nature Scientific Reports, 200M users study",
            "trend": "up",
        },
    },
    "timeline": [
        {"year": 2014, "bot_pct": 59.1, "ai_content_pct": 0.0},
        {"year": 2015, "bot_pct": 53.0, "ai_content_pct": 0.0},
        {"year": 2016, "bot_pct": 51.8, "ai_content_pct": 0.0},
        {"year": 2017, "bot_pct": 42.2, "ai_content_pct": 0.0},
        {"year": 2018, "bot_pct": 37.9, "ai_content_pct": 0.1},
        {"year": 2019, "bot_pct": 37.2, "ai_content_pct": 0.2},
        {"year": 2020, "bot_pct": 40.8, "ai_content_pct": 1.0},
        {"year": 2021, "bot_pct": 42.3, "ai_content_pct": 2.0},
        {"year": 2022, "bot_pct": 47.4, "ai_content_pct": 5.0},
        {"year": 2023, "bot_pct": 49.6, "ai_content_pct": 15.0},
        {"year": 2024, "bot_pct": 51.0, "ai_content_pct": 50.3},
        {"year": 2025, "bot_pct": 53.5, "ai_content_pct": 74.2},
        {"year": 2026, "bot_pct": 56.0, "ai_content_pct": 82.0, "projected": True},
    ],
    "ticker_facts": [
        "75.85% of Super Bowl LVIII Twitter traffic was bots - Mashable",
        "OpenAI GPT bots now make up 13% of total web traffic",
        "Europol: up to 90% synthetic content by 2026",
        "74.2% of new web pages contain AI content - Ahrefs",
        "51% of all internet traffic is now bots - Imperva",
        "86% of top Google results are still human-written",
        "AI articles surpassed human articles in Nov 2024 - Graphite",
        "Bad bots account for 37% of all web traffic",
        "AI crawlers grew from 0% to 13% of traffic in 2 years",
        "Internet traffic grew 19% in 2025, mostly bots - Cloudflare",
    ],
}

# Legacy alias for backward compatibility
STATIC_STATS = {
    **RESEARCH_DATA,
    "dead_internet_index": 0.67,
    "last_updated": "2026-02-08",
}


class StatsService:
    """Serves cached statistics, blending research and live scan data."""

    CACHE_KEY = "stats:global"
    LIVE_CACHE_KEY = "stats:live"

    async def get_stats(self) -> dict:
        """
        Get the full stats payload.
        Tries enriched cache first, then falls back to static data.
        """
        cached = await redis_client.get_cached(self.CACHE_KEY)
        if cached:
            return json.loads(cached)

        # Cache miss: use static data and cache it
        stats = self._build_static_stats()
        await redis_client.set_cached(
            self.CACHE_KEY,
            json.dumps(stats),
            ttl=settings.stats_cache_ttl,
        )
        return stats

    async def get_live_stats(self) -> dict | None:
        """Get the live scan analytics from cache (if available)."""
        cached = await redis_client.get_cached(self.LIVE_CACHE_KEY)
        if cached:
            return json.loads(cached)
        return None

    async def update_with_live_data(self, live_data: dict):
        """
        Merge live aggregation data into the stats cache.
        Called by the aggregation pipeline after computing analytics.
        """
        stats = self._build_static_stats()

        # Override Dead Internet Index with dynamically calculated value
        if "dead_internet_index" in live_data:
            stats["dead_internet_index"] = live_data["dead_internet_index"]

        # Add scan analytics section
        if "scan_summary" in live_data:
            stats["scan_analytics"] = live_data["scan_summary"]

        # Append dynamic ticker facts to research facts
        if "dynamic_ticker_facts" in live_data:
            all_facts = stats["ticker_facts"] + live_data["dynamic_ticker_facts"]
            stats["ticker_facts"] = all_facts

        # Add scan volume trend
        if "scan_volume_trend" in live_data:
            stats["scan_volume_trend"] = live_data["scan_volume_trend"]

        # Add top domains
        if "top_domains" in live_data:
            stats["top_domains"] = live_data["top_domains"]

        stats["last_updated"] = date.today().isoformat()

        # Cache the enriched stats
        await redis_client.set_cached(
            self.CACHE_KEY,
            json.dumps(stats),
            ttl=settings.stats_cache_ttl,
        )

        # Also cache live data separately (for the analytics endpoint)
        await redis_client.set_cached(
            self.LIVE_CACHE_KEY,
            json.dumps(live_data),
            ttl=settings.stats_cache_ttl,
        )

        logger.info(
            "Updated stats cache with live data (DII=%.4f, scans=%d)",
            live_data.get("dead_internet_index", 0),
            live_data.get("scan_summary", {}).get("total_scans", 0),
        )

    async def refresh_cache(self, new_data: dict):
        """Update cached stats (called by update script)."""
        await redis_client.set_cached(
            self.CACHE_KEY,
            json.dumps(new_data),
            ttl=settings.stats_cache_ttl,
        )

    def get_research_data(self) -> dict:
        """Return the static research data (for aggregation service)."""
        return RESEARCH_DATA

    def _build_static_stats(self) -> dict:
        """Build the base stats dict from research data."""
        return {
            **RESEARCH_DATA,
            "dead_internet_index": 0.67,
            "last_updated": "2026-02-08",
        }


stats_service = StatsService()
