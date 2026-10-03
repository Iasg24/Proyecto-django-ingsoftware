#!/usr/bin/env bash
# =============================================================================
# scripts/backend-fastapi.sh — Levanta el backend FastAPI (puerto 8000).
#
# ATENCIÓN: el backend Django usa el MISMO puerto 8000. Antes de encender
# este, detén el otro:
#     scripts/backend.sh stop && scripts/backend-fastapi.sh start
#
# El frontend React NO cambia: habla con la misma API en /api/*.
# =============================================================================

DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$DIR/backend-fastapi"
PYTHON="$BACKEND/venv/bin/python"
LOG=/tmp/fastapi.log

start() {
  if [ -f /tmp/fastapi.pid ] && kill -0 "$(cat /tmp/fastapi.pid)" 2>/dev/null; then
    echo "El backend FastAPI ya está corriendo (PID $(cat /tmp/fastapi.pid))."
    return 0
  fi
  cd "$BACKEND"
  nohup "$PYTHON" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > "$LOG" 2>&1 &
  echo $! > /tmp/fastapi.pid
  echo "Backend FastAPI iniciado en http://localhost:8000  (log: $LOG)"
}

stop() {
  if [ -f /tmp/fastapi.pid ]; then
    kill "$(cat /tmp/fastapi.pid)" 2>/dev/null
    pkill -f "uvicorn main:app" 2>/dev/null
    rm -f /tmp/fastapi.pid
    echo "Backend FastAPI detenido."
  else
    echo "El backend FastAPI no está corriendo."
  fi
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  *) echo "Uso: $0 {start|stop}" ;;
esac
