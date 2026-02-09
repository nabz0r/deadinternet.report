"""
Pydantic schemas for scan endpoints.
Request/response validation and serialization.
"""

from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime


# --- Requests ---

class ScanRequest(BaseModel):
    """POST /api/v1/scanner/scan"""
    url: HttpUrl = Field(..., max_length=2000)


# --- Responses ---

class ScanResult(BaseModel):
    """Scan analysis result."""
    id: str
    url: str
    ai_probability: float = Field(ge=0.0, le=1.0)
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
    used: int = Field(ge=0)
    limit: int = Field(ge=0)
    remaining: int = Field(ge=0)


class ScanResponse(BaseModel):
    """Full scan response with usage info."""
    result: ScanResult
    usage: ScanUsage
