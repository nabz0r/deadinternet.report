"""
Scan model - stores URL analysis results from Claude.
Keeps history for premium users and analytics.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    url: Mapped[str] = mapped_column(String(2000))

    # Results
    ai_probability: Mapped[float] = mapped_column(Float, default=0.0)  # 0.0 - 1.0
    verdict: Mapped[str] = mapped_column(String(20))  # human|mixed|ai_generated
    analysis: Mapped[str | None] = mapped_column(Text)  # Detailed Claude analysis
    content_snippet: Mapped[str | None] = mapped_column(Text)  # First 500 chars analyzed

    # Meta
    model_used: Mapped[str] = mapped_column(String(50))  # Claude model version
    tokens_used: Mapped[int | None] = mapped_column(default=0)
    scan_duration_ms: Mapped[int | None] = mapped_column(default=0)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relations
    user: Mapped["User"] = relationship(back_populates="scans")

    def __repr__(self):
        return f"<Scan {self.url[:50]} -> {self.verdict} ({self.ai_probability:.0%})>"
