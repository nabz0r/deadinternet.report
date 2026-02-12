"""
Tests for batch URL scanning endpoint (Operator tier only).
Covers validation, tier gating, and response structure.
"""

import pytest
from unittest.mock import AsyncMock, patch
from tests.conftest import auth_headers


def operator_headers():
    return auth_headers(tier="operator")


def hunter_headers():
    return auth_headers(tier="hunter")


# Mock check_scan_limit to avoid Redis dependency
def _mock_scan_limit(**kwargs):
    """Patch check_scan_limit to return fake usage."""
    return patch(
        "app.api.v1.scanner.check_scan_limit",
        new_callable=AsyncMock,
        return_value={"used": 1, "limit": 1000, "remaining": 999},
        **kwargs,
    )


@pytest.mark.asyncio
async def test_batch_scan_requires_operator(client):
    """Hunter tier cannot use batch scan."""
    response = await client.post(
        "/api/v1/scanner/batch",
        json={"urls": ["https://example.com"]},
        headers=hunter_headers(),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_batch_scan_requires_auth(client):
    """Unauthenticated request is rejected."""
    response = await client.post(
        "/api/v1/scanner/batch",
        json={"urls": ["https://example.com"]},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_batch_scan_empty_urls(client):
    """Empty URL list is rejected."""
    response = await client.post(
        "/api/v1/scanner/batch",
        json={"urls": []},
        headers=operator_headers(),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_batch_scan_too_many_urls(client):
    """More than 10 URLs is rejected."""
    urls = [f"https://example{i}.com" for i in range(11)]
    response = await client.post(
        "/api/v1/scanner/batch",
        json={"urls": urls},
        headers=operator_headers(),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_batch_scan_invalid_url(client):
    """Invalid URLs are rejected at validation."""
    response = await client.post(
        "/api/v1/scanner/batch",
        json={"urls": ["not-a-url"]},
        headers=operator_headers(),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_batch_scan_success(client):
    """Batch scan returns structured results for each URL."""
    mock_result = {
        "ai_probability": 0.85,
        "verdict": "ai_generated",
        "analysis": "Highly likely AI content.",
        "content_snippet": "Sample text...",
        "model_used": "claude-sonnet-4-5-20250929",
        "tokens_used": 300,
        "scan_duration_ms": 1200,
    }

    with (
        _mock_scan_limit(),
        patch(
            "app.api.v1.scanner.scanner_service.analyze",
            new_callable=AsyncMock,
            return_value=mock_result,
        ),
    ):
        response = await client.post(
            "/api/v1/scanner/batch",
            json={"urls": ["https://example.com", "https://test.com"]},
            headers=operator_headers(),
        )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["succeeded"] == 2
    assert data["failed"] == 0
    assert len(data["results"]) == 2

    for item in data["results"]:
        assert item["status"] == "success"
        assert item["result"]["ai_probability"] == 0.85
        assert item["result"]["verdict"] == "ai_generated"

    assert "usage" in data
    assert "used" in data["usage"]
    assert "limit" in data["usage"]


@pytest.mark.asyncio
async def test_batch_scan_partial_failure(client):
    """If some URLs fail, they are reported as errors."""

    async def mock_analyze(url):
        if "fail" in url:
            raise Exception("DNS resolution failed")
        return {
            "ai_probability": 0.3,
            "verdict": "human",
            "analysis": "Looks human.",
            "content_snippet": "Text...",
            "model_used": "claude-sonnet-4-5-20250929",
            "tokens_used": 200,
            "scan_duration_ms": 800,
        }

    with (
        _mock_scan_limit(),
        patch(
            "app.api.v1.scanner.scanner_service.analyze",
            side_effect=mock_analyze,
        ),
    ):
        response = await client.post(
            "/api/v1/scanner/batch",
            json={"urls": ["https://good.com", "https://fail.com"]},
            headers=operator_headers(),
        )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["succeeded"] == 1
    assert data["failed"] == 1

    success_items = [r for r in data["results"] if r["status"] == "success"]
    error_items = [r for r in data["results"] if r["status"] == "error"]
    assert len(success_items) == 1
    assert len(error_items) == 1
    assert "DNS" in error_items[0]["error"]
