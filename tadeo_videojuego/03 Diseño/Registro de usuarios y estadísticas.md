---
tags:
  - investigacion
  - datos
  - privacidad
version: tadeo-3situaciones-1
---

# Registro de usuarios y estadísticas

## Identificación

Cada participante utiliza un folio anónimo. La sesión recibe un token que se guarda como hash. No se requieren nombre, correo ni contraseña del estudiante.

## Estructura de datos vigente

| Entidad | Contenido |
|---|---|
| `participant_codes` | Folio, aplicación y primer uso |
| `game_sessions` | Versión, progreso, estado, tiempos, `completed_at` y evento de finalización |
| `response_submissions` | Situación, pantalla, actividad, intento, validación y orden |
| `response_values` | Campo, tipo, valor literal, validación y orden |
| `activity_events` | Intervalos idempotentes de actividad visible |

No se eliminan datos ni migraciones históricas.

## Versión activa

`tadeo-3situaciones-1` registra 31 pantallas y tres catálogos ordenados:

- S1: tiempo total, número de actividades, reparto, igualdad, significados y justificación.
- S2: información de compra, símbolo, representación de cinco cuadernos, relación, estrategia, valor, elección y comprobación.
- S3: regalo, información faltante, cuatro cantidades, ecuación, estrategia, valor, comprobación y registro final.

Las respuestas abiertas y elecciones narrativas se muestran literalmente y no reciben clasificación automática. Los intentos objetivos se presentan por separado y en orden cronológico.

## Progreso y finalización

- El panel muestra `Pantalla n de 31` para la versión activa.
- Una sesión completada se identifica como **Recorrido completado**.
- `completed_at` permanece visible.
- La finalización es idempotente y detiene eventos de actividad posteriores.
- La recuperación tras recarga conserva progreso y finalización.

## Catálogos históricos

- `tadeo-final-1`: 55 pantallas y cinco catálogos originales.
- `legacy-1`: API, métricas y exportaciones históricas originales.

El detalle y los CSV seleccionan etiquetas por `experience_version`; los campos de una versión no se mezclan con otra.

## Exportaciones

El CSV de respuestas incluye folio, sesión, versión, estado, fechas, campo, etiqueta del catálogo correcto, situación, pantalla, actividad, tipo, valor literal, intento, validación y marcas de tiempo. Las exportaciones legacy permanecen separadas.

## Privacidad y operación

Los folios son seudónimos si el aplicador conserva externamente una correspondencia con estudiantes. Esa correspondencia no debe guardarse en el videojuego. En producción deben usarse HTTPS, cookies seguras, secretos aleatorios, acceso restringido y respaldos de PostgreSQL.
