"""
database.py — Conexión a MongoDB (idéntico rol que en la versión Django).
El frontend nunca se entera: esta capa es interna del backend.
"""
import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "tienda_repuestos")

_cliente = MongoClient(MONGO_URI)
_base = _cliente[MONGO_DB_NAME]


def db():
    """Devuelve la base de datos (colecciones: usuarios, tokens, ventas,
    productos, clientes, pedidos, dia, folios)."""
    return _base
