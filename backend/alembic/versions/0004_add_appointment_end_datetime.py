"""add appointment end datetime

Revision ID: 0004
Revises: 0003
Create Date: 2024-09-19 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("appointments", sa.Column("appointment_end_datetime", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("appointments", "appointment_end_datetime")
