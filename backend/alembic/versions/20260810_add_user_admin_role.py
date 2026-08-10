"""add user admin role

Revision ID: 20260810_admin_role
Revises: 71ad9151192c
Create Date: 2026-08-10
"""

from alembic import op
import sqlalchemy as sa

revision = "20260810_admin_role"
down_revision = "71ad9151192c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.alter_column("users", "is_admin", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "is_admin")
