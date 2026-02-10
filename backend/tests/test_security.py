"""
Tests for JWT authentication and authorization.
Covers token validation, tier enforcement, and edge cases.
"""

import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from tests.conftest import auth_headers, make_token
from app.core.config import settings


@pytest.mark.asyncio
async def test_health_check_no_auth(client):
    """Health check is always public. Returns 200 (healthy) or 503 (degraded)."""
    response = await client.get("/health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert data["service"] == "deadinternet-api"
    assert data["status"] in ("healthy", "degraded")


@pytest.mark.asyncio
async def test_protected_endpoint_no_token(client):
    """Accessing protected endpoint without token returns 401."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_endpoint_invalid_token(client):
    """Invalid JWT token returns 401."""
    headers = {"Authorization": "Bearer invalid-token-here"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_expired_token(client):
    """Expired JWT token returns 401."""
    payload = {
        "sub": "user-123",
        "email": "test@example.com",
        "tier": "hunter",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_token_missing_sub(client):
    """Token without sub claim returns 401."""
    payload = {
        "email": "test@example.com",
        "tier": "hunter",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_token_wrong_secret(client):
    """Token signed with wrong secret returns 401."""
    payload = {
        "sub": "user-123",
        "email": "test@example.com",
        "tier": "hunter",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_scanner_requires_hunter_tier(client):
    """Ghost tier cannot access scanner endpoints."""
    headers = auth_headers(tier="ghost")
    response = await client.post(
        "/api/v1/scanner/scan",
        json={"url": "https://example.com"},
        headers=headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_internal_sync_requires_secret(client):
    """/users/sync without internal secret returns 401."""
    response = await client.post(
        "/api/v1/users/sync",
        json={"id": "user-1", "email": "test@example.com"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_internal_sync_wrong_secret(client):
    """/users/sync with wrong secret returns 403."""
    response = await client.post(
        "/api/v1/users/sync",
        json={"id": "user-1", "email": "test@example.com"},
        headers={"X-Internal-Secret": "wrong-secret"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_internal_sync_creates_user(client):
    """/users/sync with correct secret creates user."""
    response = await client.post(
        "/api/v1/users/sync",
        json={
            "id": "new-user-1",
            "email": "new@example.com",
            "name": "Test User",
        },
        headers={"X-Internal-Secret": settings.internal_api_secret},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tier"] == "ghost"
    assert data["synced"] is True
    assert data.get("created") is True
