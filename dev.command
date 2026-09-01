#!/bin/zsh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR" || exit 1

clear
echo "========================================"
echo "        EL DÍA DE TADEO · DEV"
echo "========================================"
echo ""

if command -v node >/dev/null 2>&1; then
  exec node scripts/dev-server.mjs --open
fi

if command -v python3 >/dev/null 2>&1; then
  echo "Node.js no está disponible; se usará Python."
  echo "Abriendo http://127.0.0.1:4173"
  (sleep 1; open "http://127.0.0.1:4173") &
  exec python3 -m http.server 4173 --bind 127.0.0.1
fi

echo "No se encontró Node.js ni Python 3."
echo "Instala uno de los dos para iniciar el proyecto."
echo ""
read "?Presiona Enter para cerrar..."
