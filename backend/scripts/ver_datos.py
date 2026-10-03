"""
ver_datos.py — Visor rápido de los datos de MongoDB.

Muestra todas las colecciones de la base "tienda_repuestos" con su
cantidad de documentos y un ejemplo de cada una. Útil para demostrar
en la defensa que los datos están realmente guardados.

Uso (desde la carpeta del proyecto):  scripts/ver_datos.sh
"""
import os
import sys

# El módulo "config" (Django) vive en backend/: lo agregamos al path
# para poder ejecutar el script desde cualquier carpeta.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from database import db
import json

COLECCIONES = ['usuarios', 'tokens', 'ventas', 'productos', 'clientes', 'pedidos', 'dia', 'folios']

print("=" * 70)
print(f"BASE DE DATOS: tienda_repuestos (MongoDB)")
print("=" * 70)

for nombre in COLECCIONES:
    coleccion = db()[nombre]
    total = coleccion.count_documents({})
    print(f"\n📁 Colección: {nombre}  ({total} documento{'s' if total != 1 else ''})")

    # Ejemplo: primer documento (ocultando contraseñas)
    doc = coleccion.find_one()
    if doc is None:
        continue
    limpio = dict(doc)
    limpio.pop('_id', None)
    if 'password_hash' in limpio:
        limpio['password_hash'] = '******** (hash)'

    # Mostrar campos más relevantes de forma legible
    if nombre == 'ventas':
        print(f"   Ejemplo -> folio: {limpio.get('folio')} | {limpio.get('producto')} "
              f"x{limpio.get('cantidad')} | neto {limpio.get('neto')} | IVA {limpio.get('iva')} "
              f"| total {limpio.get('total')} | tipo: {limpio.get('tipo_documento')}")
    elif nombre == 'productos':
        print(f"   Ejemplo -> {limpio.get('codigo')} | {limpio.get('nombre')} | "
              f"${limpio.get('precio')} | stock {limpio.get('stock')}")
    elif nombre == 'pedidos':
        print(f"   Ejemplo -> {limpio.get('numero')} | estado: {limpio.get('estado')} | "
              f"cliente: {limpio.get('cliente', {}).get('nombre')} | total: {limpio.get('totales', {}).get('total')}")
    elif nombre == 'usuarios':
        print(f"   Ejemplo -> usuario: {limpio.get('usuario')} | rol: {limpio.get('rol')} "
              f"| nombre: {limpio.get('nombre_completo')}")
    elif nombre == 'clientes':
        print(f"   Ejemplo -> {limpio.get('nombre')} | RUT: {limpio.get('rut')} | {limpio.get('email')}")
    elif nombre == 'dia':
        print(f"   Ejemplo -> fecha: {limpio.get('fecha')} | estado: {limpio.get('estado')}")
    elif nombre == 'folios':
        print(f"   Ejemplo -> tipo: {limpio.get('tipo')} | secuencia: {limpio.get('secuencia')}")
    elif nombre == 'tokens':
        limpio['token'] = str(limpio.get('token', ''))[:12] + '...'
        print(f"   Ejemplo -> {limpio}")

print("\n" + "=" * 70)
print("Para ver TODO el detalle de un documento usa MongoDB Compass (ver docs/05)")
