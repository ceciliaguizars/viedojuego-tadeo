---
tags:
  - arquitectura
  - frontend
  - backend
version: tadeo-3situaciones-1
---

# Scaffold técnico

## Arquitectura conservada

- Frontend: `index.html`, `css/main.css` y `js/app.js`.
- Backend: FastAPI en `backend/`.
- Persistencia: SQLAlchemy y PostgreSQL; SQLite aislado para pruebas.
- Migraciones históricas: Alembic, sin una migración nueva para este rediseño.
- Panel: plantillas Jinja, autenticación docente y exportaciones CSV existentes.

## Definición central del recorrido

`EXPERIENCE_ROUTE` define la versión, las cuatro pantallas introductorias, las tres situaciones y las pantallas de cierre. `buildExperienceFlow` calcula todos los rangos y el total; la interfaz no debe repetir un total mediante números mágicos.

| Segmento | Pantallas |
|---|---:|
| Inicio, folio, presentación, agenda inicial | 1–4 |
| S1 · Organizando el tiempo | 5–10 |
| S2 · En la papelería | 11–20 |
| S3 · Registrando su dinero | 21–28 |
| Agenda completada | 29 |
| Cierre interactivo | 30 |
| Finalización | 31 |

## Estado local aislado

La versión usa claves propias:

- `tadeo-3situaciones-session-v1`
- `tadeo-3situaciones-outbox-v1`
- `tadeo-3situaciones-progress-v1`

No reutiliza las claves históricas. El modo `?situacion=` acepta únicamente 1, 2 o 3, no guarda progreso real y no puede completar una sesión.

## Respuestas e intentos

- `open_text`, `math_expression` y `narrative_choice` usan `validation_result: null`.
- `objective_numeric` y `objective_choice` registran validación y admiten hasta dos intentos.
- Cada envío conserva valor literal, orden, pantalla, actividad, fecha del cliente y fecha del servidor.
- El primer intento no se sustituye.

## Finalización

La pantalla 31 sincroniza primero la outbox. Después encola un solo evento de finalización con `completion_event_id`, registra `completed_at`, cambia el estado a `completed` y detiene el conteo de actividad. Una recarga recupera ese estado y un reintento reutiliza el mismo identificador.

## Compatibilidad

Los catálogos y rangos de `legacy-1` y `tadeo-final-1` permanecen separados en backend. El código histórico acoplado de sus antiguas situaciones y los assets se conservan para no destruir la posibilidad de reproducir o auditar versiones anteriores; el render activo de `tadeo-3situaciones-1` no los alcanza.
