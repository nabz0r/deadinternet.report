"""
Redis-based rate limiter for the URL scanner.
Limits are per-user, per-day, based on subscription tier.
"""

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.redis import redis_client


TIER_LIMITS = {
    "ghost": settings.scan_rate_free,
    "hunter": settings.scan_rate_hunter,
    "operator": settings.scan_rate_operator,
}


async def check_scan_limit(user_id: str, tier: str) -> dict:
    """
    Check if user has remaining scans for today.
    Returns usage info dict.
    """
    limit = TIER_LIMITS.get(tier, 0)

    # Operator with 1000 = effectively unlimited
    if limit <= 0 and tier == "ghost":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Scanner requires Hunter or Operator tier",
        )

    key = f"scan_count:{user_id}"
    current = await redis_client.increment_daily(key)

    if current > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily scan limit reached ({limit}/day for {tier} tier)",
            headers={"X-RateLimit-Limit": str(limit), "X-RateLimit-Remaining": "0"},
        )

    return {
        "used": current,
        "limit": limit,
        "remaining": limit - current,
    }
