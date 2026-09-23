"""
views.py — Las "vistas" de la app de autenticación.

En Django REST Framework, una vista es una función de Python que
recibe una petición HTTP (request) y devuelve una respuesta HTTP
(response) con formato JSON.

El flujo completo del login:
  1. El frontend hace:  POST /api/auth/login   con {"usuario": "...", "password": "..."}
  2. Django recibe el request y llama a esta función.
  3. verificar_credenciales() revisa en MongoDB si el usuario existe
     y si la contraseña es correcta.
  4. Si todo está bien, generamos un token y lo devolvemos.
  5. El frontend guarda el token y ya puede operar.

LEER: docs/02-backend.md (sección "Rutas de la API")
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .helpers import (
    generar_token,
    revocar_token,
    usuario_actual,
    verificar_credenciales,
    requiere_rol,
    datos_publicos,
)

# ROLES permitidos en el sistema. Un diccionario nos sirve como
# "catálogo" para validar y mostrar nombres bonitos.
ROLES = {
    'vendedor': 'Vendedor',
    'jefe': 'Jefe de Ventas',
    'cliente': 'Cliente',
}


@api_view(['POST'])
def login(request):
    """Paso 1 y 2 del enunciado: validar credenciales y asignar rol.

    Funciona para los TRES roles:
      - vendedor/jefe: se identifican con su nombre de usuario
      - cliente: se identifica con su correo electrónico
    """
    usuario = request.data.get('usuario', '').strip()
    password = request.data.get('password', '')

    if not usuario or not password:
        return Response(
            {'error': 'Debes ingresar usuario y contraseña.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = verificar_credenciales(usuario, password)
    if user is None:
        return Response(
            {'error': 'Usuario o contraseña incorrectos.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token = generar_token(user)
    publicos = datos_publicos(user)

    return Response({
        'token': token,
        'rol': publicos['rol'],
        'rol_nombre': ROLES[publicos['rol']],
        'nombre': publicos['nombre'],
    })


@api_view(['POST'])
def logout(request):
    """Cierra la sesión: borra el token de MongoDB."""
    user = usuario_actual(request)
    if user is not None:
        token = request.headers.get('Authorization', '').replace('Token ', '', 1)
        revocar_token(token)
    return Response({'ok': True})


@api_view(['GET'])
def me(request):
    """Devuelve los datos del usuario autenticado.

    El frontend lo llama al recargar la página para saber quién es
    el usuario (sin pedirle la contraseña de nuevo).
    """
    user = usuario_actual(request)
    if user is None:
        return Response(
            {'error': 'No has iniciado sesión.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    publicos = datos_publicos(user)
    return Response({
        'usuario': publicos['identificador'],
        'rol': publicos['rol'],
        'rol_nombre': ROLES[publicos['rol']],
        'nombre': publicos['nombre'],
    })
