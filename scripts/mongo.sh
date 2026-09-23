#!/usr/bin/env bash
# =============================================================================
# scripts/mongo.sh — Levanta el servidor MongoDB local (puerto 27017).
#
# Uso:
#   scripts/mongo.sh start   -> inicia MongoDB
#   scripts/mongo.sh stop    -> lo detiene
#   scripts/mongo.sh status  -> ¿está corriendo?
#
# MongoDB guarda los datos en mongodb/data/ (carpeta ignorada por Git).
# =============================================================================

DIR="$(cd "$(dirname "$0")/.." && pwd)"
MONGOD="$DIR/mongodb/bin/mongod"
DBPATH="$DIR/mongodb/data"
LOG="$DIR/mongodb/mongod.log"
PIDFILE="$DIR/mongodb/mongod.pid"

mkdir -p "$DBPATH"

start() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "MongoDB ya está corriendo (PID $(cat "$PIDFILE"))."
    return 0
  fi
  "$MONGOD" --dbpath "$DBPATH" --port 27017 --fork --logpath "$LOG" --pidfilepath "$PIDFILE"
  echo "MongoDB iniciado en mongodb://localhost:27017"
}

stop() {
  if [ -f "$PIDFILE" ]; then
    kill "$(cat "$PIDFILE")" && rm -f "$PIDFILE"
    echo "MongoDB detenido."
  else
    echo "MongoDB no está corriendo."
  fi
}

status() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "MongoDB está CORRIENDO (PID $(cat "$PIDFILE"))."
  else
    echo "MongoDB está DETENIDO."
  fi
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  *) echo "Uso: $0 {start|stop|status}" ;;
esac
