"""
API Token model - programmatic access for Operator-tier users.
Tokens are hashed with SHA-256 before storage; the raw token is shown once at creation.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ApiToken(Base):
    __tablename__ = "api_tokens"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100))  # user-provided label
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # SHA-256 hex
    token_prefix: Mapped[str] = mapped_column(String(8))  # first 8 chars for identification

    revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relations
    user: Mapped["User"] = relationship(back_populates="api_tokens")

    def __repr__(self):
        return f"<ApiToken {self.token_prefix}... [{self.name}]>"
