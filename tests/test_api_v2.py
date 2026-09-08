from __future__ import annotations

import uuid
from datetime import datetime

from backend.database import SessionLocal
from backend.models import GameSession


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def start_v2(client, code: str, **extra):
    response = client.post("/api/v2/sessions", json={"code": code, **extra})
    assert response.status_code == 200, response.text
    return response.json()


def response_payload(event_id: str, *, validation_result=None, values=None):
    return {
        "event_id": event_id,
        "situation": 3,
        "screen": 28,
        "activity_id": "s3_resolver",
        "validation_result": validation_result,
        "client_created_at": "2026-09-07T12:00:00-06:00",
        "order_index": 28,
        "values": values or [
            {
                "field_id": "s3_valor_x",
                "field_type": "objective_numeric",
                "literal_value": "25",
                "order_index": 0,
                "validation_result": validation_result,
            }
        ],
    }


def test_v2_session_is_versioned_and_legacy_remains_distinct(client, participant_code):
    final_session = start_v2(client, participant_code)
    legacy_session = client.post("/api/sessions", json={"code": participant_code})

    assert final_session["state"]["experience_version"] == "tadeo-final-1"
    assert final_session["state"]["current_screen"] == 2
    assert final_session["state"]["started_at"]
    assert legacy_session.status_code == 200
    with SessionLocal() as database:
        versions = {
            item.id: item.experience_version
            for item in database.query(GameSession).all()
        }
    assert versions[final_session["state"]["session_id"]] == "tadeo-final-1"
    assert versions[legacy_session.json()["state"]["session_id"]] == "legacy-1"


def test_v2_session_can_be_recovered_with_the_same_folio(client, participant_code):
    first = start_v2(client, participant_code)
    recovered = start_v2(client, participant_code)

    assert recovered["resumed"] is True
    assert recovered["state"]["session_id"] == first["state"]["session_id"]
    assert recovered["session_token"] != first["session_token"]


def test_v2_force_new_creates_a_separate_retake(client, participant_code):
    first = start_v2(client, participant_code)
    retake = start_v2(client, participant_code, force_new=True)

    assert retake["resumed"] is False
    assert retake["state"]["session_id"] != first["state"]["session_id"]
    assert retake["state"]["sequence"] == 2


