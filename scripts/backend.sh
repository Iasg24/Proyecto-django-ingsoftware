#!/usr/bin/env bash
# =============================================================================
# scripts/backend.sh — Levanta el backend Django (puerto 8000).
#
# Uso:
#   scripts/backend.sh start   -> inicia el servidor de desarrollo
#   scripts/backend.sh seed    -> crea los usuarios de prueba en MongoDB
#   scripts/backend.sh stop    -> lo detiene
#
# El servidor de desarrollo de Django recarga automáticamente cuando
# editas cualquier archivo de Python: NO hay que reiniciarlo a mano.
# =============================================================================

DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$DIR/backend"
PYTHON="$BACKEND/venv/bin/python"
LOG=/tmp/backend.log

start() {
  if [ -f /tmp/backend.pid ] && kill -0 "$(cat /tmp/backend.pid)" 2>/dev/null; then
    echo "El backend ya está corriendo (PID $(cat /tmp/backend.pid))."
    return 0
  fi
  cd "$BACKEND"
  nohup "$PYTHON" manage.py runserver 0.0.0.0:8000 > "$LOG" 2>&1 &
  echo $! > /tmp/backend.pid
  echo "Backend iniciado en http://localhost:8000  (log: $LOG)"
}

stop() {
  if [ -f /tmp/backend.pid ]; then
    kill "$(cat /tmp/backend.pid)" 2>/dev/null
    rm -f /tmp/backend.pid
    echo "Backend detenido."
  else
    echo "El backend no está corriendo."
  fi
}

seed() {
  cd "$BACKEND"
  "$PYTHON" -c "import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings'); django.setup(); exec(open('scripts/seed.py').read())"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  seed) seed ;;
  *) echo "Uso: $0 {start|stop|seed}" ;;
esac
