"""
Subscription model - tracks Stripe subscription state.
Synced via Stripe webhooks.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'canceled', 'past_due', 'trialing')", name="ck_sub_status"),
        CheckConstraint("tier IN ('hunter', 'operator')", name="ck_sub_tier"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), unique=True, index=True
    )
    stripe_subscription_id: Mapped[str] = mapped_column(String(255), unique=True)
    stripe_price_id: Mapped[str] = mapped_column(String(255))

    # State
    status: Mapped[str] = mapped_column(String(20))  # active|canceled|past_due|trialing
    tier: Mapped[str] = mapped_column(String(20))  # hunter|operator

    # Billing period
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relations
    user: Mapped["User"] = relationship(back_populates="subscription")

    def __repr__(self):
        return f"<Subscription {self.tier} [{self.status}]>"
