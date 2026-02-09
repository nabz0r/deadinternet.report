"""
Tests for the stats API endpoints.
Public endpoints that return cached research data.
"""

import pytest
import pytest_asyncio
from tests.conftest import FakeRedis


@pytest.mark.asyncio
async def test_get_all_stats(client):
    """GET /api/v1/stats/ returns full dataset."""
    response = await client.get("/api/v1/stats/")
    assert response.status_code == 200

    data = response.json()
    assert "dead_internet_index" in data
    assert "platforms" in data
    assert "timeline" in data
    assert "ticker_facts" in data
    assert data["dead_internet_index"] == 0.67


@pytest.mark.asyncio
async def test_get_platforms(client):
    """GET /api/v1/stats/platforms returns platform breakdown."""
    response = await client.get("/api/v1/stats/platforms")
    assert response.status_code == 200

    data = response.json()
    assert "x_twitter" in data
    assert "reddit" in data
    assert data["x_twitter"]["bot_pct"] == 59.0


@pytest.mark.asyncio
async def test_get_timeline(client):
    """GET /api/v1/stats/timeline returns historical data."""
    response = await client.get("/api/v1/stats/timeline")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["year"] == 2014


@pytest.mark.asyncio
async def test_get_ticker(client):
    """GET /api/v1/stats/ticker returns ticker facts."""
    response = await client.get("/api/v1/stats/ticker")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 10


@pytest.mark.asyncio
async def test_get_dead_index(client):
    """GET /api/v1/stats/index returns the Dead Internet Index."""
    response = await client.get("/api/v1/stats/index")
    assert response.status_code == 200

    data = response.json()
    assert "index" in data
    assert data["index"] == 0.67
    assert "last_updated" in data
