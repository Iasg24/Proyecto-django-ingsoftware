"""
views.py — El CATÁLOGO DE PRODUCTOS.

El catálogo es la vitrina del bazar: la lista de repuestos que los
clientes pueden ver. ¿Quién accede a qué?

  URL                          Métodos            Quién
  ---------------------------  ----------------   -------------------
  /api/productos/              GET                PÚBLICO (sin login)
                               POST               vendedor o jefe
  /api/productos/<codigo>/     PUT                vendedor o jefe
                               DELETE             vendedor o jefe

Fíjate en el patrón: UNA sola vista por URL que atiende TODOS los
métodos (se ramifica con request.method). Si separáramos las vistas
por método en urls.py, Django tomaría la primera coincidencia y
rechazaría los demás métodos con "Método X no permitido" (bug real
que vimos en esta sesión).

El control de acceso es doble:
  1. La vista revisa quién está llamando (usuario_actual).
  2. Si el rol no es vendedor ni jefe, responde 403 SIN ejecutar nada.
"""

from django.utils import timezone as dj_timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from authapp.helpers import usuario_actual
from database import db

ROLES_ADMIN_CATALOGO = ('vendedor', 'jefe')


def _sin_id(producto):
    """Quita el _id de Mongo (no es serializable a JSON)."""
    producto = dict(producto)
    producto.pop('_id', None)
    return producto


def _validar(datos, actualizar=False):
    """Valida los datos de un producto y devuelve (campos, errores).

    'actualizar=True' significa edición: los campos vacíos se ignoran
    y no se tocan.
    """
    errores = []
    campos = {}

    codigo = str(datos.get('codigo', '')).strip()
    nombre = str(datos.get('nombre', '')).strip()
    categoria = str(datos.get('categoria', '')).strip() or 'General'

    if not actualizar:
        if not codigo:
            errores.append('El código es obligatorio.')
        elif db().productos.find_one({'codigo': codigo}):
            errores.append(f'Ya existe un producto con el código {codigo}.')
        if not nombre:
            errores.append('El nombre es obligatorio.')

    try:
        precio = float(datos.get('precio', 0))
        if precio <= 0:
            raise ValueError
    except (TypeError, ValueError):
        errores.append('El precio debe ser un número mayor que 0.')

    try:
        stock = int(datos.get('stock', 0))
        if stock < 0:
            raise ValueError
    except (TypeError, ValueError):
        errores.append('El stock debe ser un número entero mayor o igual que 0.')

    campos.update({
        'codigo': codigo,
        'nombre': nombre,
        'categoria': categoria,
        'precio': precio,
        'stock': stock,
        'descripcion': str(datos.get('descripcion', '')).strip(),
        # URL de la foto del producto (si el catálogo no trae foto,
        # el frontend muestra un emoji por categoría).
        'imagen': str(datos.get('imagen', '')).strip(),
    })
    return campos, errores


def _autorizar_administrador(request):
    """Devuelve el usuario si tiene permiso para administrar el
    catálogo, o una respuesta de error (401/403)."""
    user = usuario_actual(request)
    if user is None:
        from authapp.helpers import _error_autenticacion
        return None, _error_autenticacion()
    if user['rol'] not in ROLES_ADMIN_CATALOGO:
        from authapp.helpers import _error_permiso
        return None, _error_permiso()
    return user, None


# ---------------------------------------------------------------------------
# /api/productos/  -> GET (público) | POST (vendedor/jefe)
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def coleccion_productos(request):
    if request.method == 'GET':
        # PÚBLICO: cualquiera puede ver el catálogo (no requiere login).
        productos = [_sin_id(p) for p in db().productos.find().sort('codigo', 1)]
        return Response({'productos': productos})

    # POST: crear producto (solo vendedor o jefe).
    user, error = _autorizar_administrador(request)
    if error:
        return error

    campos, errores = _validar(request.data)
    if errores:
        return Response({'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

    campos['creado_por'] = user['usuario'] or user.get('email')
    campos['creado_en'] = dj_timezone.localtime(dj_timezone.now()).isoformat()
    db().productos.insert_one(campos)
    return Response({'ok': True, 'producto': _sin_id(campos)},
                    status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# /api/productos/<codigo>/  -> PUT | DELETE (vendedor/jefe)
# ---------------------------------------------------------------------------

@api_view(['PUT', 'DELETE'])
def detalle_producto(request, codigo):
    user, error = _autorizar_administrador(request)
    if error:
        return error

    existente = db().productos.find_one({'codigo': codigo})
    if existente is None:
        return Response({'error': f'No existe un producto con código {codigo}.'},
                        status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        db().productos.delete_one({'codigo': codigo})
        return Response({'ok': True, 'eliminado': codigo})

    # PUT: editar. En edición, los campos vacíos NO se tocan:
    # si el vendedor solo cambia el precio, el resto queda igual.
    # (Bug real de esta sesión: un campo vacío sobrescribió el
    # código del producto y el producto quedó "desaparecido".)
    campos, errores = _validar(request.data, actualizar=True)
    if errores:
        return Response({'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

    campos = {k: v for k, v in campos.items() if v != ''}
    campos.pop('codigo', None)   # el código identifica al producto; no se edita
    campos['modificado_por'] = user['usuario'] or user.get('email')
    campos['modificado_en'] = dj_timezone.localtime(dj_timezone.now()).isoformat()

    db().productos.update_one({'codigo': codigo}, {'$set': campos})

    # Incluimos el código en la respuesta (no se editó, pero el
    # frontend espera ver el producto completo).
    campos['codigo'] = codigo
    return Response({'ok': True, 'producto': campos})
