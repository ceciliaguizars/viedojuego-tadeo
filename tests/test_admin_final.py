from __future__ import annotations

import csv
import io
import uuid
from pathlib import Path

from backend.research import FIELD_LABELS, FINAL_FIELDS
from backend.security import ADMIN_COOKIE, create_admin_cookie


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def start_final(client, code: str, **extra) -> dict:
    response = client.post("/api/v2/sessions", json={"code": code, **extra})
    assert response.status_code == 200
    return response.json()


def start_legacy(client, code: str) -> dict:
    response = client.post("/api/sessions", json={"code": code})
    assert response.status_code == 200
    return response.json()


def submit_final_value(
    client,
    session: dict,
    *,
    field_id: str,
    field_type: str,
    literal_value: str,
    validation_result=None,
    activity_id: str | None = None,
    screen: int = 28,
) -> None:
    response = client.post(
        f"/api/v2/sessions/{session['state']['session_id']}/responses",
        headers=auth(session["session_token"]),
        json={
            "event_id": str(uuid.uuid4()),
            "situation": 3,
            "screen": screen,
            "activity_id": activity_id or field_id,
            "validation_result": validation_result,
            "client_created_at": "2026-09-07T12:00:00-06:00",
            "order_index": screen,
            "values": [{
                "field_id": field_id,
                "field_type": field_type,
                "literal_value": literal_value,
                "order_index": 0,
                "validation_result": validation_result,
            }],
        },
    )
    assert response.status_code == 200, response.text


def login_admin(client) -> None:
    client.cookies.set(ADMIN_COOKIE, create_admin_cookie())


def test_panel_lists_final_and_legacy_without_mixing_metrics(client, participant_code):
    legacy = start_legacy(client, participant_code)
    final = start_final(client, participant_code)
    login_admin(client)

    page = client.get("/admin/applications/1")

    assert page.status_code == 200
    assert legacy["state"]["session_id"] in page.text
    assert final["state"]["session_id"] in page.text
    assert 'data-version="legacy-1"' in page.text
    assert 'data-version="tadeo-final-1"' in page.text
    assert "Tadeo final" in page.text
    final_row = page.text.split(final["state"]["session_id"], 1)[1].split("</tr>", 1)[0]
    assert "Pantalla 2 de 55" in final_row
    assert "/21 preguntas" not in final_row
    legacy_row = page.text.split(legacy["state"]["session_id"], 1)[1].split("</tr>", 1)[0]
    assert "/21 preguntas · legacy" in legacy_row
    assert "data-version-filter" in page.text


def test_final_only_panel_does_not_render_legacy_accuracy(client, participant_code):
    start_final(client, participant_code)
    login_admin(client)

    page = client.get("/admin/applications/1")

    assert "Tadeo final" in page.text
    assert "Resumen descriptivo, sin calificación ni precisión global." in page.text
    assert "21 preguntas" not in page.text
    assert "Exactitud global" not in page.text


def test_field_catalog_and_version_filter_preserve_research_order():
    admin_script = (
        Path(__file__).parents[1] / "backend" / "static" / "admin.js"
    ).read_text(encoding="utf-8")

    assert sum(len(fields) for fields in FINAL_FIELDS.values()) == 70
    assert FIELD_LABELS["s1_explora_a"] == "Tiempo total disponible"
    assert FIELD_LABELS["s4_procedimiento"] == "Procedimiento para resolver 4x − 180 = 300"
    assert FIELD_LABELS["s5_ecuacion_construida"] == "Ecuación construida para comparar las recetas"
    assert "row.dataset.version === selectedVersion" in admin_script
    assert "matchesCode && matchesStatus && matchesVersion" in admin_script


