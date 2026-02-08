"""
Redis client for caching and rate limiting.
Wraps redis-py async client with helper methods.
"""

import redis.asyncio as aioredis
from app.core.config import settings


class RedisClient:
    """Async Redis wrapper with connect/close lifecycle."""

    def __init__(self):
        self._client: aioredis.Redis | None = None

    async def connect(self):
        self._client = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
        )

    async def close(self):
        if self._client:
            await self._client.close()

    @property
    def client(self) -> aioredis.Redis:
        if not self._client:
            raise RuntimeError("Redis not connected. Call connect() first.")
        return self._client

    async def get_cached(self, key: str) -> str | None:
        """Get value from cache."""
        return await self.client.get(key)

    async def set_cached(self, key: str, value: str, ttl: int = 3600):
        """Set value with TTL."""
        await self.client.setex(key, ttl, value)

    async def increment_daily(self, key: str) -> int:
        """Increment a daily counter. Expires at midnight UTC."""
        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, 86400)  # 24h
        results = await pipe.execute()
        return results[0]


redis_client = RedisClient()
