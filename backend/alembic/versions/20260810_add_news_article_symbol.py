"""add news article symbol

Revision ID: 20260810_news_article_symbol
Revises: 20260810_admin_role
Create Date: 2026-08-10
"""

from alembic import op
import sqlalchemy as sa

revision = "20260810_news_article_symbol"
down_revision = "20260810_admin_role"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("news_articles", sa.Column("symbol", sa.String(length=32), nullable=True))
    op.create_index(op.f("ix_news_articles_symbol"), "news_articles", ["symbol"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_news_articles_symbol"), table_name="news_articles")
    op.drop_column("news_articles", "symbol")
