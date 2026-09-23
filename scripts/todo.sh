#!/usr/bin/env bash
# =============================================================================
# scripts/todo.sh — EL BOTÓN DE ENCENDIDO del sistema completo.
#
# Levanta (o apaga) los TRES servicios en el orden correcto:
#   1. MongoDB   (la base de datos)     -> puerto 27017
#   2. Backend   (Django + la API)      -> puerto 8000
#   3. Frontend  (React / Vite)         -> puerto 5173
#
# Uso:
#   scripts/todo.sh      -> enciende todo
#   scripts/todo.sh stop -> apaga todo
#   scripts/todo.sh status -> estado de cada servicio
#
# Después abre el navegador en http://localhost:5173
# =============================================================================

DIR="$(cd "$(dirname "$0")/.." && pwd)"

start_all() {
  echo "▶ Encendiendo el sistema..."
  "$DIR/scripts/mongo.sh" start
  "$DIR/scripts/backend.sh" start
  "$DIR/scripts/frontend.sh" start
  sleep 1
  echo ""
  echo "==========================================================="
  echo "  SISTEMA LISTO. Abre el navegador en:"
  echo "  -----------------------------------------------------"
  echo "  Frontend : http://localhost:5173"
  echo "  Backend  : http://localhost:8000/api/ventas/dia"
  echo "  MongoDB  : mongodb://localhost:27017"
  echo "  -----------------------------------------------------"
  echo "  Usuarios: vendedor/vendedor123 | jefe/jefe123"
  echo "==========================================================="
}

stop_all() {
  echo "⏹ Apagando el sistema..."
  "$DIR/scripts/frontend.sh" stop
  "$DIR/scripts/backend.sh" stop
  "$DIR/scripts/mongo.sh" stop
  echo "Todo apagado."
}

status_all() {
  echo "Estado del sistema:"
  "$DIR/scripts/mongo.sh" status
  if [ -f /tmp/backend.pid ]; then echo "Backend: CORRIENDO (PID $(cat /tmp/backend.pid))"; else echo "Backend: DETENIDO"; fi
  if [ -f /tmp/frontend.pid ]; then echo "Frontend: CORRIENDO (PID $(cat /tmp/frontend.pid))"; else echo "Frontend: DETENIDO"; fi
}

case "${1:-start}" in
  start|on|up) start_all ;;
  stop|off|down) stop_all ;;
  status) status_all ;;
  *) echo "Uso: $0 {start|stop|status}" ;;
esac
