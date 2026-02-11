"""Add scan_aggregates and domain_stats tables for analytics

Revision ID: 002_aggregation
Revises: 001_initial
Create Date: 2026-02-11

Adds pre-computed analytics tables:
  - scan_aggregates: daily rollups of scan verdicts
  - domain_stats: per-domain AI detection statistics
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "002_aggregation"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── scan_aggregates ──────────────────────────────────────────
    op.create_table(
        "scan_aggregates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("verdict", sa.String(20), nullable=False),
        sa.Column("scan_count", sa.Integer(), default=0),
        sa.Column("avg_ai_probability", sa.Float(), default=0.0),
        sa.Column("min_ai_probability", sa.Float(), default=0.0),
        sa.Column("max_ai_probability", sa.Float(), default=0.0),
        sa.Column("total_tokens_used", sa.Integer(), default=0),
        sa.Column("avg_scan_duration_ms", sa.Integer(), default=0),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("date", "verdict", name="uq_aggregate_date_verdict"),
    )
    op.create_index("ix_aggregate_date", "scan_aggregates", ["date"])

    # ── domain_stats ─────────────────────────────────────────────
    op.create_table(
        "domain_stats",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("domain", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("scan_count", sa.Integer(), default=0),
        sa.Column("ai_generated_count", sa.Integer(), default=0),
        sa.Column("mixed_count", sa.Integer(), default=0),
        sa.Column("human_count", sa.Integer(), default=0),
        sa.Column("avg_ai_probability", sa.Float(), default=0.0),
        sa.Column("last_scanned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_domain_scan_count", "domain_stats", ["scan_count"])
    op.create_index("ix_domain_avg_ai", "domain_stats", ["avg_ai_probability"])


def downgrade() -> None:
    op.drop_index("ix_domain_avg_ai", table_name="domain_stats")
    op.drop_index("ix_domain_scan_count", table_name="domain_stats")
    op.drop_table("domain_stats")
    op.drop_index("ix_aggregate_date", table_name="scan_aggregates")
    op.drop_table("scan_aggregates")