def test_v2_progress_snapshot_is_revision_controlled_and_recoverable(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    snapshot = {
        "intro_phase": "game",
        "has_situation_three_progress": True,
        "situation_three": {"stage": 4, "answers": {"s3_igualdad_compra": "mi igualdad"}},
    }
    first = client.put(
        f"/api/v2/sessions/{session_id}/progress",
        headers=headers,
        json={"current_screen": 25, "progress_revision": 3, "progress_snapshot": snapshot},
    )
    stale = client.put(
        f"/api/v2/sessions/{session_id}/progress",
        headers=headers,
        json={"current_screen": 10, "progress_revision": 2, "progress_snapshot": {"old": True}},
    )
    recovered = client.get(f"/api/v2/sessions/{session_id}/state", headers=headers)

    assert first.json()["applied"] is True
    assert stale.json()["applied"] is False
    assert stale.json()["stale"] is True
    assert recovered.json()["state"]["current_screen"] == 25
    assert recovered.json()["state"]["progress_revision"] == 3
    assert recovered.json()["state"]["progress_snapshot"] == snapshot


def test_v2_open_and_math_responses_preserve_literals_order_and_null_validation(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    event_id = str(uuid.uuid4())
    values = [
        {
            "field_id": "s3_cantidades_conocidas",
            "field_type": "open_text",
            "literal_value": "Cinco cuadernos, $45 y 195 pesos.",
            "order_index": 0,
            "validation_result": None,
        },
        {
            "field_id": "s3_igualdad_compra",
            "field_type": "math_expression",
            "literal_value": "195 = 45 + cuaderno + cuaderno + cuaderno + cuaderno + cuaderno",
            "order_index": 1,
            "validation_result": None,
        },
    ]
    response = client.post(
        f"/api/v2/sessions/{session_id}/responses",
        headers=headers,
        json=response_payload(event_id, validation_result=None, values=values),
    )

    assert response.status_code == 200, response.text
    submission = response.json()["submission"]
    assert submission["attempt_number"] is None
    assert submission["validation_result"] is None
    assert [item["field_id"] for item in submission["values"]] == [
        "s3_cantidades_conocidas",
        "s3_igualdad_compra",
    ]
    assert submission["values"][1]["literal_value"] == values[1]["literal_value"]
    assert all(item["validation_result"] is None for item in submission["values"])
    assert submission["client_created_at"] == "2026-09-07T18:00:00Z"
    assert datetime.fromisoformat(submission["submitted_at"])


def test_v2_objective_attempts_keep_two_errors_without_blocking(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])

    results = []
    for literal in ("25", "35"):
        event_id = str(uuid.uuid4())
        response = client.post(
            f"/api/v2/sessions/{session_id}/responses",
            headers=headers,
            json=response_payload(event_id, validation_result=False, values=[{
                "field_id": "s3_valor_x",
                "field_type": "objective_numeric",
                "literal_value": literal,
                "order_index": 0,
                "validation_result": False,
            }]),
        )
        assert response.status_code == 200, response.text
        results.append(response.json()["submission"])

    assert [item["attempt_number"] for item in results] == [1, 2]
    assert [item["values"][0]["literal_value"] for item in results] == ["25", "35"]
    assert [item["validation_result"] for item in results] == [False, False]
    state = client.get(f"/api/v2/sessions/{session_id}/state", headers=headers).json()["state"]
    assert len(state["responses"]) == 2
    assert state["status"] == "in_progress"


def test_v2_response_idempotence_depends_on_event_id(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    event_id = str(uuid.uuid4())
    original = response_payload(event_id, validation_result=False)
    changed = response_payload(event_id, validation_result=False)
    changed["values"][0]["literal_value"] = "un texto distinto"

    first = client.post(f"/api/v2/sessions/{session_id}/responses", headers=headers, json=original)
    duplicate = client.post(f"/api/v2/sessions/{session_id}/responses", headers=headers, json=changed)

    assert first.json()["duplicate"] is False
    assert duplicate.json()["duplicate"] is True
    assert duplicate.json()["submission"]["values"][0]["literal_value"] == "25"


def test_v2_does_not_deduplicate_equal_content_with_different_event_ids(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])

    submissions = []
    for _ in range(2):
        response = client.post(
            f"/api/v2/sessions/{session_id}/responses",
            headers=headers,
            json=response_payload(str(uuid.uuid4()), validation_result=False),
        )
        submissions.append(response.json()["submission"])

    assert [item["attempt_number"] for item in submissions] == [1, 2]
    assert all(item["values"][0]["literal_value"] == "25" for item in submissions)


def test_v2_completion_is_idempotent_and_stops_activity(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    activity = {"event_id": str(uuid.uuid4()), "active_seconds": 12.5}
    before = client.post(f"/api/v2/sessions/{session_id}/activity", headers=headers, json=activity)
    repeated_activity = client.post(
        f"/api/v2/sessions/{session_id}/activity",
        headers=headers,
        json=activity,
    )
    completion_id = str(uuid.uuid4())
    first = client.post(
        f"/api/v2/sessions/{session_id}/complete",
        headers=headers,
        json={"completion_event_id": completion_id},
    )
    duplicate = client.post(
        f"/api/v2/sessions/{session_id}/complete",
        headers=headers,
        json={"completion_event_id": completion_id},
    )
    after = client.post(
        f"/api/v2/sessions/{session_id}/activity",
        headers=headers,
        json={"event_id": str(uuid.uuid4()), "active_seconds": 20},
    )

    assert before.json()["active_seconds"] == 12.5
    assert repeated_activity.json()["active_seconds"] == 12.5
    assert repeated_activity.json()["duplicate"] is True
    assert first.json()["duplicate"] is False
    assert duplicate.json()["duplicate"] is True
    assert first.json()["state"]["completed_at"] == duplicate.json()["state"]["completed_at"]
    assert first.json()["state"]["status"] == "completed"
    assert after.json()["ignored"] is True
    assert after.json()["active_seconds"] == 12.5


def test_v2_final_screens_persist_complete_and_recover(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    completion_id = str(uuid.uuid4())
    screen_54 = {
        "intro_phase": "game",
        "final_flow": {
            "current_screen": 54,
            "completion_event_id": None,
            "completion_status": "idle",
            "completion_error": "",
        },
    }
    screen_55 = {
        "intro_phase": "game",
        "final_flow": {
            "current_screen": 55,
            "completion_event_id": completion_id,
            "completion_status": "syncing",
            "completion_error": "",
        },
    }

    saved_54 = client.put(
        f"/api/v2/sessions/{session_id}/progress",
        headers=headers,
        json={"current_screen": 54, "progress_revision": 54, "progress_snapshot": screen_54},
    )
    saved_55 = client.put(
        f"/api/v2/sessions/{session_id}/progress",
        headers=headers,
        json={"current_screen": 55, "progress_revision": 55, "progress_snapshot": screen_55},
    )
    before_complete = client.get(f"/api/v2/sessions/{session_id}/state", headers=headers)
    completed = client.post(
        f"/api/v2/sessions/{session_id}/complete",
        headers=headers,
        json={"completion_event_id": completion_id},
    )
    duplicate = client.post(
        f"/api/v2/sessions/{session_id}/complete",
        headers=headers,
        json={"completion_event_id": completion_id},
    )
    recovered = client.get(f"/api/v2/sessions/{session_id}/state", headers=headers)
    late_activity = client.post(
        f"/api/v2/sessions/{session_id}/activity",
        headers=headers,
        json={"event_id": str(uuid.uuid4()), "active_seconds": 8},
    )

    assert saved_54.json()["applied"] is True
    assert saved_54.json()["state"]["current_screen"] == 54
    assert saved_55.json()["applied"] is True
    assert before_complete.json()["state"]["current_screen"] == 55
    assert before_complete.json()["state"]["progress_snapshot"] == screen_55
    assert completed.json()["state"]["status"] == "completed"
    assert completed.json()["state"]["completed_at"]
    assert completed.json()["state"]["ended_reason"] == "completed"
    assert duplicate.json()["duplicate"] is True
    assert duplicate.json()["state"]["completed_at"] == completed.json()["state"]["completed_at"]
    assert recovered.json()["state"]["current_screen"] == 55
    assert recovered.json()["state"]["status"] == "completed"
    assert recovered.json()["state"]["completed_at"] == completed.json()["state"]["completed_at"]
    assert late_activity.json()["ignored"] is True


def test_v2_rejects_validation_on_open_fields(client, participant_code):
    session = start_v2(client, participant_code)
    response = client.post(
        f"/api/v2/sessions/{session['state']['session_id']}/responses",
        headers=auth(session["session_token"]),
        json=response_payload(str(uuid.uuid4()), validation_result=True, values=[{
            "field_id": "s1_justificacion",
            "field_type": "open_text",
            "literal_value": "Porque ambos lados representan lo mismo.",
            "order_index": 0,
            "validation_result": True,
        }]),
    )
    assert response.status_code == 422
