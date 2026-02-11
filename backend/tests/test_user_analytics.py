"""
Tests for the /users/me/analytics endpoint.
Covers empty state, single scan, multiple scans, domain grouping, and monthly counts.
"""

import uuid
import pytest
from datetime import datetime, timedelta, timezone

from tests.conftest import auth_headers
from app.core.config import settings
from app.models.user import User
from app.models.scan import Scan


async def _create_user(db, user_id="test-user-123", email="test@example.com", tier="hunter"):
    """Helper to create a user in the test DB."""
    user = User(id=user_id, email=email, name="Test User", tier=tier)
    db.add(user)
    await db.flush()
    return user


async def _create_scan(db, user_id, url, verdict="ai_generated", ai_prob=0.9, created_at=None):
    """Helper to create a scan in the test DB."""
    scan = Scan(
        id=str(uuid.uuid4()),
        user_id=user_id,
        url=url,
        verdict=verdict,
        ai_probability=ai_prob,
        model_used="claude-3-haiku",
        tokens_used=100,
        scan_duration_ms=500,
    )
    if created_at:
        scan.created_at = created_at
    db.add(scan)
    await db.flush()
    return scan


@pytest.mark.asyncio
async def test_analytics_requires_auth(client):
    """Analytics endpoint requires authentication."""
    response = await client.get("/api/v1/users/me/analytics")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_analytics_empty(client, db_session):
    """Analytics with no scans returns zero values."""
    await _create_user(db_session)

    response = await client.get(
        "/api/v1/users/me/analytics",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_scans"] == 0
    assert data["scans_this_month"] == 0
    assert data["avg_ai_probability"] == 0.0
    assert data["verdict_breakdown"]["ai_generated"] == 0
    assert data["verdict_breakdown"]["mixed"] == 0
    assert data["verdict_breakdown"]["human"] == 0
    assert data["top_domains"] == []
    assert data["recent_activity"] == []


@pytest.mark.asyncio
async def test_analytics_with_scans(client, db_session):
    """Analytics correctly aggregates user scans."""
    await _create_user(db_session)

    now = datetime.now(timezone.utc)
    await _create_scan(db_session, "test-user-123", "https://example.com/page1", "ai_generated", 0.95, now)
    await _create_scan(db_session, "test-user-123", "https://example.com/page2", "mixed", 0.5, now)
    await _create_scan(db_session, "test-user-123", "https://other.org/article", "human", 0.1, now)

    response = await client.get(
        "/api/v1/users/me/analytics",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total_scans"] == 3
    assert data["scans_this_month"] == 3
    assert data["verdict_breakdown"]["ai_generated"] == 1
    assert data["verdict_breakdown"]["mixed"] == 1
    assert data["verdict_breakdown"]["human"] == 1

    # avg_ai_probability = (0.95 + 0.5 + 0.1) / 3 ≈ 0.5167
    assert 0.51 <= data["avg_ai_probability"] <= 0.52


@pytest.mark.asyncio
async def test_analytics_domain_grouping(client, db_session):
    """Analytics groups scans by domain and strips www prefix."""
    await _create_user(db_session)

    now = datetime.now(timezone.utc)
    await _create_scan(db_session, "test-user-123", "https://www.example.com/a", "ai_generated", 0.9, now)
    await _create_scan(db_session, "test-user-123", "https://example.com/b", "ai_generated", 0.8, now)
    await _create_scan(db_session, "test-user-123", "https://other.org/c", "human", 0.1, now)

    response = await client.get(
        "/api/v1/users/me/analytics",
        headers=auth_headers(),
    )
    data = response.json()

    domains = {d["domain"]: d for d in data["top_domains"]}
    assert "example.com" in domains
    assert domains["example.com"]["scan_count"] == 2
    assert domains["example.com"]["ai_generated_count"] == 2
    assert "other.org" in domains
    assert domains["other.org"]["scan_count"] == 1


@pytest.mark.asyncio
async def test_analytics_monthly_count(client, db_session):
    """Scans this month only counts current-month scans."""
    await _create_user(db_session)

    now = datetime.now(timezone.utc)
    old = now - timedelta(days=45)

    await _create_scan(db_session, "test-user-123", "https://example.com/new", "ai_generated", 0.9, now)
    await _create_scan(db_session, "test-user-123", "https://example.com/old", "human", 0.1, old)

    response = await client.get(
        "/api/v1/users/me/analytics",
        headers=auth_headers(),
    )
    data = response.json()

    assert data["total_scans"] == 2
    assert data["scans_this_month"] == 1


@pytest.mark.asyncio
async def test_analytics_recent_activity(client, db_session):
    """Recent activity returns daily breakdown for last 30 days."""
    await _create_user(db_session)

    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)

    await _create_scan(db_session, "test-user-123", "https://example.com/1", "ai_generated", 0.9, now)
    await _create_scan(db_session, "test-user-123", "https://example.com/2", "human", 0.1, now)
    await _create_scan(db_session, "test-user-123", "https://example.com/3", "mixed", 0.5, yesterday)

    response = await client.get(
        "/api/v1/users/me/analytics",
        headers=auth_headers(),
    )
    data = response.json()

    assert len(data["recent_activity"]) == 2
    # Activity should be sorted by date
    dates = [entry["date"] for entry in data["recent_activity"]]
    assert dates == sorted(dates)


@pytest.mark.asyncio
async def test_analytics_isolates_users(client, db_session):
    """Analytics only shows scans for the authenticated user."""
    await _create_user(db_session, "test-user-123", "test@example.com")
    other_user = User(id="other-user", email="other@example.com", name="Other", tier="hunter")
    db_session.add(other_user)
    await db_session.flush()

    now = datetime.now(timezone.utc)
    await _create_scan(db_session, "test-user-123", "https://example.com/mine", "ai_generated", 0.9, now)
    await _create_scan(db_session, "other-user", "https://example.com/theirs", "human", 0.1, now)

    response = await client.get(
        "/api/v1/users/me/analytics",
        headers=auth_headers(),
    )
    data = response.json()

    assert data["total_scans"] == 1
    assert data["verdict_breakdown"]["ai_generated"] == 1
    assert data["verdict_breakdown"]["human"] == 0
