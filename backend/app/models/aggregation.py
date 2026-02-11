"""
Aggregation models - pre-computed analytics from scan data.

ScanAggregate: daily rollups of scan verdicts and probabilities.
DomainStats: per-domain detection statistics across all users.
"""

import uuid
from datetime import datetime, date
from sqlalchemy import (
    String, Float, Integer, Date, DateTime, Index,
    UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ScanAggregate(Base):
    """Daily rollup of scan results by verdict."""

    __tablename__ = "scan_aggregates"
    __table_args__ = (
        UniqueConstraint("date", "verdict", name="uq_aggregate_date_verdict"),
        Index("ix_aggregate_date", "date"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    verdict: Mapped[str] = mapped_column(String(20), nullable=False)  # human|mixed|ai_generated
    scan_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_ai_probability: Mapped[float] = mapped_column(Float, default=0.0)
    min_ai_probability: Mapped[float] = mapped_column(Float, default=0.0)
    max_ai_probability: Mapped[float] = mapped_column(Float, default=0.0)
    total_tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    avg_scan_duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<ScanAggregate {self.date} {self.verdict}: {self.scan_count} scans>"


class DomainStats(Base):
    """Per-domain scan statistics aggregated across all users."""

    __tablename__ = "domain_stats"
    __table_args__ = (
        Index("ix_domain_scan_count", "scan_count"),
        Index("ix_domain_avg_ai", "avg_ai_probability"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    domain: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    scan_count: Mapped[int] = mapped_column(Integer, default=0)
    ai_generated_count: Mapped[int] = mapped_column(Integer, default=0)
    mixed_count: Mapped[int] = mapped_column(Integer, default=0)
    human_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_ai_probability: Mapped[float] = mapped_column(Float, default=0.0)
    last_scanned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def ai_rate(self) -> float:
        """Percentage of scans classified as AI-generated."""
        if self.scan_count == 0:
            return 0.0
        return self.ai_generated_count / self.scan_count

    def __repr__(self):
        return f"<DomainStats {self.domain}: {self.scan_count} scans, {self.avg_ai_probability:.0%} AI>"
