from __future__ import annotations

from collections import defaultdict
from typing import Any

from .metrics import elapsed_seconds
from .models import GameSession, ResponseSubmission, ResponseValue


FINAL_EXPERIENCE_VERSION = "tadeo-final-1"
NON_EVALUATED_FIELD_TYPES = {"open_text", "math_expression", "narrative_choice"}

FINAL_FIELDS: dict[int, list[tuple[str, str]]] = {
    1: [
        ("s1_explora_a", "Tiempo total disponible"),
        ("s1_explora_b", "Número de actividades"),
        ("s1_explora_c", "Tiempo para cada actividad"),
        ("s1_igualdad_1", "Primera igualdad construida"),
        ("s1_igualdad_2", "Segunda igualdad construida"),
        ("s1_igualdad_3", "Tercera igualdad construida"),
        ("s1_igualdad_4", "Cuarta igualdad construida"),
        ("s1_significado_izquierda", "Significado del lado izquierdo de la igualdad"),
        ("s1_significado_derecha", "Significado del lado derecho de la igualdad"),
        ("s1_misma_cantidad", "¿Ambos lados representan la misma cantidad?"),
        ("s1_justificacion", "Justificación de la comparación"),
    ],
    2: [
        ("s2_informacion_conocida", "Información conocida sobre el alimento"),
        ("s2_que_averiguar", "Cantidad que se necesita averiguar"),
        ("s2_dias_alimento", "Días que alcanza el alimento"),
        ("s2_igualdad", "Igualdad construida para el alimento"),
        ("s2_cantidad_desconocida", "Cantidad desconocida"),
        ("s2_representacion_incognita", "Símbolo elegido para representar la incógnita"),
        ("s2_significado_representacion", "Significado del símbolo elegido"),
        ("s2_dia_comprar_alimento", "Día para comprar alimento"),
    ],
    3: [
        ("s3_cantidades_conocidas", "Cantidades conocidas en la compra"),
        ("s3_cantidad_encontrar", "Cantidad que se debe encontrar"),
        ("s3_incognita", "Incógnita de la situación"),
        ("s3_representacion_incognita", "Representación elegida para la incógnita"),
        ("s3_cinco_cuadernos", "Representación del costo de cinco cuadernos"),
        ("s3_igualdad_compra", "Igualdad construida para la compra"),
        ("s3_representacion_breve", "Representación abreviada de la igualdad"),
        ("s3_valor_x", "Valor obtenido para la incógnita"),
        ("s3_cuaderno_elegido", "Cuaderno elegido"),
        ("s3_sustitucion", "Sustitución para comprobar el resultado"),
        ("s3_se_mantiene_igualdad", "¿Se mantiene la igualdad?"),
    ],
    4: [
        ("s4_regalo_elegido", "Regalo elegido"),
        ("s4_cantidades_conocidas", "Cantidades conocidas para el regalo"),
        ("s4_cantidad_encontrar", "Cantidad que se debe encontrar"),
        ("s4_incognita", "Incógnita de la situación"),
        ("s4_cuatro_ingresos", "Representación de los cuatro ingresos"),
        ("s4_ecuacion", "Ecuación construida para el ahorro"),
        ("s4_significado_4x", "Significado de 4x"),
        ("s4_significado_menos180", "Significado de −180"),
        ("s4_significado_300", "Significado de 300"),
        ("s4_procedimiento", "Procedimiento para resolver 4x − 180 = 300"),
        ("s4_valor_x", "Valor obtenido para la incógnita"),
        ("s4_explicacion_procedimiento", "Explicación del procedimiento"),
        ("s4_sustitucion", "Sustitución para comprobar el resultado"),
        ("s4_se_mantiene_igualdad", "¿Se mantiene la igualdad?"),
        ("s4_interpretacion_resultado", "Interpretación del resultado"),
        ("s4_registro_ingreso1", "Primer ingreso registrado"),
        ("s4_registro_ingreso2", "Segundo ingreso registrado"),
        ("s4_registro_ingreso3", "Tercer ingreso registrado"),
        ("s4_registro_ingreso4", "Cuarto ingreso registrado"),
    ],
    5: [
        ("s5_cantidades_conocidas", "Cantidades conocidas de las recetas"),
        ("s5_cantidad_encontrar", "Cantidad que se debe encontrar"),
        ("s5_incognita", "Incógnita de la situación"),
        ("s5_receta1_porciones", "Expresión de las porciones de la receta 1"),
        ("s5_receta1_total", "Expresión total de la receta 1"),
        ("s5_receta2_total", "Expresión total de la receta 2"),
        ("s5_ecuacion_construida", "Ecuación construida para comparar las recetas"),
        ("s5_signo_relacion", "Signo elegido para relacionar las recetas"),
        ("s5_sustitucion_expresiones", "Relación formada con las expresiones"),
        ("s5_significado_igual", "Significado del signo igual"),
        ("s5_procedimiento", "Procedimiento para resolver la ecuación"),
        ("s5_valor_x", "Valor obtenido para la incógnita"),
        ("s5_explicacion_procedimiento", "Explicación del procedimiento"),
        ("s5_sustitucion_receta1_x", "Sustitución en la receta 1"),
        ("s5_resultado_receta1", "Resultado de la receta 1"),
        ("s5_sustitucion_receta2_x", "Sustitución en la receta 2"),
        ("s5_resultado_receta2", "Resultado de la receta 2"),
        ("s5_misma_cantidad", "¿Ambas recetas requieren la misma cantidad?"),
        ("s5_gramos_cada_receta", "Gramos requeridos por cada receta"),
        ("s5_porciones_final", "Número de porciones obtenido"),
        ("s5_receta_elegida", "Receta elegida"),
    ],
}