def test_final_detail_preserves_literals_attempts_validation_and_field_order(client, participant_code):
    session = start_final(client, participant_code)
    submit_final_value(
        client,
        session,
        field_id="s3_cantidades_conocidas",
        field_type="open_text",
        literal_value="195 pesos y cinco cuadernos",
    )
    submit_final_value(
        client,
        session,
        field_id="s3_representacion_incognita",
        field_type="narrative_choice",
        literal_value="△",
    )
    submit_final_value(
        client,
        session,
        field_id="s3_igualdad_compra",
        field_type="math_expression",
        literal_value="195 = 45 + x + x + x + x + x",
    )
    submit_final_value(
        client,
        session,
        field_id="s3_valor_x",
        field_type="objective_numeric",
        literal_value="25",
        validation_result=False,
        activity_id="s3_resolver",
    )
    submit_final_value(
        client,
        session,
        field_id="s3_valor_x",
        field_type="objective_numeric",
        literal_value="35",
        validation_result=True,
        activity_id="s3_resolver",
    )
    login_admin(client)

    detail = client.get(f"/admin/sessions/{session['state']['session_id']}")

    assert detail.status_code == 200
    assert "Detalle de investigación" in detail.text
    assert "sin calificación ni interpretación automática" in detail.text
    assert detail.text.count("Validación automática: No aplica") >= 3
    assert "195 pesos y cinco cuadernos" in detail.text
    assert "△" in detail.text
    assert "195 = 45 + x + x + x + x + x" in detail.text
    assert "Intento 1" in detail.text
    assert "25" in detail.text
    assert "Incorrecta" in detail.text
    assert "Intento 2" in detail.text
    assert "35" in detail.text
    assert "Correcta" in detail.text
    assert "validation_result" in detail.text
    assert "Sin respuesta registrada" in detail.text
    assert detail.text.index("s3_cantidades_conocidas") < detail.text.index("s3_igualdad_compra")
    assert detail.text.index("s3_igualdad_compra") < detail.text.index("s3_valor_x")


def test_final_detail_distinguishes_completed_and_incomplete_dates(client, participant_code):
    incomplete = start_final(client, participant_code)
    completed = start_final(client, participant_code, force_new=True)
    completion = client.post(
        f"/api/v2/sessions/{completed['state']['session_id']}/complete",
        headers=auth(completed["session_token"]),
        json={"completion_event_id": str(uuid.uuid4())},
    )
    login_admin(client)

    incomplete_page = client.get(f"/admin/sessions/{incomplete['state']['session_id']}")
    completed_page = client.get(f"/admin/sessions/{completed['state']['session_id']}")

    assert "Sin finalización registrada" in incomplete_page.text
    assert "Recorrido en progreso" in incomplete_page.text
    assert completion.json()["state"]["completed_at"][:19] in completed_page.text
    assert "Recorrido completado" in completed_page.text


def test_final_csv_is_one_utf8_row_per_value_and_keeps_traceability(client, participant_code):
    session = start_final(client, participant_code)
    legacy = start_legacy(client, participant_code)
    symbols = "x △ □ ○ ★ ◆ ? · ecuación con ñ"
    submit_final_value(
        client,
        session,
        field_id="s3_representacion_breve",
        field_type="math_expression",
        literal_value=symbols,
    )
    submit_final_value(
        client,
        session,
        field_id="s3_valor_x",
        field_type="objective_numeric",
        literal_value="25",
        validation_result=False,
        activity_id="s3_resolver",
    )
    login_admin(client)

    response = client.get("/admin/applications/1/exports/responses-v2.csv")
    decoded = response.content.decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(decoded)))

    assert response.status_code == 200
    assert response.content.startswith(b"\xef\xbb\xbf")
    assert len(rows) == 2
    assert legacy["state"]["session_id"] not in decoded
    assert rows[0]["group_name"] == "Aplicación de prueba"
    assert rows[0]["participant_code"] == participant_code
    assert rows[0]["session_id"] == session["state"]["session_id"]
    assert rows[0]["experience_version"] == "tadeo-final-1"
    assert rows[0]["field_id"] == "s3_representacion_breve"
    assert rows[0]["literal_value"] == symbols
    assert rows[0]["parsed_value"] == ""
    assert rows[0]["validation_result"] == ""
    assert rows[1]["attempt_number"] == "1"
    assert rows[1]["validation_result"] == "false"
    assert rows[1]["client_created_at"]
    assert rows[1]["submitted_at"]


def test_final_csv_and_detail_remain_protected(client, participant_code):
    session = start_final(client, participant_code)

    assert client.get("/admin/applications/1/exports/responses-v2.csv").status_code == 401
    assert client.get(f"/admin/sessions/{session['state']['session_id']}").status_code == 401


def test_legacy_detail_and_exports_still_work(client, participant_code):
    legacy = start_legacy(client, participant_code)
    login_admin(client)

    detail = client.get(f"/admin/sessions/{legacy['state']['session_id']}")
    sessions_csv = client.get("/admin/applications/1/exports/sessions.csv")
    attempts_csv = client.get("/admin/applications/1/exports/attempts.csv")

    assert detail.status_code == 200
    assert "21 preguntas" in detail.text
    assert "Exactitud global" in detail.text
    assert sessions_csv.status_code == 200
    assert attempts_csv.status_code == 200
