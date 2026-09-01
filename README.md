# El día de Tadeo

Aplicación web educativa con backend FastAPI, PostgreSQL y bóveda de Obsidian para un videojuego sobre ecuaciones de primer grado.

## Experiencia implementada

El recorrido contiene cinco situaciones didácticas y **21 etapas de preguntas**. Cada situación avanza de la comprensión del contexto a la representación, resolución, comprobación e interpretación de la respuesta.

| Situación | Etapas | Resultado |
|---|---:|---|
| 1. Organizando el tiempo | 3 | 30 minutos por actividad |
| 2. Alimentando a su mascota | 4 | 3 días; compra en el día 2 |
| 3. En la papelería | 4 | Cuaderno de $30 |
| 4. Registrando sus gastos | 5 | Cuatro ingresos de $120 |
| 5. Ayudando con la cena | 5 | 4 porciones y 700 g por receta |

Las respuestas incorrectas muestran pistas contextuales y permiten reintentar sin penalización. Una respuesta correcta habilita la siguiente pregunta; solamente la última etapa de cada situación permite continuar la historia y desbloquear su descubrimiento.

## Dev launcher

### Preparación inicial

1. Crea el entorno e instala las dependencias:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
```

2. Inicia PostgreSQL. El entorno de desarrollo incluido usa PostgreSQL 18 y monta el volumen en `/var/lib/postgresql`, como requiere esta versión:

```bash
docker compose up -d db
```

Si tu instalación usa el ejecutable clásico, ejecuta `docker-compose up -d db`. También puedes usar una instalación PostgreSQL existente y cambiar `DATABASE_URL`.

3. Crea la configuración local y genera el hash de la contraseña administrativa:

```bash
cp .env.example .env
.venv/bin/python -m backend.security hash-password
```

Copia el hash resultante entre comillas simples en `ADMIN_PASSWORD_HASH` y cambia `SECRET_KEY` dentro de `.env`. Las comillas evitan que la terminal interprete los signos `$` del hash Argon2.

4. Aplica la migración inicial:

```bash
npm run db:migrate
```

### Inicio diario

En macOS, haz doble clic en `dev.command`. La primera ejecución crea `.venv`, instala las dependencias, genera `.env` y solicita una contraseña para el panel administrativo. Si se usa la `DATABASE_URL` local incluida, también abre Docker Desktop cuando sea necesario, inicia PostgreSQL con Docker Compose y espera a que esté disponible. Después aplica las migraciones, inicia FastAPI y abre el navegador.

Las ejecuciones posteriores reutilizan la preparación existente. Desde terminal también puedes iniciar el servidor con:

```bash
npm run dev
```

El juego queda en `http://127.0.0.1:4173/`. El profesor puede entrar desde el botón **Acceso docente** del juego o directamente en `http://127.0.0.1:4173/profesor`.

### Recorrido del profesor

1. Abre **Acceso docente** e ingresa la contraseña configurada durante la instalación.
2. Crea un grupo o periodo de aplicación.
3. Genera la cantidad de folios necesaria. Puede copiar los disponibles, imprimirlos o descargarlos como CSV.
4. Entrega un folio de ocho caracteres a cada estudiante para que ingrese al juego.
5. Revisa el resumen del grupo o busca un folio para consultar sus intentos, precisión, avance y tiempos.
6. Descarga el resumen por sesión o el historial detallado de intentos cuando necesite trabajar los datos en Excel.

## Persistencia y estadísticas

- El aplicador crea una aplicación o grupo desde `/admin` y genera folios anónimos de ocho caracteres.
- Cada respuesta se valida en Python y se registra con situación, pregunta, número de intento y resultado.
- Se miden por separado el tiempo activo de la pestaña y la duración total de la sesión.
- Una recarga recupera la sesión del mismo navegador; volver a jugar crea una repetición sin borrar la sesión principal.
- El panel muestra resultados individuales y agregados. Sus botones exportan un CSV de sesiones y otro de intentos.
- Las aplicaciones se pueden eliminar con confirmación escrita. No se guardan nombres ni correos en la base analítica.

PostgreSQL es la base principal. SQLite solo se usa explícitamente en las pruebas automatizadas.

## Contenido

- `index.html`, `css/main.css` y `js/app.js`: experiencia interactiva completa de inicio a cierre.
- `backend/`: API, modelos, validación, métricas, seguridad y panel administrativo.
- `alembic/`: migraciones para PostgreSQL.
- `compose.yaml`: PostgreSQL local para desarrollo.
- `tests/`: pruebas de validadores, sesiones, idempotencia, seguridad, métricas y exportaciones.
- `assets/`: escenarios, personajes y objetos del paquete visual proporcionado.
- `tadeo_videojuego/`: bóveda de Obsidian con narrativa, brief, situaciones y arquitectura.

PostgreSQL conserva los resultados; `localStorage` solo mantiene el token de la sesión y las colas idempotentes necesarias para recuperarse de recargas o interrupciones breves de red.

## Asistente RAG del proyecto

El backend incluye un asistente privado que responde preguntas usando como fuentes el `README.md` y los documentos Markdown de `tadeo_videojuego/`. El índice se guarda localmente; la clave de OpenAI nunca se envía al navegador.

1. Crea y activa un entorno virtual e instala las dependencias:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Copia `.env.example` a `.env`, configura `OPENAI_API_KEY` y carga las variables antes de iniciar el backend:

   ```bash
   set -a
   source .env
   set +a
   ```

3. Genera o actualiza el índice cuando cambien los documentos:

   ```bash
   python -m scripts.index_rag
   ```

   Para comprobar qué archivos se incluirán sin consumir la API:

   ```bash
   python -m scripts.index_rag --dry-run
   ```

4. Inicia FastAPI y entra en `/admin/rag` después de autenticarte en el panel:

   ```bash
   uvicorn backend.main:app --reload --host 127.0.0.1 --port 4173
   ```

El modelo generativo, el modelo de embeddings, la ubicación del índice y el número de fragmentos recuperados se pueden cambiar con `RAG_MODEL`, `RAG_EMBEDDING_MODEL`, `RAG_INDEX_PATH` y `RAG_TOP_K`.

## Verificación técnica

Para ejecutar las pruebas del backend y validar la sintaxis del frontend:

```bash
npm test
npm run check
```

La suite usa SQLite aislado para poder ejecutarse sin modificar la base PostgreSQL de desarrollo.

Para repetir la misma suite sobre PostgreSQL, crea una base desechable cuyo nombre contenga `test` y ejecuta:

```bash
TEST_DATABASE_URL=postgresql+psycopg://usuario:clave@localhost/tadeo_test npm test
```
