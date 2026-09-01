"""Esquema inicial de aplicaciones y resultados.

Revision ID: 20260831_0001
Revises:
Create Date: 2026-08-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260831_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_applications")),
    )
    op.create_index(op.f("ix_applications_name"), "applications", ["name"], unique=True)

    op.create_table(
        "participant_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=8), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("first_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], name=op.f("fk_participant_codes_application_id_applications"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_participant_codes")),
    )
    op.create_index(op.f("ix_participant_codes_application_id"), "participant_codes", ["application_id"], unique=False)
    op.create_index(op.f("ix_participant_codes_code"), "participant_codes", ["code"], unique=True)

    op.create_table(
        "game_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("participant_code_id", sa.Integer(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False),
        sa.Column("access_token_hash", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("current_scene", sa.Integer(), nullable=False),
        sa.Column("current_step", sa.Integer(), nullable=False),
        sa.Column("completed_scenes", sa.Integer(), nullable=False),
        sa.Column("completed_questions", sa.Integer(), nullable=False),
        sa.Column("active_seconds", sa.Float(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["participant_code_id"], ["participant_codes.id"], name=op.f("fk_game_sessions_participant_code_id_participant_codes"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_game_sessions")),
        sa.UniqueConstraint("participant_code_id", "sequence", name="uq_session_code_sequence"),
    )
    op.create_index(op.f("ix_game_sessions_is_primary"), "game_sessions", ["is_primary"], unique=False)
    op.create_index(op.f("ix_game_sessions_participant_code_id"), "game_sessions", ["participant_code_id"], unique=False)
    op.create_index(op.f("ix_game_sessions_status"), "game_sessions", ["status"], unique=False)
    op.create_index("ix_sessions_status_last_activity", "game_sessions", ["status", "last_activity_at"], unique=False)

    op.create_table(
        "activity_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("game_session_id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("active_seconds", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["game_session_id"], ["game_sessions.id"], name=op.f("fk_activity_events_game_session_id_game_sessions"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_activity_events")),
        sa.UniqueConstraint("game_session_id", "event_id", name="uq_activity_session_event"),
    )
    op.create_index(op.f("ix_activity_events_game_session_id"), "activity_events", ["game_session_id"], unique=False)

    op.create_table(
        "attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("game_session_id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("scene_index", sa.Integer(), nullable=False),
        sa.Column("step_index", sa.Integer(), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("active_seconds_at_submit", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["game_session_id"], ["game_sessions.id"], name=op.f("fk_attempts_game_session_id_game_sessions"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_attempts")),
        sa.UniqueConstraint("game_session_id", "event_id", name="uq_attempt_session_event"),
    )
    op.create_index(op.f("ix_attempts_game_session_id"), "attempts", ["game_session_id"], unique=False)
    op.create_index(op.f("ix_attempts_is_correct"), "attempts", ["is_correct"], unique=False)
    op.create_index("ix_attempts_session_question", "attempts", ["game_session_id", "scene_index", "step_index"], unique=False)


def downgrade() -> None:
    op.drop_table("attempts")
    op.drop_table("activity_events")
    op.drop_table("game_sessions")
    op.drop_table("participant_codes")
    op.drop_table("applications")
