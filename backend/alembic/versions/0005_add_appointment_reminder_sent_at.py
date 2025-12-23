"""add appointment reminder sent at

Revision ID: 0005
Revises: 0004
Create Date: 2024-09-19 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "appointments", sa.Column("reminder_sent_at", sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("appointments", "reminder_sent_at")
