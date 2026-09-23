"""
database.py — EL PUENTE entre Django y MongoDB.

¿Cómo se conecta el backend a MongoDB?
1. PyMongo (la librería que instalamos) se conecta a:
     mongodb://localhost:27017   (mongod = el servidor de base de datos)
2. Dentro del servidor elegimos una base de datos llamada "tienda_repuestos".
3. Dentro de la base elegimos "colecciones" (en MongoDB las tablas
   se llaman colecciones, y las filas se llaman documentos).

COLECCIONES:
  usuarios  -> cada vendedor o jefe de ventas
  tokens    -> sesiones activas (token = carnet de acceso)
  ventas    -> cada venta registrada
  dia       -> el estado del día de hoy (abierto/cerrado)
  folios    -> contadores para numerar boletas y facturas (B-0001, F-0001)

LEER: docs/04-base-de-datos.md para entender MongoDB y por qué
los datos "viajan" como documentos JSON.
"""

from pymongo import MongoClient
from django.conf import settings

# MongoClient crea la conexión al servidor de MongoDB.
# settings.MONGO_URI viene de config/settings.py.
_cliente = MongoClient(settings.MONGO_URI)

# Elegimos la base de datos. En MongoDB NO hay que "crear" la base
# antes: se crea sola la primera vez que guardamos algo en ella.
_base = _cliente[settings.MONGO_DB_NAME]


def db():
    """Devuelve la base de datos para que las apps la usen.

    Ejemplo de uso dentro de una vista:
        from database import db
        db().ventas.insert_one({...})
    """
    return _base


def colecciones():
    """Lista las colecciones existentes. Útil para verificar la conexión."""
    return _base.list_collection_names()
