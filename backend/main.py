from __future__ import annotations

import csv
import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, Form, Header, HTTPException, Request, status
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from .config import PROJECT_ROOT, settings
from .database import get_db
from .metrics import application_summary, difficulty_by_scene, session_metrics
from .models import ActivityEvent, Application, Attempt, GameSession, ParticipantCode, utc_now
from .rag import RagError, RagService, rag_status
from .schemas import ActivityRequest, AttemptRequest, SessionStartRequest
from .security import (
    ADMIN_COOKIE,
    ADMIN_MAX_AGE_SECONDS,
    admin_is_authenticated,
    create_admin_cookie,
    csrf_token,
    require_admin,
    require_csrf,
    verify_admin_password,
)
from .services import (
    attempt_number_for,
    create_or_resume_session,
    existing_activity,
    existing_attempt,
    generate_unique_codes,
    load_session,
    mark_stale_sessions,
    verify_session_access,
)
from .validators import STEP_COUNTS, validate_question


app = FastAPI(title="El día de Tadeo", version="1.0.0")
templates = Jinja2Templates(directory=str(PROJECT_ROOT / "backend" / "templates"))

app.mount("/assets", StaticFiles(directory=str(PROJECT_ROOT / "assets")), name="assets")
app.mount("/css", StaticFiles(directory=str(PROJECT_ROOT / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(PROJECT_ROOT / "js")), name="js")
app.mount(
    "/admin-static",
    StaticFiles(directory=str(PROJECT_ROOT / "backend" / "static")),
    name="admin-static",
)


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no autorizada")
    return authorization.removeprefix("Bearer ").strip()


def _authorized_game_session(database: Session, session_id: str, authorization: str | None) -> GameSession:
    token = _bearer_token(authorization)
    game_session = load_session(database, session_id)
    if not game_session or not verify_session_access(game_session, token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no autorizada")
    return game_session


def _state_payload(game_session: GameSession) -> dict[str, object]:
    return {
        "session_id": game_session.id,
        "participant_code": game_session.participant_code.code,
        "application_name": game_session.participant_code.application.name,
        "sequence": game_session.sequence,
        "is_primary": game_session.is_primary,
        "status": game_session.status,
        "current_scene": game_session.current_scene,
        "current_step": game_session.current_step,
        "completed_scenes": list(range(game_session.completed_scenes)),
        "metrics": session_metrics(game_session),
    }


def _admin_context(request: Request, **values: object) -> dict[str, object]:
    return {
        "request": request,
        "csrf_token": csrf_token(),
        "current_path": request.url.path,
        **values,
    }


def _format_seconds(value: float | int | None) -> str:
    if value is None:
        return "—"
    seconds = int(round(float(value)))
    minutes, remainder = divmod(seconds, 60)
    return f"{minutes}:{remainder:02d}"


templates.env.filters["duration"] = _format_seconds


@app.get("/", response_class=FileResponse)
def game() -> FileResponse:
    return FileResponse(PROJECT_ROOT / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/sessions")
def start_session(payload: SessionStartRequest, database: Session = Depends(get_db)) -> dict[str, object]:
    mark_stale_sessions(database)
    participant_code = database.scalar(
        select(ParticipantCode)
        .options(selectinload(ParticipantCode.application))
        .where(ParticipantCode.code == payload.code)
    )
    if not participant_code or not participant_code.is_active or not participant_code.application.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El folio no es válido o ya no está activo")

    game_session, token, resumed = create_or_resume_session(
        database,
        participant_code,
        payload.resume_session_id,
        payload.resume_token,
    )
    game_session = load_session(database, game_session.id) or game_session
    return {"session_token": token, "resumed": resumed, "state": _state_payload(game_session)}


@app.get("/api/sessions/{session_id}/state")
def get_session_state(
    session_id: str,
    authorization: Annotated[str | None, Header()] = None,
    database: Session = Depends(get_db),
) -> dict[str, object]:
    game_session = _authorized_game_session(database, session_id, authorization)
    return {"state": _state_payload(game_session)}


@app.post("/api/sessions/{session_id}/attempts")
def submit_attempt(
    session_id: str,
    payload: AttemptRequest,
    authorization: Annotated[str | None, Header()] = None,
    database: Session = Depends(get_db),
) -> dict[str, object]:
    game_session = _authorized_game_session(database, session_id, authorization)
    duplicate = existing_attempt(database, session_id, payload.event_id)
    if duplicate:
        result = validate_question(duplicate.scene_index, duplicate.step_index, duplicate.answers)
        refreshed = load_session(database, session_id) or game_session
        return {
            "correct": duplicate.is_correct,
            "hint": result.hint,
            "attempt_number": duplicate.attempt_number,
            "duplicate": True,
            "state": _state_payload(refreshed),
        }

    if game_session.status == "completed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La sesión ya fue completada")
    if (payload.scene_index, payload.step_index) != (game_session.current_scene, game_session.current_step):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La pregunta no corresponde al progreso actual")

    result = validate_question(payload.scene_index, payload.step_index, payload.answers)
    attempt = Attempt(
        game_session_id=session_id,
        event_id=payload.event_id,
        scene_index=payload.scene_index,
        step_index=payload.step_index,
        attempt_number=attempt_number_for(database, session_id, payload.scene_index, payload.step_index),
        answers={key: str(value) for key, value in payload.answers.items()},
        is_correct=result.correct,
        active_seconds_at_submit=game_session.active_seconds,
    )
    database.add(attempt)
    game_session.last_activity_at = utc_now()
    game_session.status = "in_progress"
    if result.correct:
        game_session.completed_questions += 1
        if payload.step_index == STEP_COUNTS[payload.scene_index] - 1:
            game_session.completed_scenes += 1
            game_session.current_scene += 1
            game_session.current_step = 0
        else:
            game_session.current_step += 1
        if game_session.completed_scenes == 5:
            game_session.status = "completed"
            game_session.completed_at = utc_now()
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        duplicate = existing_attempt(database, session_id, payload.event_id)
        if not duplicate:
            raise
        attempt = duplicate

    refreshed = load_session(database, session_id) or game_session
    return {
        "correct": attempt.is_correct,
        "hint": result.hint,
        "attempt_number": attempt.attempt_number,
        "duplicate": False,
        "state": _state_payload(refreshed),
    }


@app.post("/api/sessions/{session_id}/activity")
def record_activity(
    session_id: str,
    payload: ActivityRequest,
    authorization: Annotated[str | None, Header()] = None,
    database: Session = Depends(get_db),
) -> dict[str, object]:
    game_session = _authorized_game_session(database, session_id, authorization)
    duplicate = existing_activity(database, session_id, payload.event_id)
    if not duplicate:
        event = ActivityEvent(
            game_session_id=session_id,
            event_id=payload.event_id,
            active_seconds=round(payload.active_seconds, 3),
        )
        database.add(event)
        game_session.active_seconds = round(game_session.active_seconds + payload.active_seconds, 3)
        game_session.last_activity_at = utc_now()
        try:
            database.commit()
        except IntegrityError:
            database.rollback()
    refreshed = load_session(database, session_id) or game_session
    return {"active_seconds": round(refreshed.active_seconds, 2)}


@app.get("/admin", response_class=HTMLResponse)
def admin_home(request: Request, database: Session = Depends(get_db)) -> Response:
    if not admin_is_authenticated(request):
        return templates.TemplateResponse(
            request=request,
            name="login.html",
            context=_admin_context(request, configured=bool(settings.admin_password_hash)),
        )
    mark_stale_sessions(database)
    applications = database.scalars(
        select(Application).order_by(Application.created_at.desc())
    ).all()
    rows = []
    for application in applications:
        sessions = database.scalars(
            select(GameSession)
            .join(ParticipantCode)
            .options(selectinload(GameSession.attempts))
            .where(ParticipantCode.application_id == application.id)
        ).all()
        rows.append({"application": application, "summary": application_summary(sessions)})
    dashboard_summary = {
        "applications": len(rows),
        "participants": sum(int(row["summary"]["participants"]) for row in rows),
        "sessions": sum(int(row["summary"]["sessions"]) for row in rows),
    }
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context=_admin_context(request, rows=rows, dashboard_summary=dashboard_summary),
    )


@app.get("/profesor")
def teacher_portal() -> RedirectResponse:
    """Ruta fácil de recordar para acceder al panel docente."""
    return RedirectResponse("/admin", status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@app.post("/admin/login")
def admin_login(
    request: Request,
    password: Annotated[str, Form()],
    csrf: Annotated[str, Form()],
) -> Response:
    require_csrf(csrf)
    if not settings.admin_password_hash:
        raise HTTPException(status_code=503, detail="Configura ADMIN_PASSWORD_HASH antes de usar el panel")
    if not verify_admin_password(password):
        return templates.TemplateResponse(
            request=request,
            name="login.html",
            context=_admin_context(request, configured=True, error="Contraseña incorrecta"),
            status_code=401,
        )
    response = RedirectResponse("/admin", status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(
        ADMIN_COOKIE,
        create_admin_cookie(),
        max_age=ADMIN_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    return response


@app.get("/admin/rag", response_class=HTMLResponse)
def admin_rag(request: Request) -> Response:
    require_admin(request)
    return templates.TemplateResponse(
        request=request,
        name="rag.html",
        context=_admin_context(request, rag_status=rag_status(), question="", result=None, error=None),
    )


@app.post("/admin/rag", response_class=HTMLResponse)
def ask_admin_rag(
    request: Request,
    question: Annotated[str, Form(min_length=1, max_length=1200)],
    csrf: Annotated[str, Form()],
) -> Response:
    require_admin(request)
    require_csrf(csrf)
    result = None
    error = None
    try:
        result = RagService().ask(question)
    except RagError as exc:
        error = str(exc)
    return templates.TemplateResponse(
        request=request,
        name="rag.html",
        context=_admin_context(
            request,
            rag_status=rag_status(),
            question=question,
            result=result,
            error=error,
        ),
        status_code=503 if error else 200,
    )


@app.post("/admin/logout")
def admin_logout(request: Request, csrf: Annotated[str, Form()]) -> Response:
    require_admin(request)
    require_csrf(csrf)
    response = RedirectResponse("/admin", status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie(ADMIN_COOKIE)
    return response


@app.post("/admin/applications")
def create_application(
    request: Request,
    name: Annotated[str, Form(min_length=2, max_length=120)],
    csrf: Annotated[str, Form()],
    database: Session = Depends(get_db),
) -> Response:
    require_admin(request)
    require_csrf(csrf)
    normalized = " ".join(name.split())
    database.add(Application(name=normalized))
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(status_code=409, detail="Ya existe una aplicación con ese nombre")
    application_id = database.scalar(select(Application.id).where(Application.name == normalized))
    return RedirectResponse(f"/admin/applications/{application_id}", status_code=303)


def _load_application_detail(database: Session, application_id: int) -> tuple[Application, list[GameSession]]:
    application = database.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    sessions = list(
        database.scalars(
            select(GameSession)
            .join(ParticipantCode)
            .options(selectinload(GameSession.attempts), selectinload(GameSession.participant_code))
            .where(ParticipantCode.application_id == application_id)
            .order_by(GameSession.started_at.desc())
        ).all()
    )
    return application, sessions


@app.get("/admin/applications/{application_id}", response_class=HTMLResponse)
def application_detail(
    application_id: int,
    request: Request,
    database: Session = Depends(get_db),
) -> Response:
    require_admin(request)
    mark_stale_sessions(database)
    application, sessions = _load_application_detail(database, application_id)
    codes = database.scalars(
        select(ParticipantCode)
        .where(ParticipantCode.application_id == application_id)
        .order_by(ParticipantCode.first_used_at.is_not(None), ParticipantCode.code)
    ).all()
    session_rows = [{"session": item, "metrics": session_metrics(item)} for item in sessions]
    available_codes = [item for item in codes if item.is_active and item.first_used_at is None]
    used_codes = [item for item in codes if item.first_used_at is not None]
    return templates.TemplateResponse(
        request=request,
        name="application.html",
        context=_admin_context(
            request,
            application=application,
            codes=codes,
            available_codes=available_codes,
            used_codes=used_codes,
            session_rows=session_rows,
            summary=application_summary(sessions),
            difficulty=difficulty_by_scene(sessions),
        ),
    )


@app.post("/admin/applications/{application_id}/codes")
def create_codes(
    application_id: int,
    request: Request,
    count: Annotated[int, Form(ge=1, le=500)],
    csrf: Annotated[str, Form()],
    database: Session = Depends(get_db),
) -> Response:
    require_admin(request)
    require_csrf(csrf)
    if not database.get(Application, application_id):
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    generate_unique_codes(database, application_id, count)
    return RedirectResponse(
        f"/admin/applications/{application_id}?generated={count}#codigos",
        status_code=303,
    )


@app.post("/admin/applications/{application_id}/delete")
def delete_application(
    application_id: int,
    request: Request,
    confirmation: Annotated[str, Form()],
    csrf: Annotated[str, Form()],
    database: Session = Depends(get_db),
) -> Response:
    require_admin(request)
    require_csrf(csrf)
    application = database.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    if confirmation.strip() != application.name:
        raise HTTPException(status_code=400, detail="La confirmación no coincide con el nombre")
    database.delete(application)
    database.commit()
    return RedirectResponse("/admin", status_code=303)


@app.get("/admin/sessions/{session_id}", response_class=HTMLResponse)
def admin_session_detail(
    session_id: str,
    request: Request,
    database: Session = Depends(get_db),
) -> Response:
    require_admin(request)
    game_session = load_session(database, session_id)
    if not game_session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    attempts_by_scene = []
    for scene_index in range(5):
        attempts_by_scene.append(
            {
                "scene_number": scene_index + 1,
                "attempts": [item for item in game_session.attempts if item.scene_index == scene_index],
            }
        )
    return templates.TemplateResponse(
        request=request,
        name="session.html",
        context=_admin_context(
            request,
            game_session=game_session,
            metrics=session_metrics(game_session),
            attempts_by_scene=attempts_by_scene,
        ),
    )


def _csv_response(rows: list[list[object]], filename: str) -> Response:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerows(rows)
    content = "\ufeff" + buffer.getvalue()
    return Response(
        content=content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/admin/applications/{application_id}/exports/codes.csv")
def export_codes(application_id: int, request: Request, database: Session = Depends(get_db)) -> Response:
    require_admin(request)
    application = database.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    codes = database.scalars(
        select(ParticipantCode)
        .where(ParticipantCode.application_id == application_id)
        .order_by(ParticipantCode.code)
    ).all()
    rows: list[list[object]] = [[
        "aplicacion", "folio", "estado", "creado_utc", "primer_uso_utc",
    ]]
    for item in codes:
        if not item.is_active:
            code_status = "inactivo"
        elif item.first_used_at:
            code_status = "utilizado"
        else:
            code_status = "disponible"
        rows.append([
            application.name,
            item.code,
            code_status,
            item.created_at.isoformat(),
            item.first_used_at.isoformat() if item.first_used_at else "",
        ])
    return _csv_response(rows, f"{application.id}-folios.csv")


@app.get("/admin/applications/{application_id}/exports/sessions.csv")
def export_sessions(application_id: int, request: Request, database: Session = Depends(get_db)) -> Response:
    require_admin(request)
    application, sessions = _load_application_detail(database, application_id)
    rows: list[list[object]] = [[
        "aplicacion", "folio", "sesion", "tipo", "estado", "inicio_utc", "fin_utc",
        "retos_completados", "intentos", "exactitud_primer_intento_pct",
        "exactitud_global_pct", "tiempo_activo_seg", "duracion_total_seg",
    ]]
    for item in sessions:
        metrics = session_metrics(item)
        rows.append([
            application.name,
            item.participant_code.code,
            item.sequence,
            "principal" if item.is_primary else "repeticion",
            item.status,
            item.started_at.isoformat(),
            item.completed_at.isoformat() if item.completed_at else "",
            metrics["challenges_completed"],
            metrics["attempts_total"],
            metrics["first_try_accuracy"] if metrics["first_try_accuracy"] is not None else "",
            metrics["global_accuracy"] if metrics["global_accuracy"] is not None else "",
            metrics["active_seconds"],
            metrics["elapsed_seconds"],
        ])
    return _csv_response(rows, f"{application.id}-sesiones.csv")


@app.get("/admin/applications/{application_id}/exports/attempts.csv")
def export_attempts(application_id: int, request: Request, database: Session = Depends(get_db)) -> Response:
    require_admin(request)
    application, sessions = _load_application_detail(database, application_id)
    rows: list[list[object]] = [[
        "aplicacion", "folio", "sesion", "tipo", "situacion", "pregunta", "numero_intento",
        "correcta", "respuestas_json", "enviado_utc", "tiempo_activo_al_enviar_seg",
    ]]
    import json

    for item in sessions:
        for attempt in item.attempts:
            rows.append([
                application.name,
                item.participant_code.code,
                item.sequence,
                "principal" if item.is_primary else "repeticion",
                attempt.scene_index + 1,
                attempt.step_index + 1,
                attempt.attempt_number,
                "si" if attempt.is_correct else "no",
                json.dumps(attempt.answers, ensure_ascii=False, sort_keys=True),
                attempt.submitted_at.isoformat(),
                attempt.active_seconds_at_submit,
            ])
    return _csv_response(rows, f"{application.id}-intentos.csv")


@app.get("/{path:path}", response_class=FileResponse)
def static_fallback(path: str) -> FileResponse:
    requested = (PROJECT_ROOT / path).resolve()
    allowed = {"index.html", "favicon.ico"}
    if path not in allowed or not requested.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(requested)
