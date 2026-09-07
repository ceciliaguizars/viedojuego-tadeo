"""Contrato de datos para la experiencia definitiva.

Revision ID: 20260907_0002
Revises: 20260831_0001
Create Date: 2026-09-07
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260907_0002"
down_revision: Union[str, None] = "20260831_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "game_sessions",
        sa.Column("experience_version", sa.String(length=40), server_default="legacy-1", nullable=False),
    )
    op.add_column(
        "game_sessions",
        sa.Column("current_screen", sa.Integer(), server_default="1", nullable=False),
    )
    op.add_column(
        "game_sessions",
        sa.Column("progress_revision", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "game_sessions",
        sa.Column("progress_snapshot", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
    )
    op.add_column(
        "game_sessions",
        sa.Column("completion_event_id", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "game_sessions",
        sa.Column("ended_reason", sa.String(length=40), nullable=True),
    )
    op.create_index(
        op.f("ix_game_sessions_experience_version"),
        "game_sessions",
        ["experience_version"],
        unique=False,
    )

    op.create_table(
        "response_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("game_session_id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=64), nullable=False),
        sa.Column("situation", sa.Integer(), nullable=False),
        sa.Column("screen", sa.Integer(), nullable=False),
        sa.Column("activity_id", sa.String(length=120), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=True),
        sa.Column("validation_result", sa.Boolean(), nullable=True),
        sa.Column("client_created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["game_session_id"],
            ["game_sessions.id"],
            name=op.f("fk_response_submissions_game_session_id_game_sessions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_response_submissions")),
        sa.UniqueConstraint(
            "game_session_id",
            "event_id",
            name="uq_response_submission_session_event",
        ),
    )
    op.create_index(
        op.f("ix_response_submissions_game_session_id"),
        "response_submissions",
        ["game_session_id"],
        unique=False,
    )
    op.create_index(
        "ix_response_submission_session_location",
        "response_submissions",
        ["game_session_id", "situation", "screen"],
        unique=False,
    )

    op.create_table(
        "response_values",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("submission_id", sa.Integer(), nullable=False),
        sa.Column("field_id", sa.String(length=120), nullable=False),
        sa.Column("field_type", sa.String(length=40), nullable=False),
        sa.Column("literal_value", sa.Text(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("validation_result", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(
            ["submission_id"],
            ["response_submissions.id"],
            name=op.f("fk_response_values_submission_id_response_submissions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_response_values")),
        sa.UniqueConstraint(
            "submission_id",
            "field_id",
            name="uq_response_value_submission_field",
        ),
    )
    op.create_index(
        op.f("ix_response_values_submission_id"),
        "response_values",
        ["submission_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_response_values_field_id"),
        "response_values",
        ["field_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("response_values")
    op.drop_table("response_submissions")
    op.drop_index(op.f("ix_game_sessions_experience_version"), table_name="game_sessions")
    op.drop_column("game_sessions", "ended_reason")
    op.drop_column("game_sessions", "completion_event_id")
    op.drop_column("game_sessions", "progress_snapshot")
    op.drop_column("game_sessions", "progress_revision")
    op.drop_column("game_sessions", "current_screen")
    op.drop_column("game_sessions", "experience_version")
