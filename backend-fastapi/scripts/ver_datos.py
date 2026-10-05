"""
ver_datos.py — Visor rápido de los datos de MongoDB (sin Django).
Muestra todas las colecciones con su cantidad de documentos y un ejemplo.

Uso (desde la raíz del proyecto):  scripts/ver_datos.sh
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from database import db

COLECCIONES = ['usuarios', 'tokens', 'ventas', 'productos', 'clientes', 'pedidos', 'dia', 'folios']

print("=" * 70)
print("BASE DE DATOS: tienda_repuestos (MongoDB)")
print("=" * 70)

for nombre in COLECCIONES:
    coleccion = db()[nombre]
    total = coleccion.count_documents({})
    print(f"\n📁 Colección: {nombre}  ({total} documento{'s' if total != 1 else ''})")

    doc = coleccion.find_one()
    if doc is None:
        continue
    limpio = dict(doc)
    limpio.pop('_id', None)
    if 'password_hash' in limpio:
        limpio['password_hash'] = '******** (hash)'

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
