---
aliases:
  - Persistencia de resultados
  - Estadísticas por participante
tags:
  - desarrollo
  - postgres
  - estadisticas
  - privacidad
estado: implementado
---

# Registro de usuarios y estadísticas

[[Bienvenido|← Volver al inicio]] · [[Scaffold técnico|Ver arquitectura general]]

## Propósito

La plataforma registra el desempeño de cada participante mediante un **folio anónimo de ocho caracteres**. No solicita nombre, correo ni contraseña al estudiante.

El navegador conserva la experiencia narrativa, mientras que FastAPI valida las respuestas y PostgreSQL almacena sesiones, intentos y tiempos. Esto permite aplicar el videojuego desde varios dispositivos y consultar resultados centralizados.

## Flujo de aplicación

```text
Aplicador crea una aplicación o grupo
  ↓
Genera y entrega folios anónimos
  ↓
Participante ingresa su folio
  ↓
FastAPI crea o recupera la sesión del dispositivo
  ↓
Cada respuesta se valida y registra en PostgreSQL
  ↓
El panel calcula resultados individuales y agregados
  ↓
Aplicador consulta o exporta los CSV
```

Una recarga en el mismo navegador recupera la sesión vigente. Si el participante elige **Jugar de nuevo**, se crea una repetición y se preserva el primer recorrido como sesión principal.

## Datos almacenados

| Entidad | Contenido |
|---|---|
| `applications` | Grupo, periodo o aplicación de la actividad |
| `participant_codes` | Folio anónimo, aplicación y fecha de primer uso |
| `game_sessions` | Sesión principal o repetición, progreso, estado y tiempos |
| `attempts` | Situación, pregunta, número de intento, respuestas y resultado |
| `activity_events` | Incrementos idempotentes de tiempo con la pestaña visible |

Las fechas se almacenan en UTC. La interfaz presenta las duraciones en minutos y segundos.

## Métricas

### Resultado individual

- **Progreso narrativo:** situaciones terminadas de 5.
- **Preguntas terminadas:** respuestas correctas de 21.
- **Intentos totales:** todos los envíos correctos e incorrectos.
- **Exactitud al primer intento:** preguntas acertadas en el primer envío ÷ preguntas intentadas × 100.
- **Exactitud global:** envíos correctos ÷ envíos totales × 100.
- **Tiempo activo:** segundos acumulados mientras la pestaña permanece visible.
- **Duración total:** tiempo entre el inicio y la finalización; en una sesión abandonada se detiene en su última actividad registrada.
- **Estado:** `in_progress`, `completed` o `abandoned`.

### Resumen por aplicación

El panel calcula participantes, sesiones principales, repeticiones, tasa de finalización, promedios de exactitud, media y mediana de tiempos, y dificultad por situación.

Los indicadores agregados usan las **sesiones principales** para evitar que las repeticiones mejoren artificialmente los resultados. Los tiempos promedio y mediano se calculan con sesiones completadas.

## Validación y calidad del registro

- `backend/validators.py` contiene la validación autoritativa de las 21 preguntas.
- El frontend no avanza hasta recibir una respuesta satisfactoria de FastAPI.
- Cada intento y evento de actividad lleva un identificador idempotente. Repetir una solicitud por una interrupción de red no duplica el registro.
- Si el servidor no está disponible, el juego muestra un mensaje recuperable y no continúa silenciosamente sin guardar datos.
- Una cola local conserva temporalmente los eventos de actividad pendientes y vuelve a enviarlos cuando se recupera la conexión.

## API del participante

| Método y ruta | Función |
|---|---|
| `POST /api/sessions` | Valida el folio y crea o recupera una sesión |
| `GET /api/sessions/{id}/state` | Recupera progreso y métricas de la sesión autorizada |
| `POST /api/sessions/{id}/attempts` | Registra y valida una respuesta |
| `POST /api/sessions/{id}/activity` | Acumula un intervalo de tiempo activo |

