"""add provider and clinic fields to users

Revision ID: 0002
Revises: 0001
Create Date: 2024-09-19 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("specialty", sa.String(), nullable=True))
    op.add_column("users", sa.Column("license_number", sa.String(), nullable=True))
    op.add_column("users", sa.Column("license_state", sa.String(), nullable=True))
    op.add_column("users", sa.Column("license_country", sa.String(), nullable=True))
    op.add_column("users", sa.Column("npi_number", sa.String(), nullable=True))
    op.add_column("users", sa.Column("taxonomy_code", sa.String(), nullable=True))
    op.add_column("users", sa.Column("clinic_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("clinic_address", sa.String(), nullable=True))
    op.add_column("users", sa.Column("clinic_city", sa.String(), nullable=True))
    op.add_column("users", sa.Column("clinic_state", sa.String(), nullable=True))
    op.add_column("users", sa.Column("clinic_zip", sa.String(), nullable=True))
    op.add_column("users", sa.Column("clinic_country", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "clinic_country")
    op.drop_column("users", "clinic_zip")
    op.drop_column("users", "clinic_state")
    op.drop_column("users", "clinic_city")
    op.drop_column("users", "clinic_address")
    op.drop_column("users", "clinic_name")
    op.drop_column("users", "taxonomy_code")
    op.drop_column("users", "npi_number")
    op.drop_column("users", "license_country")
    op.drop_column("users", "license_state")
    op.drop_column("users", "license_number")
    op.drop_column("users", "specialty")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
