#!/bin/zsh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR" || exit 1

clear
echo "========================================"
echo "        EL DÍA DE TADEO · DEV"
echo "========================================"
echo ""

if [[ ! -x ".venv/bin/python" ]]; then
  echo "Falta el entorno virtual. Ejecuta primero:"
  echo "  python3 -m venv .venv"
  echo "  .venv/bin/pip install -r requirements-dev.txt"
  echo ""
  read "?Presiona Enter para cerrar..."
  exit 1
fi

if [[ ! -f ".env" ]]; then
  echo "Falta el archivo .env. Cópialo y configura PostgreSQL y la clave administrativa:"
  echo "  cp .env.example .env"
  echo ""
  read "?Presiona Enter para cerrar..."
  exit 1
fi

set -a
source .env
set +a

echo "Aplicando migraciones de base de datos..."
if ! .venv/bin/python -m alembic upgrade head; then
  echo ""
  echo "No fue posible conectar con PostgreSQL."
  echo "Si usas Docker, inicia la base con: docker compose up -d db"
  read "?Presiona Enter para cerrar..."
  exit 1
fi

echo "Abriendo http://127.0.0.1:${PORT:-4173}"
(sleep 1; open "http://127.0.0.1:${PORT:-4173}") &
exec .venv/bin/python -m uvicorn backend.main:app --reload --host "${HOST:-127.0.0.1}" --port "${PORT:-4173}"
