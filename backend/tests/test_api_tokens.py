"""
Tests for API token CRUD endpoints (Operator tier only).
Covers creation, listing, revocation, limits, and tier gating.
"""

import pytest
from tests.conftest import auth_headers, make_token


# ── Helpers ──────────────────────────────────────────────────────────

def operator_headers():
    return auth_headers(tier="operator")


def hunter_headers():
    return auth_headers(tier="hunter")


# ── Token Creation ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_token(client):
    """Operator can create an API token."""
    response = await client.post(
        "/api/v1/users/tokens",
        json={"name": "CI Pipeline"},
        headers=operator_headers(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "CI Pipeline"
    assert data["token"].startswith("dir_")
    assert len(data["token"]) == 68  # "dir_" + 64 hex chars
    assert data["token_prefix"] == data["token"][:8]
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_token_requires_operator(client):
    """Hunter tier cannot create API tokens."""
    response = await client.post(
        "/api/v1/users/tokens",
        json={"name": "My Token"},
        headers=hunter_headers(),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_token_requires_auth(client):
    """Unauthenticated request is rejected."""
    response = await client.post(
        "/api/v1/users/tokens",
        json={"name": "My Token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_token_validates_name(client):
    """Token name is required and max 100 chars."""
    # Empty name
    response = await client.post(
        "/api/v1/users/tokens",
        json={"name": ""},
        headers=operator_headers(),
    )
    assert response.status_code == 422

    # Name too long
    response = await client.post(
        "/api/v1/users/tokens",
        json={"name": "x" * 101},
        headers=operator_headers(),
    )
    assert response.status_code == 422


# ── Token Listing ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_tokens_empty(client):
    """List returns empty array when no tokens exist."""
    response = await client.get(
        "/api/v1/users/tokens",
        headers=operator_headers(),
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_tokens_after_creation(client):
    """List includes created tokens."""
    # Create two tokens
    await client.post(
        "/api/v1/users/tokens",
        json={"name": "Token A"},
        headers=operator_headers(),
    )
    await client.post(
        "/api/v1/users/tokens",
        json={"name": "Token B"},
        headers=operator_headers(),
    )

    response = await client.get(
        "/api/v1/users/tokens",
        headers=operator_headers(),
    )
    assert response.status_code == 200
    tokens = response.json()
    assert len(tokens) == 2
    names = {t["name"] for t in tokens}
    assert names == {"Token A", "Token B"}
    # Raw token should NOT be in list response
    for t in tokens:
        assert "token" not in t


@pytest.mark.asyncio
async def test_list_tokens_requires_operator(client):
    """Hunter tier cannot list API tokens."""
    response = await client.get(
        "/api/v1/users/tokens",
        headers=hunter_headers(),
    )
    assert response.status_code == 403


# ── Token Revocation ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_revoke_token(client):
    """Operator can revoke a token."""
    # Create
    create_resp = await client.post(
        "/api/v1/users/tokens",
        json={"name": "To Revoke"},
        headers=operator_headers(),
    )
    token_id = create_resp.json()["id"]

    # Revoke
    revoke_resp = await client.delete(
        f"/api/v1/users/tokens/{token_id}",
        headers=operator_headers(),
    )
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["revoked"] is True

    # Verify it shows as revoked in list
    list_resp = await client.get(
        "/api/v1/users/tokens",
        headers=operator_headers(),
    )
    tokens = list_resp.json()
    revoked_token = next(t for t in tokens if t["id"] == token_id)
    assert revoked_token["revoked"] is True


@pytest.mark.asyncio
async def test_revoke_nonexistent_token(client):
    """Revoking a nonexistent token returns 404."""
    response = await client.delete(
        "/api/v1/users/tokens/nonexistent-id",
        headers=operator_headers(),
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_revoke_already_revoked(client):
    """Revoking an already-revoked token returns 400."""
    # Create and revoke
    create_resp = await client.post(
        "/api/v1/users/tokens",
        json={"name": "Double Revoke"},
        headers=operator_headers(),
    )
    token_id = create_resp.json()["id"]
    await client.delete(
        f"/api/v1/users/tokens/{token_id}",
        headers=operator_headers(),
    )

    # Try to revoke again
    response = await client.delete(
        f"/api/v1/users/tokens/{token_id}",
        headers=operator_headers(),
    )
    assert response.status_code == 400


# ── Token Limit ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_max_token_limit(client):
    """Cannot create more than 5 active tokens."""
    headers = operator_headers()
    for i in range(5):
        resp = await client.post(
            "/api/v1/users/tokens",
            json={"name": f"Token {i}"},
            headers=headers,
        )
        assert resp.status_code == 200

    # 6th should fail
    resp = await client.post(
        "/api/v1/users/tokens",
        json={"name": "Token 6"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "Maximum" in resp.json()["detail"]
