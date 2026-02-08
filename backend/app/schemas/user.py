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
