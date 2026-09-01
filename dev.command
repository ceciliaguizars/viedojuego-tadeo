#!/bin/zsh

unsetopt BG_NICE

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR" || exit 1

pause_and_exit() {
  local exit_code="${1:-1}"
  if [[ -t 0 ]]; then
    echo ""
    read "?Presiona Enter para cerrar..."
  fi
  exit "$exit_code"
}

clear
echo "========================================"
echo "        EL DÍA DE TADEO · DEV"
echo "========================================"
echo ""

if [[ ! -x ".venv/bin/python" ]]; then
  if ! command -v python3 >/dev/null 2>&1; then
    echo "No se encontró Python 3. Instálalo y vuelve a abrir dev.command."
    pause_and_exit 1
  fi

  echo "Primera ejecución: creando el entorno virtual de Python..."
  if ! python3 -m venv .venv; then
    echo "No fue posible crear .venv con $(python3 --version 2>&1)."
    pause_and_exit 1
  fi
  echo ""
fi

if ! .venv/bin/python -c 'import alembic, fastapi, psycopg, sqlalchemy, uvicorn' >/dev/null 2>&1; then
  echo "Instalando las dependencias del proyecto..."
  if ! .venv/bin/python -m pip install -r requirements-dev.txt; then
    echo "No fue posible instalar las dependencias. Revisa tu conexión a Internet."
    pause_and_exit 1
  fi
  echo ""
fi

if [[ ! -f ".env" ]]; then
  echo "Primera ejecución: creando la configuración local .env..."
  cp .env.example .env || pause_and_exit 1

  generated_secret="$(.venv/bin/python -c 'import secrets; print(secrets.token_urlsafe(48))')"
  TADEO_SECRET_KEY="$generated_secret" .venv/bin/python -c 'import os; from pathlib import Path; path = Path(".env"); text = path.read_text(); path.write_text(text.replace("SECRET_KEY=genera-una-cadena-aleatoria-larga", "SECRET_KEY=" + os.environ["TADEO_SECRET_KEY"]))'
  echo ""
fi

set -a
source .env
set +a

if [[ -z "${DATABASE_URL:-}" || "${DATABASE_URL}" != postgresql* ]]; then
  echo "DATABASE_URL debe apuntar a PostgreSQL."
  echo "Revisa el valor configurado en .env."
  pause_and_exit 1
fi

if [[ "${DATABASE_URL}" == *":cambia-esta-clave@"* ]]; then
  echo "DATABASE_URL todavía contiene la contraseña de ejemplo anterior."
  echo "Para compose.yaml usa tadeo:tadeo o configura las mismas credenciales en ambos archivos."
  pause_and_exit 1
fi

if [[ "${ADMIN_PASSWORD_HASH:-}" == *"pega_aqui"* || -z "${ADMIN_PASSWORD_HASH:-}" ]]; then
  if [[ -t 0 ]]; then
    echo "Configura ahora la contraseña del panel administrativo."
    if ! generated_admin_hash="$(.venv/bin/python -m backend.security hash-password)"; then
      echo "No fue posible configurar la contraseña administrativa."
      pause_and_exit 1
    fi

    TADEO_ADMIN_HASH="$generated_admin_hash" .venv/bin/python -c 'import os; from pathlib import Path; path = Path(".env"); lines = path.read_text().splitlines(); value = "ADMIN_PASSWORD_HASH=\x27" + os.environ["TADEO_ADMIN_HASH"] + "\x27"; path.write_text("\n".join(value if line.startswith("ADMIN_PASSWORD_HASH=") else line for line in lines) + "\n")'
    export ADMIN_PASSWORD_HASH="$generated_admin_hash"
    echo "Contraseña administrativa guardada de forma segura."
    echo ""
  else
    echo "Aviso: falta configurar ADMIN_PASSWORD_HASH y el panel estará deshabilitado."
    echo "Ejecuta: .venv/bin/python -m backend.security hash-password"
    echo ""
  fi
fi

# Si se usa la base local incluida, intenta levantarla antes de migrar.
if [[ "${DATABASE_URL}" == *"@127.0.0.1:5432/tadeo"* || "${DATABASE_URL}" == *"@localhost:5432/tadeo"* ]]; then
  if { docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1; } && ! docker info >/dev/null 2>&1; then
    if [[ -d "/Applications/Docker.app" ]]; then
      echo "Iniciando Docker Desktop..."
      open -a Docker
      docker_ready=false
      for attempt in {1..60}; do
        if docker info >/dev/null 2>&1; then
          docker_ready=true
          break
        fi
        sleep 1
      done

      if [[ "$docker_ready" != true ]]; then
        echo "Docker Desktop no respondió después de 60 segundos."
        pause_and_exit 1
      fi
    fi
  fi

  if docker compose version >/dev/null 2>&1; then
    echo "Iniciando PostgreSQL local con Docker Compose..."
    if ! docker compose up -d db; then
      echo "No fue posible iniciar PostgreSQL. Verifica que Docker Desktop esté activo."
      pause_and_exit 1
    fi
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "Iniciando PostgreSQL local con docker-compose..."
    if ! docker-compose up -d db; then
      echo "No fue posible iniciar PostgreSQL. Verifica que Docker Desktop esté activo."
      pause_and_exit 1
    fi
  else
    echo "No se encontró Docker Compose; se usará el PostgreSQL local ya instalado."
  fi

  echo "Esperando a que PostgreSQL acepte conexiones..."
  database_ready=false
  for attempt in {1..30}; do
    if .venv/bin/python -c 'from sqlalchemy import create_engine; from backend.config import settings; connection = create_engine(settings.database_url).connect(); connection.close()' >/dev/null 2>&1; then
      database_ready=true
      break
    fi
    sleep 1
  done

  if [[ "$database_ready" != true ]]; then
    echo "PostgreSQL no respondió después de 30 segundos."
    echo "Estado del contenedor:"
    if docker compose version >/dev/null 2>&1; then
      docker compose ps db
      echo "Revisa los detalles con: docker compose logs db"
    elif command -v docker-compose >/dev/null 2>&1; then
      docker-compose ps db
      echo "Revisa los detalles con: docker-compose logs db"
    else
      echo "Revisa DATABASE_URL y el estado del servicio de base de datos."
    fi
    pause_and_exit 1
  fi
fi

echo "Aplicando migraciones de base de datos..."
if ! .venv/bin/python -m alembic upgrade head; then
  echo ""
  echo "No fue posible conectar con PostgreSQL."
  echo "Si usas Docker, inicia la base con: docker compose up -d db"
  echo "En instalaciones antiguas: docker-compose up -d db"
  pause_and_exit 1
fi

echo "Abriendo http://127.0.0.1:${PORT:-4173}"
(sleep 1; open "http://127.0.0.1:${PORT:-4173}") &
exec .venv/bin/python -m uvicorn backend.main:app --reload --host "${HOST:-127.0.0.1}" --port "${PORT:-4173}"
