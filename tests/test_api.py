from __future__ import annotations

import uuid

from backend.security import ADMIN_COOKIE, create_admin_cookie
from tests.test_validators import CORRECT_ANSWERS


def start(client, code, **extra):
    response = client.post("/api/sessions", json={"code": code, **extra})
    assert response.status_code == 200
    return response.json()


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_invalid_code_is_rejected(client):
    response = client.post("/api/sessions", json={"code": "NOEXISTE"})
    assert response.status_code == 404


def test_session_can_resume_and_retakes_do_not_overwrite_primary(client, participant_code):
    first = start(client, participant_code)
    resumed = start(
        client,
        participant_code,
        resume_session_id=first["state"]["session_id"],
        resume_token=first["session_token"],
    )
    assert resumed["resumed"] is True
    assert resumed["state"]["session_id"] == first["state"]["session_id"]

    retake = start(client, participant_code)
    assert retake["state"]["is_primary"] is False
    assert retake["state"]["sequence"] == 2
    assert first["state"]["is_primary"] is True


def test_token_cannot_read_another_session(client, participant_code):
    first = start(client, participant_code)
    second = start(client, participant_code)
    response = client.get(
        f"/api/sessions/{first['state']['session_id']}/state",
        headers=auth(second["session_token"]),
    )
    assert response.status_code == 401


def test_attempt_and_activity_are_idempotent(client, participant_code):
    session = start(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    event_id = str(uuid.uuid4())
    payload = {"event_id": event_id, "scene_index": 0, "step_index": 0, "answers": {"total": "0"}}

    first = client.post(f"/api/sessions/{session_id}/attempts", json=payload, headers=headers)
    duplicate = client.post(f"/api/sessions/{session_id}/attempts", json=payload, headers=headers)
    assert first.status_code == duplicate.status_code == 200
    assert first.json()["attempt_number"] == duplicate.json()["attempt_number"] == 1
    assert duplicate.json()["duplicate"] is True
    assert duplicate.json()["state"]["metrics"]["attempts_total"] == 1

    activity_id = str(uuid.uuid4())
    activity = {"event_id": activity_id, "active_seconds": 12.5}
    client.post(f"/api/sessions/{session_id}/activity", json=activity, headers=headers)
    repeated = client.post(f"/api/sessions/{session_id}/activity", json=activity, headers=headers)
    assert repeated.json()["active_seconds"] == 12.5


def test_full_game_completion_and_metrics(client, participant_code):
    session = start(client, participant_code)
    session_id = session["state"]["session_id"]
    headers = auth(session["session_token"])
    final = None
    for (scene_index, step_index), answers in CORRECT_ANSWERS.items():
        final = client.post(
            f"/api/sessions/{session_id}/attempts",
            headers=headers,
            json={
                "event_id": str(uuid.uuid4()),
                "scene_index": scene_index,
                "step_index": step_index,
                "answers": answers,
            },
        )
        assert final.status_code == 200, final.text
        assert final.json()["correct"] is True

    state = final.json()["state"]
    assert state["status"] == "completed"
    assert state["current_scene"] == 5
    assert state["metrics"]["challenges_completed"] == 5
    assert state["metrics"]["questions_completed"] == 21
    assert state["metrics"]["first_try_accuracy"] == 100.0
    assert state["metrics"]["global_accuracy"] == 100.0


def test_admin_and_exports_require_authentication(client, participant_code):
    unauthenticated = client.get("/admin/applications/1/exports/sessions.csv")
    assert unauthenticated.status_code == 401

    start(client, participant_code)
    client.cookies.set(ADMIN_COOKIE, create_admin_cookie())
    exported = client.get("/admin/applications/1/exports/sessions.csv")
    assert exported.status_code == 200
    assert exported.content.startswith(b"\xef\xbb\xbf")
    assert "Aplicación de prueba" in exported.content.decode("utf-8-sig")


def test_admin_dashboard_application_and_session_pages_render(client, participant_code):
    session = start(client, participant_code)
    client.cookies.set(ADMIN_COOKIE, create_admin_cookie())
    assert client.get("/admin").status_code == 200
    application = client.get("/admin/applications/1")
    assert application.status_code == 200
    assert participant_code in application.text
    detail = client.get(f"/admin/sessions/{session['state']['session_id']}")
    assert detail.status_code == 200
    assert "Resultado individual" in detail.text
