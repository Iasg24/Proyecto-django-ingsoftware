#!/usr/bin/env bash
# =============================================================================
# scripts/ver_datos.sh — Muestra las colecciones y datos de MongoDB
# (el "visor" de la base de datos sin instalar programas).
#
# Uso:  scripts/ver_datos.sh
# =============================================================================
DIR="$(cd "$(dirname "$0")/.." && pwd)"
"$DIR/backend-fastapi/venv/bin/python" "$DIR/backend-fastapi/scripts/ver_datos.py"
