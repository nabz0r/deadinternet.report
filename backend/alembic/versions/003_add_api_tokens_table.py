"""Add api_tokens table for programmatic access

Revision ID: 003_api_tokens
Revises: 002_aggregation
Create Date: 2026-02-12

Adds api_tokens table for Operator-tier programmatic access:
  - SHA-256 hashed tokens (raw shown once at creation)
  - Linked to user with cascade delete
  - Token prefix stored for identification
  - Revocable with last_used_at tracking
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "003_api_tokens"
down_revision = "002_aggregation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "api_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("token_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("token_prefix", sa.String(8), nullable=False),
        sa.Column("revoked", sa.Boolean(), default=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_api_tokens_user_id", "api_tokens", ["user_id"])
    op.create_index("ix_api_tokens_token_hash", "api_tokens", ["token_hash"])


def downgrade() -> None:
    op.drop_index("ix_api_tokens_token_hash", table_name="api_tokens")
    op.drop_index("ix_api_tokens_user_id", table_name="api_tokens")
    op.drop_table("api_tokens")
