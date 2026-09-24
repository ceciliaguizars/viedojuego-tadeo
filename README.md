# El día de Tadeo

Aplicación web educativa con frontend HTML/CSS/JavaScript, backend FastAPI y persistencia en PostgreSQL. La experiencia activa es `tadeo-3situaciones-1`.

## Experiencia activa

El recorrido definitivo contiene **31 pantallas**, tres situaciones didácticas y una agenda de dos actividades:

1. Ir a la papelería a comprar 5 cuadernos y un paquete de colores.
2. Comprar un regalo para Eloísa.

| Situación | Pantallas | Resultado contextual |
|---|---:|---|
| 1. Organizando el tiempo | 5–10 | 30 minutos para cada una de las dos actividades |
| 2. En la papelería | 11–20 | Cada cuaderno cuesta $40 |
| 3. Registrando su dinero | 21–28 | Cada cantidad recibida fue de $120 |

Las pantallas 29–31 corresponden a agenda completada, cierre interactivo y finalización. La versión activa no incluye la situación de la mascota ni la receta.

Reglas del recorrido:

- Las respuestas abiertas se guardan literalmente y no reciben calificación automática.
- Las respuestas numéricas y de selección objetiva permiten como máximo dos intentos; el primer intento siempre se conserva.
- Dos intentos incorrectos no bloquean permanentemente el avance.
- Las unidades se muestran fuera de los campos numéricos.
- La información del problema puede consultarse sin borrar respuestas.
- Las recompensas y el indicador final representan avance o completitud, no calidad de las respuestas.

Las sesiones históricas `legacy-1` y `tadeo-final-1` conservan sus catálogos, rangos y datos originales.

## Desarrollo local

### Preparación inicial

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
docker compose up -d db
cp .env.example .env
.venv/bin/python -m backend.security hash-password
npm run db:migrate
```

Configura `ADMIN_PASSWORD_HASH` y `SECRET_KEY` en `.env`. Las comillas simples alrededor del hash Argon2 evitan que la terminal interprete sus signos `$`.

### Inicio diario

En macOS puede usarse `dev.command`. Desde terminal:

```bash
npm run dev
```

- Juego: `http://127.0.0.1:4173/`
- Panel protegido: `http://127.0.0.1:4173/admin`
- Revisión directa: `?situacion=1`, `?situacion=2` o `?situacion=3`

Los modos de revisión no crean ni completan sesiones reales.

## Persistencia y panel de investigación

- Los folios anónimos, tokens, progreso, respuestas, intentos, actividad y finalización se conservan en PostgreSQL.
- La cola local idempotente permite recuperar envíos pendientes ante una interrupción breve de red.
- La finalización sincroniza la cola antes de registrar `completed_at` y no duplica el evento al reintentar o recargar.
- El panel selecciona el catálogo de campos según `experience_version`.
- Para `tadeo-3situaciones-1`, el detalle muestra S1, S2 y S3, respuestas literales, elecciones narrativas e intentos objetivos separados y cronológicos.
- El CSV de respuestas conserva la versión, el catálogo correspondiente y la trazabilidad de cada registro.
- No se generan clasificaciones automáticas para respuestas abiertas.

No se requirió una migración nueva para esta versión: las tablas existentes ya admiten la nueva trayectoria mediante `experience_version`, `progress_snapshot` y los registros de respuestas.

## Estructura

- `index.html`, `css/main.css`, `js/app.js`: experiencia interactiva.
- `backend/`: API, persistencia, seguridad y panel de investigación.
- `alembic/`: migraciones históricas conservadas.
- `tests/`: pruebas de flujo, API, panel, exportación y compatibilidad.
- `assets/`: recursos activos e históricos; los assets antiguos no se eliminan.
- `tadeo_videojuego/`: documentación activa.
- `tadeo_videojuego/99 Archivo histórico/`: documentos de situaciones anteriores, excluidos del índice RAG activo.

## Asistente RAG

El RAG privado indexa `README.md` y la documentación Markdown activa de `tadeo_videojuego/`. La carpeta `99 Archivo histórico` se conserva, pero se excluye expresamente del descubrimiento automático para no presentar mascota o receta como parte de la experiencia vigente.

Comprobación sin consumir la API:

```bash
.venv/bin/python -m scripts.index_rag --dry-run
```

## Verificación técnica

```bash
npm test
npm run check
.venv/bin/python -m compileall backend scripts tests
git diff --check
```

La suite usa SQLite aislado y no modifica la base PostgreSQL de desarrollo. Para una base PostgreSQL desechable, el nombre debe contener `test` y puede indicarse mediante `TEST_DATABASE_URL`.

## Publicación

`render.yaml` mantiene la configuración de FastAPI y PostgreSQL. Antes de publicar deben configurarse los secretos, aplicar las migraciones existentes y comprobar `/health`, `/`, `/admin` y una sesión ficticia completa. Este bloque no realiza deploy, push ni commit.
