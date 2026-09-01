---
tags:
  - desarrollo
  - arquitectura
  - scaffold
estado: implementado
---

# Scaffold técnico

[[Bienvenido|← Volver al inicio]]

## Estructura web

```text
videojuego-tadeo/
├── index.html
├── dev.command
├── compose.yaml
├── requirements.txt
├── alembic/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── validators.py
│   └── templates/
├── package.json
├── css/
│   └── main.css
├── js/
│   └── app.js
├── tests/
└── assets/
    ├── scenes/
    ├── characters/
    └── objects/
```

## Arquitectura de la experiencia

```text
Inicio
  ↓
Agenda inicial
  ↓
Situación 1 → 3 preguntas → descubrimiento: igualdad
  ↓
Situación 2 → 4 preguntas → completa “Alimentar al perro” → incógnita
  ↓
Situación 3 → 4 preguntas → completa “Papelería” → ecuación
  ↓
Situación 4 → 5 preguntas → completa “Regalo” → modelación Ax-B=C
  ↓
Situación 5 → 5 preguntas → completa “Cena” → incógnita en ambos miembros
  ↓
Día completado
```

### Cobertura de preguntas

| Situación | Flujo implementado | Etapas |
|---|---|---:|
| 1. Organizando el tiempo | Explorar datos → repartir el tiempo → analizar la igualdad | 3 |
| 2. Alimentando a su mascota | Identificar datos → suma repetida → representar la incógnita → actualizar agenda | 4 |
| 3. En la papelería | Analizar la compra → construir ecuación → resolver → comprobar | 4 |
| 4. Registrando sus gastos | Elegir y analizar → representar → interpretar términos → resolver → comprobar | 5 |
| 5. Ayudando con la cena | Analizar → representar expresiones → comparar → resolver → comprobar y elegir | 5 |
| **Total** | | **21** |

Las situaciones y sus formularios se definen en `js/app.js` mediante un arreglo `scenes`. La validación que controla el avance se ejecuta en `backend/validators.py`, de modo que el servidor sea la fuente de verdad para los resultados registrados.

### Reglas de navegación

1. **Comprobar respuesta** envía el paso actual a FastAPI con un identificador idempotente.
2. Una respuesta incorrecta conserva los campos activos y muestra una pista contextual.
3. Una respuesta correcta desactiva los campos y habilita **Siguiente pregunta**.
4. En la última pregunta se completa la situación, se desbloquea el descubrimiento y se habilita **Continuar**.
5. Los botones de avance permanecen ocultos hasta que corresponda; no es posible saltar preguntas.

## Estado, privacidad y estadísticas

- PostgreSQL conserva aplicaciones, folios anónimos, sesiones, intentos, respuestas y eventos de actividad.
- El navegador guarda solamente el identificador y token de su sesión, además de colas idempotentes para recuperar envíos interrumpidos.
- Al recargar, FastAPI devuelve la situación y pregunta vigentes. Un segundo recorrido crea una repetición y preserva la sesión principal.
- El tiempo total se calcula entre inicio y cierre; el tiempo activo se acumula mientras la pestaña está visible.
- La exactitud al primer intento y la exactitud global se calculan sobre las 21 preguntas. El progreso narrativo continúa expresándose en cinco situaciones.
- No se solicitan nombres ni correos. El panel protegido permite exportar CSV o eliminar una aplicación completa.

## Entorno de desarrollo

- **Base principal:** PostgreSQL mediante `DATABASE_URL`.
- **PostgreSQL local:** `docker compose up -d db`.
- **Migraciones:** `npm run db:migrate`.
- **Doble clic en macOS:** `dev.command` migra, inicia FastAPI y abre el navegador.
- **Terminal:** `npm run dev` inicia FastAPI en el puerto 4173.
- **Panel:** `/admin`, protegido por una contraseña Argon2 configurada en el entorno.
- **Pruebas:** `npm test`; la suite usa una base SQLite aislada y no modifica PostgreSQL.

## Componentes implementados

- Barra superior con tiempo ficticio, agenda y descubrimientos.
- Indicador de progreso.
- Indicador numerado de preguntas dentro de cada situación.
- Escenario estático y sprite por situación.
- Flujo completo de 21 etapas con preguntas numéricas, algebraicas y de selección.
- Formularios con validación contextual, pistas y reintentos sin penalización.
- Navegación bloqueada hasta completar correctamente cada pregunta.
- Agenda con cuatro estados de finalización.
- Cinco tarjetas de descubrimiento.
- Pantalla de cierre y reinicio.
- Diseño responsivo y soporte de teclado.
- Solicitud y validación de folio anónimo.
- Persistencia central y recuperación de sesión.
- Registro idempotente de intentos y tiempo activo.
- Panel con resultados individuales, agregados por aplicación y exportaciones CSV.

## Criterios para la siguiente iteración

- Añadir diálogos por personaje antes y después de cada reto.
- Incorporar audio, si la intervención didáctica lo requiere.
- Incorporar campos de explicación abierta si la intervención necesita registrar las justificaciones del estudiante.
- Definir con la investigación el periodo formal de retención y respaldo de resultados.
- Ejecutar pruebas de carga con la cantidad real de dispositivos prevista para la aplicación.
