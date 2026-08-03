"""add stock schema

Revision ID: 20260804_add_stock_schema
Revises: 20260803_add_market_data
Create Date: 2026-08-04 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260804_add_stock_schema"
down_revision = "20260803_add_market_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("symbol", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("exchange", sa.String(length=64), nullable=True),
        sa.Column("currency", sa.String(length=16), nullable=True),
        sa.Column("sector", sa.String(length=128), nullable=True),
        sa.Column("industry", sa.String(length=128), nullable=True),
        sa.Column("country", sa.String(length=128), nullable=True),
        sa.Column("market_cap", sa.BigInteger(), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("symbol", name="uq_stocks_symbol"),
    )

    op.create_table(
        "historical_prices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("stock_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("open", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("high", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("low", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("close", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("adjusted_close", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("volume", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["stock_id"], ["stocks.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("stock_id", "date", name="uq_historical_prices_stock_date"),
        sa.CheckConstraint("high >= low", name="ck_historical_prices_high_gte_low"),
        sa.CheckConstraint(
            "open > 0 AND high > 0 AND low > 0 AND close > 0 AND adjusted_close > 0",
            name="ck_historical_prices_positive_prices",
        ),
        sa.CheckConstraint("volume >= 0", name="ck_historical_prices_volume_nonneg"),
    )
    op.create_index(
        op.f("ix_historical_prices_stock_id"), "historical_prices", ["stock_id"], unique=False
    )

    op.create_table(
        "technical_indicators",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("stock_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("rsi", sa.Float(), nullable=True),
        sa.Column("sma_20", sa.Float(), nullable=True),
        sa.Column("sma_50", sa.Float(), nullable=True),
        sa.Column("ema_20", sa.Float(), nullable=True),
        sa.Column("ema_50", sa.Float(), nullable=True),
        sa.Column("macd", sa.Float(), nullable=True),
        sa.Column("macd_signal", sa.Float(), nullable=True),
        sa.Column("macd_histogram", sa.Float(), nullable=True),
        sa.Column("bollinger_upper", sa.Float(), nullable=True),
        sa.Column("bollinger_middle", sa.Float(), nullable=True),
        sa.Column("bollinger_lower", sa.Float(), nullable=True),
        sa.Column("atr", sa.Float(), nullable=True),
        sa.Column("adx", sa.Float(), nullable=True),
        sa.Column("obv", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["stock_id"], ["stocks.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("stock_id", "date", name="uq_technical_indicators_stock_date"),
        sa.CheckConstraint(
            "rsi IS NULL OR (rsi >= 0 AND rsi <= 100)", name="ck_technical_indicators_rsi_range"
        ),
        sa.CheckConstraint(
            "adx IS NULL OR (adx >= 0 AND adx <= 100)", name="ck_technical_indicators_adx_range"
        ),
    )
    op.create_index(
        op.f("ix_technical_indicators_stock_id"), "technical_indicators", ["stock_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_technical_indicators_stock_id"), table_name="technical_indicators")
    op.drop_table("technical_indicators")
    op.drop_index(op.f("ix_historical_prices_stock_id"), table_name="historical_prices")
    op.drop_table("historical_prices")
    op.drop_table("stocks")
