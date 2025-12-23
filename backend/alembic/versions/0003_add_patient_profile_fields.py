"""add profile fields to patients

Revision ID: 0003
Revises: 0002
Create Date: 2024-09-19 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("patients", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("patients", sa.Column("last_name", sa.String(), nullable=True))
    op.add_column("patients", sa.Column("sex", sa.String(), nullable=True))
    op.add_column("patients", sa.Column("address", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("patients", "address")
    op.drop_column("patients", "sex")
    op.drop_column("patients", "last_name")
    op.drop_column("patients", "first_name")
