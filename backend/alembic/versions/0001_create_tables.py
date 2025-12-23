"""create tables

Revision ID: 0001
Revises:
Create Date: 2024-09-18 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String, nullable=False, unique=True),
        sa.Column("hashed_password", sa.String, nullable=False),
        sa.Column("full_name", sa.String, nullable=False),
        sa.Column("phone", sa.String),
        sa.Column("role", sa.Enum("admin", name="userrole"), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_table(
        "patients",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("full_name", sa.String, nullable=False),
        sa.Column("date_of_birth", sa.Date),
        sa.Column("phone", sa.String),
        sa.Column("email", sa.String),
        sa.Column("medical_history", sa.Text),
        sa.Column("medications", sa.Text),
        sa.Column("notes", sa.Text),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("patient_id", sa.Integer, sa.ForeignKey("patients.id")),
        sa.Column("doctor_name", sa.String, nullable=False),
        sa.Column("department", sa.String),
        sa.Column("appointment_datetime", sa.DateTime, nullable=False),
        sa.Column("notes", sa.Text),
        sa.Column(
            "status",
            sa.Enum("Scheduled", "Completed", "Cancelled", name="appointmentstatus"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("appointments")
    op.drop_table("patients")
    op.drop_table("users")