FIELD_LABELS = {
    field_id: label
    for fields in FINAL_FIELDS.values()
    for field_id, label in fields
}


def version_label(experience_version: str) -> str:
    return "Tadeo final" if experience_version == FINAL_EXPERIENCE_VERSION else experience_version


def status_label(status: str) -> str:
    return {
        "in_progress": "En progreso",
        "completed": "Completada",
        "abandoned": "Abandonada",
    }.get(status, status)


def response_count(game_session: GameSession) -> int:
    return sum(len(submission.values) for submission in game_session.response_submissions)


def final_session_summary(game_session: GameSession) -> dict[str, Any]:
    return {
        "version_label": version_label(game_session.experience_version),
        "status_label": status_label(game_session.status),
        "response_count": response_count(game_session),
        "duration_seconds": round(elapsed_seconds(game_session), 2),
        "active_seconds": round(game_session.active_seconds, 2),
        "current_screen": min(55, max(1, game_session.current_screen)),
        "completed": game_session.status == "completed",
    }


def final_application_summary(sessions: list[GameSession]) -> dict[str, int]:
    return {
        "participants": len({item.participant_code_id for item in sessions}),
        "sessions": len(sessions),
        "completed": sum(item.status == "completed" for item in sessions),
        "in_progress": sum(item.status == "in_progress" for item in sessions),
        "responses": sum(response_count(item) for item in sessions),
    }


def _response_entry(submission: ResponseSubmission, value: ResponseValue) -> dict[str, Any]:
    validation = value.validation_result
    if validation is None:
        validation = submission.validation_result
    if value.field_type in NON_EVALUATED_FIELD_TYPES:
        validation_label = "Validación automática: No aplica"
        validation_class = "not-applicable"
    elif validation is True:
        validation_label = "Correcta"
        validation_class = "correct"
    elif validation is False:
        validation_label = "Incorrecta"
        validation_class = "incorrect"
    else:
        validation_label = "Sin validación registrada"
        validation_class = "not-applicable"
    return {
        "literal_value": value.literal_value,
        "field_type": value.field_type,
        "attempt_number": submission.attempt_number,
        "validation_result": validation,
        "validation_label": validation_label,
        "validation_class": validation_class,
        "client_created_at": submission.client_created_at,
        "submitted_at": submission.submitted_at,
        "screen": submission.screen,
        "activity_id": submission.activity_id,
        "order_index": value.order_index,
    }


def final_session_detail(game_session: GameSession) -> dict[str, Any]:
    values_by_field: dict[str, list[dict[str, Any]]] = defaultdict(list)
    submissions = sorted(
        game_session.response_submissions,
        key=lambda item: (item.screen, item.order_index, item.submitted_at, item.id),
    )
    for submission in submissions:
        for value in sorted(submission.values, key=lambda item: (item.order_index, item.id)):
            values_by_field[value.field_id].append(_response_entry(submission, value))

    situations = []
    for situation, catalog in FINAL_FIELDS.items():
        fields = []
        additional_attempts = 0
        for field_id, label in catalog:
            responses = values_by_field.get(field_id, [])
            additional_attempts += sum(
                1 for response in responses if (response["attempt_number"] or 0) > 1
            )
            fields.append({"field_id": field_id, "label": label, "responses": responses})
        situations.append({
            "number": situation,
            "fields": fields,
            "responded_fields": sum(1 for field in fields if field["responses"]),
            "total_fields": len(fields),
            "additional_attempts": additional_attempts,
        })
    return {"summary": final_session_summary(game_session), "situations": situations}


FINAL_RESPONSE_CSV_COLUMNS = [
    "group_name",
    "participant_code",
    "session_id",
    "experience_version",
    "status",
    "started_at",
    "completed_at",
    "current_screen",
    "field_id",
    "field_label",
    "situation",
    "screen",
    "activity_id",
    "field_type",
    "literal_value",
    "parsed_value",
    "attempt_number",
    "validation_result",
    "client_created_at",
    "submitted_at",
]


def final_response_csv_rows(application_name: str, sessions: list[GameSession]) -> list[list[object]]:
    rows: list[list[object]] = [FINAL_RESPONSE_CSV_COLUMNS]
    for game_session in sessions:
        submissions = sorted(
            game_session.response_submissions,
            key=lambda item: (item.submitted_at, item.id),
        )
        for submission in submissions:
            for value in sorted(submission.values, key=lambda item: (item.order_index, item.id)):
                validation = value.validation_result
                if validation is None:
                    validation = submission.validation_result
                rows.append([
                    application_name,
                    game_session.participant_code.code,
                    game_session.id,
                    game_session.experience_version,
                    game_session.status,
                    game_session.started_at.isoformat(),
                    game_session.completed_at.isoformat() if game_session.completed_at else "",
                    game_session.current_screen,
                    value.field_id,
                    FIELD_LABELS.get(value.field_id, value.field_id),
                    submission.situation,
                    submission.screen,
                    submission.activity_id,
                    value.field_type,
                    value.literal_value,
                    "",
                    submission.attempt_number if submission.attempt_number is not None else "",
                    "" if validation is None else str(validation).lower(),
                    submission.client_created_at.isoformat() if submission.client_created_at else "",
                    submission.submitted_at.isoformat(),
                ])
    return rows
