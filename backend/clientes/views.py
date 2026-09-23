"""
views.py — Los CLIENTES registrados.

¿Por qué existe el registro de clientes?
Para que el cliente guarde sus datos (RUT, dirección, etc.) y la
PRÓXIMA vez que compre sea más rápido: el vendedor escribe su RUT
en el formulario de factura y el sistema autocompleta todo.

Endpoints:

  POST   /api/clientes/registro       -> PÚBLICO: crear cuenta de cliente
  GET    /api/clientes/buscar?rut=... -> vendedor/jefe: buscar cliente
  GET    /api/clientes/me             -> cliente: ver mis datos
  PUT    /api/clientes/me             -> cliente: actualizar mis datos

La colección "clientes" guarda documentos como este:

  {
    nombre: "María Pérez",
    rut: "12.345.678-9",
    email: "maria@mail.com",
    telefono: "+569 1234 5678",
    direccion: "Av. Brasil 1200, Valparaíso",
    giro: "Comercio minorista",
    password_hash: "pbkdf2_sha256$..."   # NUNCA la contraseña en texto
  }
"""

import re

from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone as dj_timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from authapp.helpers import requiere_rol, usuario_actual, verificar_credenciales
from database import db

CAMPOS_CLIENTE = ['nombre', 'rut', 'email', 'telefono', 'direccion', 'giro']


def _datos_sin_secreto(cliente):
    """Devuelve los datos del cliente SIN el hash de contraseña."""
    cliente = dict(cliente)
    cliente.pop('password_hash', None)
    cliente.pop('_id', None)
    return cliente


@api_view(['POST'])
def registrarse(request):
    """PÚBLICO: cualquiera puede crear una cuenta de cliente (opcional).

    El cliente guarda sus datos para comprar más rápido la próxima vez.
    La contraseña se guarda hasheada (seguridad: ver helpers.py).
    """
    nombre = str(request.data.get('nombre', '')).strip()
    rut = str(request.data.get('rut', '')).strip()
    email = str(request.data.get('email', '')).strip().lower()
    telefono = str(request.data.get('telefono', '')).strip()
    direccion = str(request.data.get('direccion', '')).strip()
    password = request.data.get('password', '')

    errores = []
    if not nombre:
        errores.append('El nombre es obligatorio.')
    if not rut:
        errores.append('El RUT es obligatorio.')
    elif db().clientes.find_one({'rut': rut}):
        errores.append(f'Ya existe un cliente con el RUT {rut}.')
    if not email:
        errores.append('El email es obligatorio.')
    elif not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        errores.append('El email no es válido.')
    elif db().clientes.find_one({'email': email}):
        errores.append('Ya existe una cuenta con ese email.')
    if len(password) < 6:
        errores.append('La contraseña debe tener al menos 6 caracteres.')

    if errores:
        return Response({'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

    cliente = {
        'nombre': nombre,
        'rut': rut,
        'email': email,
        'telefono': telefono,
        'direccion': direccion,
        'giro': str(request.data.get('giro', '')).strip(),
        'password_hash': make_password(password),
        'rol': 'cliente',
        'creado_en': dj_timezone.localtime(dj_timezone.now()).isoformat(),
    }
    db().clientes.insert_one(cliente)

    # Registro exitoso = sesión iniciada automáticamente.
    # Reutilizamos verificar_credenciales + el flujo normal de login.
    cliente['coleccion'] = 'clientes'
    from authapp.helpers import generar_token
    token = generar_token(cliente)

    return Response({
        'ok': True,
        'mensaje': '¡Cuenta creada! Bienvenido al bazar.',
        'token': token,
        'rol': 'cliente',
        'rol_nombre': 'Cliente',
        'nombre': cliente['nombre'],
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@requiere_rol('vendedor', 'jefe')
def buscar_cliente(request, user):
    """vendedor/jefe: busca un cliente por su RUT.

    Este es el "comprar más rápido": al escribir el RUT en el
    formulario de factura, el sistema autocompleta los datos.
    """
    rut = request.query_params.get('rut', '').strip()
    if not rut:
        return Response({'error': 'Debes indicar el RUT a buscar (?rut=...)'},
                        status=status.HTTP_400_BAD_REQUEST)

    cliente = db().clientes.find_one({'rut': rut})
    if cliente is None:
        return Response({'encontrado': False, 'mensaje': 'Cliente no registrado.'})

    return Response({
        'encontrado': True,
        'cliente': _datos_sin_secreto(cliente),
    })


@api_view(['GET', 'PUT'])
@requiere_rol('cliente')
def mis_datos(request, user):
    """cliente: ver (GET) o actualizar (PUT) sus propios datos.

    UNA vista para los dos métodos (lección del bug "Método no
    permitido": si separamos las vistas en urls.py, Django toma la
    primera coincidencia y rechaza el resto de métodos).
    """
    if request.method == 'GET':
        return Response({'cliente': _datos_sin_secreto(user)})

    # PUT: actualizar.
    cambios = {}
    for campo in CAMPOS_CLIENTE:
        valor = str(request.data.get(campo, '')).strip()
        if valor:
            cambios[campo] = valor

    # Si el cliente cambia la contraseña, también se actualiza (hasheada).
    nueva_password = request.data.get('password', '')
    if nueva_password:
        if len(nueva_password) < 6:
            return Response({'errores': ['La contraseña debe tener al menos 6 caracteres.']},
                            status=status.HTTP_400_BAD_REQUEST)
        cambios['password_hash'] = make_password(nueva_password)

    if not cambios:
        return Response({'error': 'No enviaste ningún dato para actualizar.'},
                        status=status.HTTP_400_BAD_REQUEST)

    db().clientes.update_one({'_id': user['_id']}, {'$set': cambios})
    cliente = db().clientes.find_one({'_id': user['_id']})
    return Response({'ok': True, 'cliente': _datos_sin_secreto(cliente)})
