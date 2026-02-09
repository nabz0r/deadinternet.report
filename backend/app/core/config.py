"""Application settings loaded from environment variables.
All config is centralized here - no magic strings elsewhere.
"""

import sys
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List

# Known-bad secrets that must never be used in production
INSECURE_SECRETS = {"change-me", "secret", "password", "test", ""}


class Settings(BaseSettings):
    # General
    debug: bool = True
    api_version: str = "v1"

    # Database
    database_url: str = "postgresql+asyncpg://deadinet:deadinet@db:5432/deadinternet"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # Auth - MUST match NEXTAUTH_SECRET from frontend
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"

    # Internal secret for server-to-server calls (NextAuth -> FastAPI)
    internal_api_secret: str = ""

    @field_validator("jwt_secret", mode="after")
    @classmethod
    def validate_jwt_secret(cls, v):
        if v in INSECURE_SECRETS:
            print(
                "\n" + "=" * 60
                + "\nFATAL: JWT_SECRET is not set or uses an insecure default."
                + "\nGenerate one with: openssl rand -base64 32"
                + "\nSet it in your .env file as JWT_SECRET=<value>"
                + "\n" + "=" * 60 + "\n",
                file=sys.stderr,
            )
            raise ValueError("JWT_SECRET must be set to a secure value")
        if len(v) < 16:
            raise ValueError("JWT_SECRET must be at least 16 characters")
        return v

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
