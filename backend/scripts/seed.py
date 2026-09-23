"""
scripts/seed.py — Crea los datos iniciales del sistema.

Este script se ejecuta para "sembrar" la base de datos con:

  USUARIOS DE PRUEBA
    Vendedor:       usuario: vendedor  |  clave: vendedor123
    Jefe de Ventas: usuario: jefe      |  clave: jefe123

  CLIENTE DE PRUEBA
    email: maria@mail.com  |  clave: maria123
    (Sus datos permiten probar el autocompletado por RUT en la factura)

  PRODUCTOS DE EJEMPLO (el catálogo que ven los clientes)

Ejecutar desde la carpeta backend:
    venv/bin/python -c "import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings'); django.setup(); exec(open('scripts/seed.py').read())"

O con el script:
    scripts/backend.sh seed
"""

from authapp.helpers import crear_usuario
from django.contrib.auth.hashers import make_password
from database import db

# ---------------------------------------------------------------------------
# 1. Usuarios internos (vendedor y jefe)
# ---------------------------------------------------------------------------

crear_usuario(
    usuario='vendedor',
    password='vendedor123',
    rol='vendedor',
    nombre_completo='Camila Rojas Pérez',
)

crear_usuario(
    usuario='jefe',
    password='jefe123',
    rol='jefe',
    nombre_completo='Andrés Fuentes Silva',
)

# ---------------------------------------------------------------------------
# 2. Cliente de prueba (para probar el autocompletado por RUT)
# ---------------------------------------------------------------------------

if db().clientes.find_one({'email': 'maria@mail.com'}):
    print('El cliente maria@mail.com ya existía, se omite.')
else:
    db().clientes.insert_one({
        'nombre': 'María Pérez Soto',
        'rut': '12.345.678-9',
        'email': 'maria@mail.com',
        'telefono': '+56 9 1234 5678',
        'direccion': 'Av. Brasil 1200, Valparaíso',
        'giro': 'Comercio minorista',
        'password_hash': make_password('maria123'),
        'rol': 'cliente',
    })
    print('Cliente de prueba creado: maria@mail.com / maria123')

# ---------------------------------------------------------------------------
# 3. Catálogo de productos de ejemplo
#
# 'imagen' es la ruta de la foto dentro de frontend/public/imagenes/
# (descargadas con scripts/descargar_fotos.py). Si un producto no tiene
# foto, el catálogo muestra un emoji por categoría.
#
# El script usa update_one con upsert: si el producto ya existe solo
# actualiza sus datos (puedes ejecutarlo las veces que quieras).
# ---------------------------------------------------------------------------

PRODUCTOS = [
    {'codigo': 'A-001', 'nombre': 'Neumático 120/90-18', 'categoria': 'Neumáticos',
     'precio': 25000, 'stock': 20, 'imagen': '/imagenes/A-001.jpg',
     'descripcion': 'Neumático trasero, medida estándar 18".'},
    {'codigo': 'A-002', 'nombre': 'Neumático 90/90-21', 'categoria': 'Neumáticos',
     'precio': 22000, 'stock': 15, 'imagen': '/imagenes/A-002.jpg',
     'descripcion': 'Neumático delantero, rodado 21".'},
    {'codigo': 'B-005', 'nombre': 'Batería YTZ7S', 'categoria': 'Eléctricos',
     'precio': 42000, 'stock': 8, 'imagen': '/imagenes/B-005.jpg',
     'descripcion': 'Batería sellada 12V, arranque en frío.'},
    {'codigo': 'C-100', 'nombre': 'Casco Integral', 'categoria': 'Seguridad',
     'precio': 60000, 'stock': 10, 'imagen': '/imagenes/C-100.jpg',
     'descripcion': 'Casco integral certificado, talla única ajustable.'},
    {'codigo': 'C-101', 'nombre': 'Casco Abierto', 'categoria': 'Seguridad',
     'precio': 45000, 'stock': 8, 'imagen': '/imagenes/C-101.jpg',
     'descripcion': 'Casco abierto liviano, ideal ciudad.'},
    {'codigo': 'D-050', 'nombre': 'Aceite 10W-40 (1L)', 'categoria': 'Lubricantes',
     'precio': 8500, 'stock': 40, 'imagen': '/imagenes/D-050.jpg',
     'descripcion': 'Aceite de motor semisintético, 1 litro.'},
    {'codigo': 'E-010', 'nombre': 'Cadena de transmisión 428', 'categoria': 'Transmisión',
     'precio': 18000, 'stock': 12, 'imagen': '/imagenes/E-010.jpg',
     'descripcion': 'Cadena reforzada 428 con eslabón de unión.'},
    {'codigo': 'F-020', 'nombre': 'Kit limpieza de cadena', 'categoria': 'Mantenimiento',
     'precio': 8900, 'stock': 25, 'imagen': '/imagenes/F-020.jpg',
     'descripcion': 'Lubricante y limpiador de cadena en aerosol.'},
    {'codigo': 'G-030', 'nombre': 'Kit aceite + filtro', 'categoria': 'Mantenimiento',
     'precio': 15900, 'stock': 18, 'imagen': '/imagenes/G-030.jpg',
     'descripcion': 'Aceite 1L + filtro de aceite para cambio completo.'},
    {'codigo': 'H-010', 'nombre': 'Faro LED', 'categoria': 'Eléctricos',
     'precio': 12000, 'stock': 14, 'imagen': '/imagenes/H-010.jpg',
     'descripcion': 'Faro LED de alto flujo, compatible 12V.'},
    {'codigo': 'I-010', 'nombre': 'Pantalones de moto', 'categoria': 'Indumentaria',
     'precio': 35000, 'stock': 10, 'imagen': '/imagenes/I-010.jpg',
     'descripcion': 'Pantalón con protecciones y forro interior.'},
    {'codigo': 'I-020', 'nombre': 'Guantes de moto', 'categoria': 'Indumentaria',
     'precio': 18000, 'stock': 20, 'imagen': '/imagenes/I-020.jpg',
     'descripcion': 'Guantes con protección de nudillos, talla M-L.'},
    {'codigo': 'J-010', 'nombre': 'Espejos retrovisores (par)', 'categoria': 'Accesorios',
     'precio': 7500, 'stock': 16, 'imagen': '/imagenes/J-010.jpg',
     'descripcion': 'Par de espejos cromados universales.'},
    {'codigo': 'K-010', 'nombre': 'Pastillas de freno', 'categoria': 'Frenos',
     'precio': 9500, 'stock': 22, 'imagen': '/imagenes/K-010.jpg',
     'descripcion': 'Pastillas de freno de disco, juego para dos ruedas.'},
]

nuevos = 0
for p in PRODUCTOS:
    resultado = db().productos.update_one(
        {'codigo': p['codigo']},
        {'$set': p},
        upsert=True,
    )
    if resultado.upserted_id:
        nuevos += 1

print('Productos del catálogo:', nuevos, 'nuevos |', len(PRODUCTOS) - nuevos, 'actualizados')
print()
print('Resumen de la base de datos:')
print('  Colecciones:', db().list_collection_names())
