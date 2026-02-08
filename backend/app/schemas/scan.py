"""
Pydantic schemas for scan endpoints.
Request/response validation and serialization.
"""

from pydantic import BaseModel, HttpUrl
from datetime import datetime


# --- Requests ---

class ScanRequest(BaseModel):
    """POST /api/v1/scanner/scan"""
    url: HttpUrl


# --- Responses ---

class ScanResult(BaseModel):
    """Scan analysis result."""
    id: str
    url: str
    ai_probability: float  # 0.0 - 1.0
    verdict: str  # human | mixed | ai_generated
    analysis: str | None = None
    content_snippet: str | None = None
    model_used: str
    scan_duration_ms: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScanUsage(BaseModel):
    """Current scan usage info."""
    used: int
    limit: int
    remaining: int


class ScanResponse(BaseModel):
    """Full scan response with usage info."""
    result: ScanResult
    usage: ScanUsage
