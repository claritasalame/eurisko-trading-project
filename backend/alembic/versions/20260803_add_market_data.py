"""add market_data table

Revision ID: 20260803_add_market_data
Revises: 20260803_initial_schema
Create Date: 2026-08-03 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260803_add_market_data"
down_revision = "20260803_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "market_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("symbol", sa.String(length=32), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("day_change_percent", sa.Float(), nullable=False),
        sa.Column("volume", sa.BigInteger(), nullable=True),
        sa.Column("fetched_at", sa.DateTime(), nullable=False),
    )
    op.create_index(op.f("ix_market_data_symbol"), "market_data", ["symbol"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_market_data_symbol"), table_name="market_data")
    op.drop_table("market_data")
