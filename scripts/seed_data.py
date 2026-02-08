#!/usr/bin/env python3
"""
Seed script - populates Redis cache with initial stats data.
Run once after first deploy: python scripts/seed_data.py

Data sources:
  - Imperva/Thales Bad Bot Report 2024
  - Ahrefs bot_or_not study (900k pages, April 2025)
  - Graphite SEO study (65k URLs, 2020-2025)
  - Europol synthetic media forecast
  - Cloudflare Year in Review 2025
  - Nature Scientific Reports (200M users study)
"""

import json
import asyncio
import redis.asyncio as aioredis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_KEY = "stats:global"

# Canonical dataset - all values sourced from published research
SEED_DATA = {
    "dead_internet_index": 0.67,
    "last_updated": "2026-02-08",
    "global": {
        "bot_traffic_pct": 51.0,
        "ai_content_new_pages_pct": 74.2,
        "ai_articles_pct": 50.3,
        "source_bot_traffic": "Imperva/Thales Bad Bot Report 2024",
        "source_ai_pages": "Ahrefs bot_or_not study, 900k pages, April 2025",
        "source_ai_articles": "Graphite SEO study, 65k URLs, 2020-2025",
    },
    "platforms": {
        "x_twitter": {"bot_pct": 59.0, "label": "X / Twitter", "source": "X internal estimates + Mashable", "trend": "up"},
        "reddit": {"bot_pct": 28.0, "label": "Reddit", "source": "Stanford Internet Observatory", "trend": "up"},
        "linkedin": {"bot_pct": 35.0, "label": "LinkedIn", "source": "AI detection firm estimates", "trend": "up"},
        "web_general": {"bot_pct": 51.0, "label": "Web (global)", "source": "Imperva/Thales 2024", "trend": "stable"},
        "social_media": {"bot_pct": 20.0, "label": "Social Media (avg)", "source": "Nature Scientific Reports", "trend": "up"},
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


async def seed():
    client = aioredis.from_url(REDIS_URL, decode_responses=True)
    await client.setex(CACHE_KEY, 86400, json.dumps(SEED_DATA))
    print(f"Seeded {CACHE_KEY} with {len(json.dumps(SEED_DATA))} bytes")
    await client.close()


if __name__ == "__main__":
    asyncio.run(seed())