Cada sesión recibe un token aleatorio. El token se guarda como hash en la base y evita que un participante consulte la sesión de otro folio.

## Panel docente

El acceso docente es visible en la barra superior del juego. También puede abrirse directamente en `/profesor`, que conduce al panel protegido.

La experiencia organiza el trabajo en tres pasos:

1. **Crear un grupo o aplicación.** El nombre puede incluir grado, sección y periodo para facilitar su identificación.
2. **Generar y entregar folios.** El profesor elige entre 1 y 500 códigos, copia los disponibles, imprime tarjetas o descarga el listado CSV. Los folios usados se distinguen visualmente y nunca se regeneran.
3. **Revisar resultados.** La vista permite buscar por folio, filtrar por estado y abrir el detalle de cada sesión. También muestra finalización, exactitud, intentos y tiempos del grupo.

Cada grupo incluye:

- Resumen agregado y dificultad por situación.
- Historial individual de sesiones, respuestas e intentos.
- Exportación de folios.
- Exportación del resumen por sesión.
- Exportación del historial detallado de intentos.
- Eliminación completa mediante confirmación escrita.

Al imprimir, se incluyen solamente los folios disponibles para evitar reasignar un código ya utilizado.

El acceso usa una contraseña Argon2 configurada en `ADMIN_PASSWORD_HASH`. La sesión administrativa viaja en una cookie `HttpOnly`, `SameSite=Lax` y `Secure` cuando `COOKIE_SECURE=true`.

## PostgreSQL y migraciones

PostgreSQL es la base principal. La conexión se define mediante `DATABASE_URL` con el dialecto `postgresql+psycopg`.

```bash
docker compose up -d db
npm run db:migrate
npm run dev
```

En instalaciones con Compose clásico se usa `docker-compose up -d db`. El esquema se administra con Alembic; la migración inicial está en `alembic/versions/20260831_0001_initial.py`.

SQLite no es la base operativa. Se usa solamente como entorno aislado para la suite automática.

## Configuración

Las variables esenciales se documentan en `.env.example`:

- `DATABASE_URL`: conexión PostgreSQL.
- `ADMIN_PASSWORD_HASH`: hash Argon2 de la clave del aplicador.
- `SECRET_KEY`: firma de cookies y formularios administrativos.
- `COOKIE_SECURE`: debe ser `true` al desplegar con HTTPS.
- `STALE_SESSION_MINUTES`: minutos sin actividad antes de marcar abandono.
- `HOST` y `PORT`: interfaz y puerto de FastAPI.

El hash de la clave se genera sin guardar la contraseña en el repositorio:

```bash
.venv/bin/python -m backend.security hash-password
```

## Privacidad y operación

> [!important] Minimización de datos
> Los folios son seudónimos, no anónimos absolutos si el aplicador conserva por separado una tabla que los relacione con estudiantes. Esa tabla externa no debe incorporarse a PostgreSQL ni a los CSV del videojuego.

Antes de una aplicación real se debe definir:

- Quién resguarda la correspondencia externa de folios, si existe.
- El periodo de conservación y la fecha de eliminación.
- El procedimiento de respaldo cifrado de PostgreSQL.
- Las personas autorizadas para consultar o exportar resultados.
- El aviso y consentimiento requerido por el protocolo de investigación.

En nube deben habilitarse HTTPS, `COOKIE_SECURE=true`, una `SECRET_KEY` aleatoria, credenciales PostgreSQL distintas de las de desarrollo y copias de seguridad.

## Pruebas

```bash
npm test
npm run check
```

La suite cubre las 21 validaciones, folios inválidos, recuperación, repeticiones, aislamiento de tokens, idempotencia de respuestas y tiempo, finalización completa, cálculo de métricas, autenticación administrativa, render del panel y exportación UTF-8 con BOM.

Para ejecutar la suite sobre una base PostgreSQL desechable, el nombre de la base debe contener `test`:

```bash
TEST_DATABASE_URL=postgresql+psycopg://usuario:clave@localhost/tadeo_test npm test
```
