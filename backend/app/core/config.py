"""
Application settings loaded from environment variables.
All config is centralized here - no magic strings elsewhere.
"""

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

    # Auth
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "https://deadinternet.report"]

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
