#!/usr/bin/env bash
# =============================================================================
# scripts/frontend.sh — Levanta el frontend React (puerto 5173).
#
# Uso:
#   scripts/frontend.sh start  -> inicia el servidor de desarrollo de Vite
#   scripts/frontend.sh stop   -> lo detiene
#
# Vite también recarga automáticamente: si editas un archivo .jsx/.css,
# el navegador se actualiza solo (Hot Module Replacement).
# =============================================================================

DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$DIR/frontend"
LOG=/tmp/frontend.log

start() {
  if [ -f /tmp/frontend.pid ] && kill -0 "$(cat /tmp/frontend.pid)" 2>/dev/null; then
    echo "El frontend ya está corriendo (PID $(cat /tmp/frontend.pid))."
    return 0
  fi
  cd "$FRONTEND"
  nohup node_modules/.bin/vite --host > "$LOG" 2>&1 &
  echo $! > /tmp/frontend.pid
  echo "Frontend iniciado en http://localhost:5173  (log: $LOG)"
}

stop() {
  if [ -f /tmp/frontend.pid ]; then
    kill "$(cat /tmp/frontend.pid)" 2>/dev/null
    rm -f /tmp/frontend.pid
    echo "Frontend detenido."
  else
    echo "El frontend no está corriendo."
  fi
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  *) echo "Uso: $0 {start|stop}" ;;
esac
