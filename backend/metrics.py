from __future__ import annotations

from datetime import datetime, timezone
from statistics import mean, median
from typing import Iterable

from .models import Attempt, GameSession


TOTAL_SCENES = 5
TOTAL_QUESTIONS = 21


def ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def elapsed_seconds(game_session: GameSession, now: datetime | None = None) -> float:
    endpoint = game_session.completed_at
    if endpoint is None and game_session.status == "abandoned":
        endpoint = game_session.last_activity_at
    endpoint = endpoint or now or datetime.now(timezone.utc)
    return max(0.0, (ensure_aware(endpoint) - ensure_aware(game_session.started_at)).total_seconds())


def session_metrics(game_session: GameSession, now: datetime | None = None) -> dict[str, float | int | None]:
    attempts = list(game_session.attempts)
    attempted_questions = sorted({(attempt.scene_index, attempt.step_index) for attempt in attempts})
    correct_attempts = sum(1 for attempt in attempts if attempt.is_correct)
    first_try_correct = sum(
        1 for attempt in attempts if attempt.attempt_number == 1 and attempt.is_correct
    )
    attempts_count = len(attempts)
    attempted_count = len(attempted_questions)
    return {
        "challenges_completed": game_session.completed_scenes,
        "challenges_total": TOTAL_SCENES,
        "questions_completed": game_session.completed_questions,
        "questions_total": TOTAL_QUESTIONS,
        "questions_attempted": attempted_count,
        "attempts_total": attempts_count,
        "first_try_correct": first_try_correct,
        "first_try_accuracy": round(first_try_correct / attempted_count * 100, 2) if attempted_count else None,
        "correct_submissions": correct_attempts,
        "global_accuracy": round(correct_attempts / attempts_count * 100, 2) if attempts_count else None,
        "active_seconds": round(game_session.active_seconds, 2),
        "elapsed_seconds": round(elapsed_seconds(game_session, now), 2),
    }


def application_summary(sessions: Iterable[GameSession]) -> dict[str, float | int | None]:
    all_sessions = list(sessions)
    primary = [item for item in all_sessions if item.is_primary]
    completed = [item for item in primary if item.status == "completed"]
    primary_metrics = [session_metrics(item) for item in primary]
    completed_metrics = [session_metrics(item) for item in completed]

    first_try_values = [
        float(item["first_try_accuracy"])
        for item in primary_metrics
        if item["first_try_accuracy"] is not None
    ]
    global_values = [
        float(item["global_accuracy"])
        for item in primary_metrics
        if item["global_accuracy"] is not None
    ]
    active_values = [float(item["active_seconds"]) for item in completed_metrics]
    elapsed_values = [float(item["elapsed_seconds"]) for item in completed_metrics]

    return {
        "participants": len({item.participant_code_id for item in all_sessions}),
        "sessions": len(all_sessions),
        "primary_sessions": len(primary),
        "retakes": sum(1 for item in all_sessions if not item.is_primary),
        "completion_rate": round(len(completed) / len(primary) * 100, 2) if primary else None,
        "mean_first_try_accuracy": round(mean(first_try_values), 2) if first_try_values else None,
        "mean_global_accuracy": round(mean(global_values), 2) if global_values else None,
        "mean_active_seconds": round(mean(active_values), 2) if active_values else None,
        "median_active_seconds": round(median(active_values), 2) if active_values else None,
        "mean_elapsed_seconds": round(mean(elapsed_values), 2) if elapsed_values else None,
        "median_elapsed_seconds": round(median(elapsed_values), 2) if elapsed_values else None,
    }


def difficulty_by_scene(sessions: Iterable[GameSession]) -> list[dict[str, float | int | None]]:
    primary = [item for item in sessions if item.is_primary]
    rows: list[dict[str, float | int | None]] = []
    for scene_index in range(TOTAL_SCENES):
        attempts: list[Attempt] = [
            attempt
            for game_session in primary
            for attempt in game_session.attempts
            if attempt.scene_index == scene_index
        ]
        sessions_attempted = len({attempt.game_session_id for attempt in attempts})
        questions_attempted = len({(attempt.game_session_id, attempt.step_index) for attempt in attempts})
        first_try_correct = sum(
            1 for attempt in attempts if attempt.attempt_number == 1 and attempt.is_correct
        )
        correct = sum(1 for attempt in attempts if attempt.is_correct)
        rows.append(
            {
                "scene_index": scene_index,
                "scene_number": scene_index + 1,
                "sessions_attempted": sessions_attempted,
                "questions_attempted": questions_attempted,
                "attempts": len(attempts),
                "first_try_accuracy": round(first_try_correct / questions_attempted * 100, 2)
                if questions_attempted
                else None,
                "global_accuracy": round(correct / len(attempts) * 100, 2) if attempts else None,
            }
        )
    return rows
