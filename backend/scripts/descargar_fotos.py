#!/usr/bin/env python3
"""
scripts/descargar_fotos.py — Descarga fotos reales (con licencia libre)
para los productos del catálogo, usando la API de Openverse.

Openverse (de la organización WordPress) busca imágenes con licencias
libres (CC0, CC-BY, etc.) en Flickr, Wikimedia y más. Son fotos reales
y legales para un proyecto escolar.

Las fotos se guardan en frontend/public/imagenes/<codigo>.jpg y el
catálogo las muestra con <img src="/imagenes/<codigo>.jpg">.
Si una foto no se encuentra, el catálogo muestra un emoji por categoría.

Ejecutar:
    python3 scripts/descargar_fotos.py
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request

# La raíz del proyecto es 2 niveles arriba de este script (backend/scripts/).
# (Lección de la sesión: las rutas relativas se prueban SIEMPRE.)
RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DESTINO = os.path.join(RAIZ, 'frontend', 'public', 'imagenes')

# codigo -> palabras de búsqueda (en inglés: Openverse tiene más fotos)
BUSQUEDAS = {
    'A-001': 'motorcycle tire closeup',
    'A-002': 'motorcycle front wheel',
    'B-005': 'motorcycle battery',
    'C-100': 'motorcycle helmet full face',
    'C-101': 'motorcycle helmet open face',
    'D-050': 'motor oil bottle',
    'E-010': 'motorcycle chain sprocket',
    'F-020': 'chain lubricant spray',
    'G-030': 'oil filter',
    'H-010': 'motorcycle headlight',
    'I-010': 'motorcycle riding trousers',
    'I-020': 'motorcycle gloves',
    'J-010': 'motorcycle rear view mirror',
    'K-010': 'disc brake pads',
}

USER_AGENT = 'ProyectoEscolarINACAP/1.0'


def buscar_imagen(query):
    """Busca en Openverse y devuelve la URL de la primera foto JPEG/PNG."""
    url = (
        'https://api.openverse.org/v1/images/'
        f'?q={urllib.parse.quote(query)}&per_page=10'
        '&license_type=commercial'      # se puede usar comercialmente
    )
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        datos = json.load(r)

    for resultado in datos.get('results', []):
        imagen = resultado.get('url', '')
        formato = (resultado.get('url') or '').lower()
        # preferimos JPG/PNG directos (sin SVG)
        if formato.endswith('.svg'):
            continue
        if imagen.startswith('http'):
            return imagen
    return None


def descargar(url, ruta):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as r:
        with open(ruta, 'wb') as f:
            f.write(r.read())


def main():
    os.makedirs(DESTINO, exist_ok=True)
    ok, fallas = 0, []
    for codigo, query in BUSQUEDAS.items():
        ruta = os.path.join(DESTINO, f'{codigo}.jpg')
        if os.path.exists(ruta):
            print(f'  {codigo}: ya existe')
            ok += 1
            continue
        try:
            url = buscar_imagen(query)
            if not url:
                fallas.append(codigo)
                print(f'  {codigo}: SIN RESULTADO para "{query}"')
                continue
            descargar(url, ruta)
            print(f'  {codigo}: foto descargada ({os.path.getsize(ruta)//1024} KB)')
            ok += 1
        except Exception as e:
            fallas.append(codigo)
            print(f'  {codigo}: ERROR {e}')
        time.sleep(1)   # cortesía con la API: una petición por segundo

    print(f'\nListo: {ok} fotos en {DESTINO}')
    if fallas:
        print(f'Sin foto (usarán emoji): {", ".join(fallas)}')
    return 1 if fallas else 0


if __name__ == '__main__':
    sys.exit(main())
