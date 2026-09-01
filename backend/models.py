from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    participant_codes: Mapped[list[ParticipantCode]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )


class ParticipantCode(Base):
    __tablename__ = "participant_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), index=True
    )
    code: Mapped[str] = mapped_column(String(8), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    first_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    application: Mapped[Application] = relationship(back_populates="participant_codes")
    sessions: Mapped[list[GameSession]] = relationship(
        back_populates="participant_code", cascade="all, delete-orphan"
    )


class GameSession(Base):
    __tablename__ = "game_sessions"
    __table_args__ = (
        UniqueConstraint("participant_code_id", "sequence", name="uq_session_code_sequence"),
        Index("ix_sessions_status_last_activity", "status", "last_activity_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    participant_code_id: Mapped[int] = mapped_column(
        ForeignKey("participant_codes.id", ondelete="CASCADE"), index=True
    )
    sequence: Mapped[int] = mapped_column(Integer)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    access_token_hash: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(20), default="in_progress", index=True)
    current_scene: Mapped[int] = mapped_column(Integer, default=0)
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    completed_scenes: Mapped[int] = mapped_column(Integer, default=0)
    completed_questions: Mapped[int] = mapped_column(Integer, default=0)
    active_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    participant_code: Mapped[ParticipantCode] = relationship(back_populates="sessions")
    attempts: Mapped[list[Attempt]] = relationship(
        back_populates="game_session",
        cascade="all, delete-orphan",
        order_by="Attempt.id",
    )
    activity_events: Mapped[list[ActivityEvent]] = relationship(
        back_populates="game_session", cascade="all, delete-orphan"
    )


class Attempt(Base):
    __tablename__ = "attempts"
    __table_args__ = (
        UniqueConstraint("game_session_id", "event_id", name="uq_attempt_session_event"),
        Index("ix_attempts_session_question", "game_session_id", "scene_index", "step_index"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_session_id: Mapped[str] = mapped_column(
        ForeignKey("game_sessions.id", ondelete="CASCADE"), index=True
    )
    event_id: Mapped[str] = mapped_column(String(36))
    scene_index: Mapped[int] = mapped_column(Integer)
    step_index: Mapped[int] = mapped_column(Integer)
    attempt_number: Mapped[int] = mapped_column(Integer)
    answers: Mapped[dict[str, Any]] = mapped_column(JSON)
    is_correct: Mapped[bool] = mapped_column(Boolean, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    active_seconds_at_submit: Mapped[float] = mapped_column(Float, default=0.0)

    game_session: Mapped[GameSession] = relationship(back_populates="attempts")


class ActivityEvent(Base):
    __tablename__ = "activity_events"
    __table_args__ = (
        UniqueConstraint("game_session_id", "event_id", name="uq_activity_session_event"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_session_id: Mapped[str] = mapped_column(
        ForeignKey("game_sessions.id", ondelete="CASCADE"), index=True
    )
    event_id: Mapped[str] = mapped_column(String(36))
    active_seconds: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    game_session: Mapped[GameSession] = relationship(back_populates="activity_events")
