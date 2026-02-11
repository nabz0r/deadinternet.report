"""
Pydantic schemas for user endpoints.
"""

from pydantic import BaseModel
from datetime import datetime


class UserProfile(BaseModel):
    """User profile response."""
    id: str
    email: str
    name: str | None = None
    image: str | None = None
    tier: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User usage statistics."""
    total_scans: int
    scans_today: int
    daily_limit: int
    tier: str


class DomainAnalytics(BaseModel):
    """Domain-level analytics item for user's scans."""
    domain: str
    scan_count: int
    ai_generated_count: int
    mixed_count: int
    human_count: int
    avg_ai_probability: float
    ai_rate: float


class DailyActivity(BaseModel):
    """Daily scan activity entry."""
    date: str
    total: int
    ai_generated: int
    mixed: int
    human: int


class VerdictBreakdown(BaseModel):
    """Verdict counts."""
    ai_generated: int
    mixed: int
    human: int


class UserAnalyticsResponse(BaseModel):
    """User personal scan analytics."""
    total_scans: int
    scans_this_month: int
    avg_ai_probability: float
    verdict_breakdown: VerdictBreakdown
    top_domains: list[DomainAnalytics]
    recent_activity: list[DailyActivity]
