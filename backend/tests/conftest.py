"""
Shared test fixtures for the deadinternet.report backend.

Provides:
  - Overridden settings with safe test defaults
  - Async SQLite test database (no Postgres needed)
  - FastAPI test client with dependency overrides
  - Mock Redis client
  - Authenticated user helpers
"""

import asyncio
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Patch settings BEFORE any app imports
import os

os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-validation"
os.environ["INTERNAL_API_SECRET"] = "test-internal-secret-long-enough"

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app


# ── Test database (async SQLite in-memory) ──────────────────────────

test_engine = create_async_engine(
    "sqlite+aiosqlite:///",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSession = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture
async def db_session():
    """Create tables and yield a test DB session, then tear down."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSession() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── Mock Redis ──────────────────────────────────────────────────────

class FakeRedis:
    """In-memory Redis substitute for tests."""

    def __init__(self):
        self._store: dict[str, str] = {}
        self._counters: dict[str, int] = {}

    async def get_cached(self, key: str) -> str | None:
        return self._store.get(key)

    async def set_cached(self, key: str, value: str, ttl: int = 3600):
        self._store[key] = value

    async def increment_daily(self, key: str) -> int:
        self._counters[key] = self._counters.get(key, 0) + 1
        return self._counters[key]

    async def connect(self):
        pass

    async def close(self):
        pass

    def reset(self):
        self._store.clear()
        self._counters.clear()


@pytest.fixture
def fake_redis():
    return FakeRedis()


# ── FastAPI test client ─────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db_session, fake_redis):
    """Async test client with dependency overrides."""
    from app.core import redis as redis_module
    from app.services import stats_service as stats_module

    # Override DB dependency
    async def override_get_db():
        yield db_session

    # Override Redis in all modules that import it
    original_redis = redis_module.redis_client
    redis_module.redis_client = fake_redis
    stats_module.redis_client = fake_redis

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    redis_module.redis_client = original_redis
    stats_module.redis_client = original_redis


# ── Auth helpers ────────────────────────────────────────────────────

def make_token(user_id: str = "test-user-123", email: str = "test@example.com", tier: str = "hunter") -> str:
    """Create a valid JWT token for testing."""
    payload = {
        "sub": user_id,
        "email": email,
        "tier": tier,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def auth_headers(user_id: str = "test-user-123", email: str = "test@example.com", tier: str = "hunter") -> dict:
    """Return Authorization headers for authenticated requests."""
    token = make_token(user_id, email, tier)
    return {"Authorization": f"Bearer {token}"}
