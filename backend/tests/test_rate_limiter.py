"""
Tests for the rate limiter.
Covers per-user, per-tier daily scan limits.
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from app.core.rate_limiter import check_scan_limit


@pytest.mark.asyncio
async def test_ghost_tier_blocked():
    """Ghost tier users cannot scan (0 limit)."""
    with pytest.raises(HTTPException) as exc_info:
        await check_scan_limit("user-1", "ghost")
    assert exc_info.value.status_code == 403
    assert "Hunter or Operator" in exc_info.value.detail


@pytest.mark.asyncio
async def test_hunter_first_scan():
    """Hunter tier first scan is allowed."""
    with patch("app.core.rate_limiter.redis_client") as mock_redis:
        mock_redis.increment_daily = AsyncMock(return_value=1)
        result = await check_scan_limit("user-1", "hunter")
        assert result["used"] == 1
        assert result["limit"] == 10
        assert result["remaining"] == 9


@pytest.mark.asyncio
async def test_hunter_limit_exceeded():
    """Hunter tier exceeding 10/day is blocked."""
    with patch("app.core.rate_limiter.redis_client") as mock_redis:
        mock_redis.increment_daily = AsyncMock(return_value=11)
        with pytest.raises(HTTPException) as exc_info:
            await check_scan_limit("user-1", "hunter")
        assert exc_info.value.status_code == 429
        assert "Daily scan limit" in exc_info.value.detail


@pytest.mark.asyncio
async def test_operator_high_limit():
    """Operator tier has 1000/day limit."""
    with patch("app.core.rate_limiter.redis_client") as mock_redis:
        mock_redis.increment_daily = AsyncMock(return_value=500)
        result = await check_scan_limit("user-1", "operator")
        assert result["used"] == 500
        assert result["limit"] == 1000
        assert result["remaining"] == 500


@pytest.mark.asyncio
async def test_unknown_tier_zero_limit():
    """Unknown tier defaults to 0 limit."""
    with patch("app.core.rate_limiter.redis_client") as mock_redis:
        mock_redis.increment_daily = AsyncMock(return_value=1)
        with pytest.raises(HTTPException) as exc_info:
            await check_scan_limit("user-1", "unknown_tier")
        assert exc_info.value.status_code == 429
