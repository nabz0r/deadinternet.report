"""Initial schema - users, scans, subscriptions

Revision ID: 001_initial
Revises:
Create Date: 2026-02-10
"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("image", sa.String(500), nullable=True),
        sa.Column("tier", sa.String(20), nullable=False, server_default="ghost"),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "tier IN ('ghost', 'hunter', 'operator')", name="ck_user_tier"
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_stripe_customer_id", "users", ["stripe_customer_id"])

    # Scans table
    op.create_table(
        "scans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("url", sa.String(2000), nullable=False),
        sa.Column("ai_probability", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("verdict", sa.String(20), nullable=False),
        sa.Column("analysis", sa.Text, nullable=True),
        sa.Column("content_snippet", sa.Text, nullable=True),
        sa.Column("model_used", sa.String(50), nullable=False),
        sa.Column("tokens_used", sa.Integer, nullable=False, server_default="0"),
        sa.Column("scan_duration_ms", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "verdict IN ('human', 'mixed', 'ai_generated')", name="ck_scan_verdict"
        ),
        sa.CheckConstraint(
            "ai_probability >= 0.0 AND ai_probability <= 1.0",
            name="ck_scan_probability",
        ),
    )
    op.create_index("ix_scans_user_id", "scans", ["user_id"])
    op.create_index("ix_scans_url", "scans", ["url"])
    op.create_index("ix_scans_user_created", "scans", ["user_id", "created_at"])

    # Subscriptions table
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "stripe_subscription_id", sa.String(255), nullable=False, unique=True
        ),
        sa.Column("stripe_price_id", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("tier", sa.String(20), nullable=False),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired')",
            name="ck_sub_status",
        ),
        sa.CheckConstraint(
            "tier IN ('hunter', 'operator')", name="ck_sub_tier"
        ),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"], unique=True)
    op.create_index("ix_subscriptions_stripe_price_id", "subscriptions", ["stripe_price_id"])


def downgrade() -> None:
    op.drop_table("subscriptions")
    op.drop_table("scans")
    op.drop_table("users")
