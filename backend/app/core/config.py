"""
Application settings loaded from environment variables.
All config is centralized here - no magic strings elsewhere.

CRITICAL: jwt_secret and internal_api_secret MUST be set via env vars.
The app will refuse to start with insecure defaults.
"""

import sys
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # General
    debug: bool = False
    api_version: str = "v1"

    # Database
    database_url: str = "postgresql+asyncpg://deadinet:deadinet@db:5432/deadinternet"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # Auth - MUST match NEXTAUTH_SECRET from frontend
    # NO DEFAULT - must be set via environment variable
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"

    # Internal API secret for server-to-server calls (NextAuth -> FastAPI)
    # NO DEFAULT - must be set via environment variable
    internal_api_secret: str = ""

    # CORS - accepts comma-separated string or JSON array
    cors_origins: List[str] = ["http://localhost:3000", "https://deadinternet.report"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    # Anthropic
    anthropic_api_key: str = ""
    scanner_model: str = "claude-sonnet-4-5-20250929"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_hunter: str = ""
    stripe_price_operator: str = ""

    # Rate limits (scans per day)
    scan_rate_free: int = 0
    scan_rate_hunter: int = 10
    scan_rate_operator: int = 1000

    # Cache TTL (seconds)
    stats_cache_ttl: int = 3600  # 1 hour

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

# ── Startup validation ──────────────────────────────────────────────
_INSECURE_SECRETS = {"", "change-me", "secret", "test", "dev"}

if settings.jwt_secret.lower() in _INSECURE_SECRETS:
    print("\n❌ FATAL: JWT_SECRET is not set or uses an insecure default.")
    print("   Set a strong random value in your .env file:")
    print("   JWT_SECRET=$(openssl rand -hex 32)")
    sys.exit(1)

if settings.internal_api_secret.lower() in _INSECURE_SECRETS:
    print("\n❌ FATAL: INTERNAL_API_SECRET is not set or uses an insecure default.")
    print("   Set a strong random value in your .env file:")
    print("   INTERNAL_API_SECRET=$(openssl rand -hex 32)")
    sys.exit(1)
