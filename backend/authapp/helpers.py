"""
helpers.py — Utilidades de autenticación compartidas por todo el backend.

¿Qué es un TOKEN?
Cuando alguien inicia sesión, el backend genera un token:
un "carnet digital" único (ej: 3f2a9c1b-...). El token se guarda en
MongoDB y se le entrega al frontend. A partir de ese momento, el
frontend lo manda en CADA petición (cabecera Authorization) para
demostrar "yo ya me identifiqué". Al cerrar sesión, el token se
borra de la base y el carnet deja de servir.

ROLES Y COLECCIONES
El sistema tiene TRES roles, y cada uno vive en su colección:

  colección "usuarios"   -> vendedor, jefe   (se identifican con su
                             nombre de usuario)
  colección "clientes"   -> cliente          (se identifica con su
                             correo electrónico)

Por eso verificar_credenciales y usuario_por_token buscan en DOS
colecciones, y cada token guarda en qué colección vive su dueño.

LEER: docs/02-backend.md (sección "Cómo funciona la autenticación")
"""

import uuid

from django.contrib.auth.hashers import check_password, make_password
from database import db


def crear_usuario(usuario, password, rol, nombre_completo):
    """Crea un usuario interno (vendedor o jefe).

    make_password() convierte la contraseña en un "hash": un texto
    ilegible que NO se puede volver a convertir en la original.
    Así, si alguien roba la base de datos, no obtiene contraseñas.
    """
    db().usuarios.insert_one({
        'usuario': usuario,
        'password_hash': make_password(password),
        'rol': rol,                      # 'vendedor' | 'jefe'
        'nombre_completo': nombre_completo,
    })


def verificar_credenciales(identificador, password):
    """Valida usuario/email y contraseña contra MongoDB.

    Busca primero en "usuarios" (por nombre de usuario) y después en
    "clientes" (por email). Devuelve el documento encontrado (con un
    campo extra 'coleccion' para saber de dónde salió), o None.
    """
    user = db().usuarios.find_one({'usuario': identificador})
    coleccion = 'usuarios'
    if user is None:
        user = db().clientes.find_one({'email': identificador})
        coleccion = 'clientes'
    if user is None:
        return None
    # check_password compara la contraseña escrita contra el hash guardado.
    if not check_password(password, user['password_hash']):
        return None
    user['coleccion'] = coleccion
    return user


def generar_token(user):
    """Crea un token de sesión y lo guarda en MongoDB."""
    token = str(uuid.uuid4())            # ej: '3f2a9c1b-8d7e-4f5a-9b2c-1d0e2f3a4b5c'
    db().tokens.insert_one({
        'token': token,
        'usuario_id': user['_id'],
        'coleccion': user['coleccion'],  # de dónde salió el usuario
        'rol': user['rol'],
    })
    return token


def revocar_token(token):
    """Borra el token (cierre de sesión)."""
    db().tokens.delete_one({'token': token})


def usuario_por_token(token):
    """Busca a qué persona pertenece un token.

    Como los clientes viven en otra colección, miramos el campo
    'coleccion' del token para saber dónde buscar.

    Devuelve el documento (con su campo 'coleccion'), o None si el
    token no existe (sesión vencida / no iniciada).
    """
    sesion = db().tokens.find_one({'token': token})
    if sesion is None:
        return None
    user = db()[sesion['coleccion']].find_one({'_id': sesion['usuario_id']})
    if user is not None:
        user['coleccion'] = sesion['coleccion']
    return user


def usuario_actual(request):
    """Lee la cabecera 'Authorization' de la petición HTTP y
    devuelve el usuario autenticado (o None).

    El frontend manda:  Authorization: Token 3f2a9c1b-...
    """
    cabecera = request.headers.get('Authorization', '')
    if not cabecera.startswith('Token '):
        return None
    token = cabecera.replace('Token ', '', 1)
    return usuario_por_token(token)


def datos_publicos(user):
    """Convierte un documento de usuario/cliente en un dict seguro
    para responder al frontend (nunca se manda el password_hash).

    Normaliza los nombres de campos entre colecciones:
      - usuarios: 'usuario' y 'nombre_completo'
      - clientes: 'email'   y 'nombre'
    """
    es_cliente = user['rol'] == 'cliente'
    return {
        'identificador': user.get('usuario') or user.get('email'),
        'rol': user['rol'],
        'nombre': user.get('nombre_completo') or user.get('nombre'),
        'es_cliente': es_cliente,
    }


def requiere_rol(*roles):
    """Decorador: protege una vista para que SOLO los roles indicados
    puedan ejecutarla.

    Uso:
        @api_view(['POST'])
        @requiere_rol('jefe')
        def abrir_dia(request, user):
            ...

        @api_view(['POST'])
        @requiere_rol('vendedor', 'jefe')   # varios roles
        def crear_producto(request, user):
            ...
    """
    def decorador(vista):
        def envoltura(request, *args, **kwargs):
            user = usuario_actual(request)
            if user is None:
                return _error_autenticacion()
            if user['rol'] not in roles:
                return _error_permiso()
            return vista(request, user, *args, **kwargs)
        return envoltura
    return decorador


def _error_autenticacion():
    from rest_framework.response import Response
    from rest_framework import status
    return Response(
        {'error': 'No has iniciado sesión o tu sesión expiró.'},
        status=status.HTTP_401_UNAUTHORIZED,
    )


def _error_permiso():
    from rest_framework.response import Response
    from rest_framework import status
    return Response(
        {'error': 'No tienes permiso para realizar esta acción.'},
        status=status.HTTP_403_FORBIDDEN,
    )
