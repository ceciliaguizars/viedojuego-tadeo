from __future__ import annotations

import uuid
from datetime import datetime

from backend.database import SessionLocal
from backend.models import GameSession, ParticipantCode
from backend.services import create_or_resume_session


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def start_v2(client, code: str, **extra):
    response = client.post("/api/v2/sessions", json={"code": code, **extra})
    assert response.status_code == 200, response.text
    return response.json()


def start_historical_v2(code: str):
    with SessionLocal() as database:
        participant = database.query(ParticipantCode).filter_by(code=code).one()
        game_session, token, _ = create_or_resume_session(
            database,
            participant,
            None,
            None,
            experience_version="tadeo-final-1",
            force_new=True,
        )
        return {"session_id": game_session.id, "session_token": token}


def response_payload(event_id: str, *, validation_result=None, values=None):
    return {
        "event_id": event_id,
        "situation": 3,
        "screen": 21,
        "activity_id": "s3_resolver",
        "validation_result": validation_result,
        "client_created_at": "2026-09-07T12:00:00-06:00",
        "order_index": 21,
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

    assert final_session["state"]["experience_version"] == "tadeo-3situaciones-1"
    assert final_session["state"]["current_screen"] == 2
    assert final_session["state"]["started_at"]
    assert legacy_session.status_code == 200
    with SessionLocal() as database:
        versions = {
            item.id: item.experience_version
            for item in database.query(GameSession).all()
        }
    assert versions[final_session["state"]["session_id"]] == "tadeo-3situaciones-1"
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
        "experience_version": "tadeo-3situaciones-1",
        "flow_progress": {"currentScreen": 6, "completedSituations": [1], "completedActivities": []},
    }
    first = client.put(
        f"/api/v2/sessions/{session_id}/progress",
        headers=headers,
        json={"current_screen": 6, "progress_revision": 3, "progress_snapshot": snapshot},
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
    assert recovered.json()["state"]["current_screen"] == 6
    assert recovered.json()["state"]["progress_revision"] == 3
    assert recovered.json()["state"]["progress_snapshot"] == snapshot


def test_new_version_rejects_progress_beyond_provisional_flow(client, participant_code):
    session = start_v2(client, participant_code)
    response = client.put(
        f"/api/v2/sessions/{session['state']['session_id']}/progress",
        headers=auth(session["session_token"]),
        json={"current_screen": 33, "progress_revision": 1, "progress_snapshot": {}},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "La pantalla no corresponde a la versión"


def test_situation_one_objective_attempts_preserve_first_and_second_literals(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    submissions = []
    for literal in ("50", "40"):
        response = client.post(
            f"/api/v2/sessions/{session_id}/responses",
            headers=headers,
            json={
                "event_id": str(uuid.uuid4()),
                "situation": 1,
                "screen": 5,
                "activity_id": "s1_contexto",
                "validation_result": False,
                "client_created_at": "2026-09-07T12:00:00-06:00",
                "order_index": 5,
                "values": [{
                    "field_id": "s1_tiempo_total",
                    "field_type": "objective_numeric",
                    "literal_value": literal,
                    "order_index": 0,
                    "validation_result": False,
                }],
            },
        )
        assert response.status_code == 200, response.text
        submissions.append(response.json()["submission"])

    assert [item["attempt_number"] for item in submissions] == [1, 2]
    assert [item["values"][0]["literal_value"] for item in submissions] == ["50", "40"]


def test_situation_one_open_responses_keep_literals_without_validation(client, participant_code):
    session = start_v2(client, participant_code)
    response = client.post(
        f"/api/v2/sessions/{session['state']['session_id']}/responses",
        headers=auth(session["session_token"]),
        json={
            "event_id": str(uuid.uuid4()),
            "situation": 1,
            "screen": 7,
            "activity_id": "s1_significados",
            "validation_result": None,
            "client_created_at": "2026-09-07T12:00:00-06:00",
            "order_index": 7,
            "values": [
                {
                    "field_id": "s1_significado_izquierda",
                    "field_type": "open_text",
                    "literal_value": "  Es lo que repartió entre las dos.  ",
                    "order_index": 0,
                    "validation_result": None,
                },
                {
                    "field_id": "s1_significado_derecha",
                    "field_type": "open_text",
                    "literal_value": "Los 60 minutos.",
                    "order_index": 1,
                    "validation_result": None,
                },
            ],
        },
    )

    assert response.status_code == 200, response.text
    submission = response.json()["submission"]
    assert submission["attempt_number"] is None
    assert submission["validation_result"] is None
    assert submission["values"][0]["literal_value"] == "  Es lo que repartió entre las dos.  "
    assert all(item["validation_result"] is None for item in submission["values"])


def test_situation_two_open_response_stays_literal_without_validation(client, participant_code):
    session = start_v2(client, participant_code)
    response = client.post(
        f"/api/v2/sessions/{session['state']['session_id']}/responses",
        headers=auth(session["session_token"]),
        json={
            "event_id": str(uuid.uuid4()),
            "situation": 2,
            "screen": 15,
            "activity_id": "s2_representacion_breve",
            "validation_result": None,
            "client_created_at": "2026-09-07T12:00:00-06:00",
            "order_index": 15,
            "values": [{
                "field_id": "s2_representacion_breve",
                "field_type": "math_expression",
                "literal_value": "  cinco veces △  ",
                "order_index": 0,
                "validation_result": None,
            }],
        },
    )

    assert response.status_code == 200, response.text
    submission = response.json()["submission"]
    assert submission["attempt_number"] is None
    assert submission["validation_result"] is None
    assert submission["values"][0]["literal_value"] == "  cinco veces △  "


def test_situation_two_objective_attempts_remain_separate_and_chronological(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    submissions = []
    for literal in ("<", ">"):
        response = client.post(
            f"/api/v2/sessions/{session_id}/responses",
            headers=headers,
            json={
                "event_id": str(uuid.uuid4()),
                "situation": 2,
                "screen": 14,
                "activity_id": "s2_signo_relacion",
                "validation_result": False,
                "client_created_at": "2026-09-07T12:00:00-06:00",
                "order_index": 14,
                "values": [{
                    "field_id": "s2_signo_relacion",
                    "field_type": "objective_choice",
                    "literal_value": literal,
                    "order_index": 0,
                    "validation_result": False,
                }],
            },
        )
        assert response.status_code == 200, response.text
        submissions.append(response.json()["submission"])

    assert [item["attempt_number"] for item in submissions] == [1, 2]
    assert [item["values"][0]["literal_value"] for item in submissions] == ["<", ">"]

    third = client.post(
        f"/api/v2/sessions/{session_id}/responses",
        headers=headers,
        json={
            "event_id": str(uuid.uuid4()),
            "situation": 2,
            "screen": 14,
            "activity_id": "s2_signo_relacion",
            "validation_result": True,
            "client_created_at": "2026-09-07T12:01:00-06:00",
            "order_index": 14,
            "values": [{
                "field_id": "s2_signo_relacion",
                "field_type": "objective_choice",
                "literal_value": "=",
                "order_index": 0,
                "validation_result": True,
            }],
        },
    )
    assert third.status_code == 409
    assert third.json()["detail"] == "La actividad permite un máximo de dos intentos"


def test_situation_three_gift_is_narrative_and_not_validated(client, participant_code):
    session = start_v2(client, participant_code)
    response = client.post(
        f"/api/v2/sessions/{session['state']['session_id']}/responses",
        headers=auth(session["session_token"]),
        json={
            "event_id": str(uuid.uuid4()),
            "situation": 3,
            "screen": 21,
            "activity_id": "s3_regalo_elegido",
            "validation_result": None,
            "client_created_at": "2026-09-07T12:00:00-06:00",
            "order_index": 21,
            "values": [{
                "field_id": "s3_regalo_elegido",
                "field_type": "narrative_choice",
                "literal_value": "regalo-lampara",
                "order_index": 0,
                "validation_result": None,
            }],
        },
    )

    assert response.status_code == 200, response.text
    submission = response.json()["submission"]
    assert submission["attempt_number"] is None
    assert submission["validation_result"] is None
    assert submission["values"][0]["literal_value"] == "regalo-lampara"


def test_situation_three_open_interpretation_stays_literal(client, participant_code):
    session = start_v2(client, participant_code)
    response = client.post(
        f"/api/v2/sessions/{session['state']['session_id']}/responses",
        headers=auth(session["session_token"]),
        json={
            "event_id": str(uuid.uuid4()),
            "situation": 3,
            "screen": 24,
            "activity_id": "s3_significado_4x_menos_180",
            "validation_result": None,
            "client_created_at": "2026-09-07T12:00:00-06:00",
            "order_index": 24,
            "values": [{
                "field_id": "s3_significado_4x_menos_180",
                "field_type": "open_text",
                "literal_value": "  Lo que tenía antes menos el regalo.  ",
                "order_index": 0,
                "validation_result": None,
            }],
        },
    )

    assert response.status_code == 200, response.text
    submission = response.json()["submission"]
    assert submission["attempt_number"] is None
    assert submission["values"][0]["literal_value"] == "  Lo que tenía antes menos el regalo.  "


def test_situation_three_objective_attempts_remain_separate_and_chronological(client, participant_code):
    session = start_v2(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    submissions = []
    for literal in ("250", "280"):
        response = client.post(
            f"/api/v2/sessions/{session_id}/responses",
            headers=headers,
            json={
                "event_id": str(uuid.uuid4()),
                "situation": 3,
                "screen": 25,
                "activity_id": "s3_valor_lado_derecho",
                "validation_result": False,
                "client_created_at": "2026-09-07T12:00:00-06:00",
                "order_index": 25,
                "values": [{
                    "field_id": "s3_valor_lado_derecho",
                    "field_type": "objective_numeric",
                    "literal_value": literal,
                    "order_index": 0,
                    "validation_result": False,
                }],
            },
        )
        assert response.status_code == 200, response.text
        submissions.append(response.json()["submission"])

    assert [item["attempt_number"] for item in submissions] == [1, 2]
    assert [item["values"][0]["literal_value"] for item in submissions] == ["250", "280"]


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
    screen_30 = {
        "intro_phase": "game",
        "final_flow": {
            "current_screen": 30,
            "completion_event_id": None,
            "completion_status": "idle",
            "completion_error": "",
        },
    }
    screen_31 = {
        "intro_phase": "game",
        "final_flow": {
            "current_screen": 31,
            "completion_event_id": completion_id,
            "completion_status": "syncing",
            "completion_error": "",
        },
    }

    saved_30 = client.put(
        f"/api/v2/sessions/{session_id}/progress",
        headers=headers,
        json={"current_screen": 30, "progress_revision": 30, "progress_snapshot": screen_30},
    )
    saved_31 = client.put(
        f"/api/v2/sessions/{session_id}/progress",
        headers=headers,
        json={"current_screen": 31, "progress_revision": 31, "progress_snapshot": screen_31},
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

    assert saved_30.json()["applied"] is True
    assert saved_30.json()["state"]["current_screen"] == 30
    assert saved_31.json()["applied"] is True
    assert before_complete.json()["state"]["current_screen"] == 31
    assert before_complete.json()["state"]["progress_snapshot"] == screen_31
    assert completed.json()["state"]["status"] == "completed"
    assert completed.json()["state"]["completed_at"]
    assert completed.json()["state"]["ended_reason"] == "completed"
    assert duplicate.json()["duplicate"] is True
    assert duplicate.json()["state"]["completed_at"] == completed.json()["state"]["completed_at"]
    assert recovered.json()["state"]["current_screen"] == 31
    assert recovered.json()["state"]["status"] == "completed"
    assert recovered.json()["state"]["completed_at"] == completed.json()["state"]["completed_at"]
    assert late_activity.json()["ignored"] is True


def test_current_flow_rejects_screens_after_definitive_total(client, participant_code):
    session = start_v2(client, participant_code)
    response = client.put(
        f"/api/v2/sessions/{session['state']['session_id']}/progress",
        headers=auth(session["session_token"]),
        json={"current_screen": 32, "progress_revision": 1, "progress_snapshot": {}},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "La pantalla no corresponde a la versión"


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


def test_historical_v2_session_keeps_original_screen_ranges(client, participant_code):
    historical = start_historical_v2(participant_code)
    headers = auth(historical["session_token"])
    saved = client.put(
        f"/api/v2/sessions/{historical['session_id']}/progress",
        headers=headers,
        json={"current_screen": 55, "progress_revision": 1, "progress_snapshot": {"historical": True}},
    )
    response = client.post(
        f"/api/v2/sessions/{historical['session_id']}/responses",
        headers=headers,
        json={**response_payload(str(uuid.uuid4()), validation_result=False), "screen": 28, "order_index": 28},
    )

    assert saved.status_code == 200
    assert saved.json()["state"]["current_screen"] == 55
    assert response.status_code == 200
