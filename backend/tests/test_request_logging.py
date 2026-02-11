"""
Tests for the RequestLoggingMiddleware.
Covers logging behavior, skip paths, duration header, and log levels.
"""

import pytest


@pytest.mark.asyncio
async def test_adds_duration_header(client):
    """Every response should include X-Request-Duration-Ms header."""
    response = await client.get("/api/v1/stats/")
    assert "x-request-duration-ms" in response.headers
    duration = int(response.headers["x-request-duration-ms"])
    assert duration >= 0


@pytest.mark.asyncio
async def test_skips_health_check(client):
    """Health check responses should NOT have the duration header (skipped path)."""
    response = await client.get("/health")
    # Health check is in SKIP_PATHS, so middleware skips it entirely
    assert "x-request-duration-ms" not in response.headers


@pytest.mark.asyncio
async def test_duration_is_numeric(client):
    """Duration header value should be a valid integer."""
    response = await client.get("/api/v1/stats/platforms")
    duration_str = response.headers.get("x-request-duration-ms", "")
    assert duration_str.isdigit()


@pytest.mark.asyncio
async def test_logs_on_404(client):
    """Even 404 responses should get the duration header."""
    response = await client.get("/api/v1/nonexistent")
    assert response.status_code == 404
    assert "x-request-duration-ms" in response.headers


@pytest.mark.asyncio
async def test_logs_on_401(client):
    """Unauthorized responses should get the duration header."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert "x-request-duration-ms" in response.headers
