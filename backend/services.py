from __future__ import annotations

import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from .config import settings
from .models import ActivityEvent, Attempt, GameSession, ParticipantCode, ResponseSubmission, utc_now
from .security import hash_token, new_access_token


CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def generate_unique_codes(database: Session, application_id: int, count: int) -> list[ParticipantCode]:
    created: list[ParticipantCode] = []
    while len(created) < count:
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(8))
        exists = database.scalar(select(ParticipantCode.id).where(ParticipantCode.code == code))
        if exists:
            continue
        item = ParticipantCode(application_id=application_id, code=code)
        database.add(item)
        created.append(item)
    database.commit()
    return created


def mark_stale_sessions(database: Session) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=settings.stale_session_minutes)
    database.execute(
        update(GameSession)
        .where(GameSession.status == "in_progress", GameSession.last_activity_at < cutoff)
        .values(status="abandoned")
    )
    database.commit()


def verify_session_access(game_session: GameSession, token: str) -> bool:
    return secrets.compare_digest(game_session.access_token_hash, hash_token(token))


def load_session(database: Session, session_id: str) -> GameSession | None:
    return database.scalar(
        select(GameSession)
        .options(
            selectinload(GameSession.attempts),
            selectinload(GameSession.response_submissions).selectinload(ResponseSubmission.values),
            selectinload(GameSession.participant_code).selectinload(ParticipantCode.application),
        )
        .where(GameSession.id == session_id)
    )


def create_or_resume_session(
    database: Session,
    participant_code: ParticipantCode,
    resume_session_id: str | None,
    resume_token: str | None,
    experience_version: str = "legacy-1",
    force_new: bool = False,
) -> tuple[GameSession, str, bool]:
    if not force_new and resume_session_id and resume_token:
        existing = load_session(database, resume_session_id)
        if (
            existing
            and existing.participant_code_id == participant_code.id
            and existing.experience_version == experience_version
            and verify_session_access(existing, resume_token)
        ):
            existing.last_activity_at = utc_now()
            if existing.status == "abandoned" and existing.completed_scenes < 5:
                existing.status = "in_progress"
            database.commit()
            return existing, resume_token, True

    if not force_new and experience_version != "legacy-1":
        recoverable = database.scalar(
            select(GameSession)
            .where(
                GameSession.participant_code_id == participant_code.id,
                GameSession.experience_version == experience_version,
                GameSession.completed_at.is_(None),
            )
            .order_by(GameSession.started_at.desc())
            .limit(1)
        )
        if recoverable:
            token = new_access_token()
            recoverable.access_token_hash = hash_token(token)
            recoverable.last_activity_at = utc_now()
            if recoverable.status == "abandoned":
                recoverable.status = "in_progress"
            database.commit()
            return load_session(database, recoverable.id) or recoverable, token, True

    previous_count = database.scalar(
        select(func.count(GameSession.id)).where(GameSession.participant_code_id == participant_code.id)
    ) or 0
    token = new_access_token()
    game_session = GameSession(
        id=str(uuid.uuid4()),
        participant_code_id=participant_code.id,
        sequence=previous_count + 1,
        is_primary=previous_count == 0,
        access_token_hash=hash_token(token),
        experience_version=experience_version,
        current_screen=2 if experience_version != "legacy-1" else 1,
    )
    if participant_code.first_used_at is None:
        participant_code.first_used_at = utc_now()
    database.add(game_session)
    database.commit()
    database.refresh(game_session)
    return load_session(database, game_session.id) or game_session, token, False


def attempt_number_for(database: Session, session_id: str, scene_index: int, step_index: int) -> int:
    count = database.scalar(
        select(func.count(Attempt.id)).where(
            Attempt.game_session_id == session_id,
            Attempt.scene_index == scene_index,
            Attempt.step_index == step_index,
        )
    ) or 0
    return count + 1


def existing_attempt(database: Session, session_id: str, event_id: str) -> Attempt | None:
    return database.scalar(
        select(Attempt).where(
            Attempt.game_session_id == session_id,
            Attempt.event_id == event_id,
        )
    )


def existing_activity(database: Session, session_id: str, event_id: str) -> ActivityEvent | None:
    return database.scalar(
        select(ActivityEvent).where(
            ActivityEvent.game_session_id == session_id,
            ActivityEvent.event_id == event_id,
        )
    )


def existing_response(database: Session, session_id: str, event_id: str) -> ResponseSubmission | None:
    return database.scalar(
        select(ResponseSubmission)
        .where(
            ResponseSubmission.game_session_id == session_id,
            ResponseSubmission.event_id == event_id,
        )
        .options(selectinload(ResponseSubmission.values))
    )


def response_attempt_number_for(
    database: Session,
    session_id: str,
    activity_id: str,
) -> int:
    count = database.scalar(
        select(func.count(ResponseSubmission.id)).where(
            ResponseSubmission.game_session_id == session_id,
            ResponseSubmission.activity_id == activity_id,
            ResponseSubmission.validation_result.is_not(None),
        )
    ) or 0
    return count + 1
