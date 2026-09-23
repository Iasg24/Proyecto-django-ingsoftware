"""
views.py — Los PEDIDOS de los clientes (compra online).

Ciclo de vida de un pedido (el patrón "máquina de estados"):

  pendiente ──► confirmado   (la tienda lo acepta: se descuentan
      │                       stock y se crean las VENTAS con folio)
      └──────► rechazado    (la tienda lo rechaza)

  ┌──────────────────────────────────────────────────────────┐
  │ 1. CLIENTE (público, con o sin cuenta)                    │
  │    POST /api/pedidos/                                     │
  │    -> el backend recalcula precios y totales (regla de    │
  │       oro: nunca confía en los totales del navegador)     │
  │    -> crea el pedido con estado 'pendiente'               │
  │                                                           │
  │ 2. TIENDA (vendedor o jefe)                               │
  │    GET  /api/pedidos/                                     │
  │    POST /api/pedidos/<numero>/confirmar                   │
  │       -> verifica stock                                   │
  │       -> descuenta stock de cada producto                 │
  │       -> crea una VENTA (boleta) por cada producto        │
  │       -> pedido pasa a 'confirmado'                       │
  │    POST /api/pedidos/<numero>/rechazar                    │
  │       -> pedido pasa a 'rechazado' (no toca stock)        │
  └──────────────────────────────────────────────────────────┘

¿Por qué no una venta directa? (lección de diseño)
Porque el cliente compra "en línea" y la tienda procesa después
(como comprar por internet y retirar). Si la venta fuera directa,
un cliente podría comprar aunque el jefe haya cerrado el día.
Con pedidos, el control de día de la tienda se mantiene intacto.
"""

import re
from datetime import datetime

from django.utils import timezone as dj_timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from authapp.helpers import requiere_rol
from database import db
from ventas.calculos import calcular_venta   # la MISMA función que las ventas
from ventas.views import siguiente_folio
from .pagos import (
    METODOS,
    procesar_pago,
    stripe_activo,
    crear_checkout_stripe,
    completar_pago_stripe,
)


def _hoy():
    return dj_timezone.localtime(dj_timezone.now()).date().isoformat()


def _usuario_o_401(request):
    """Devuelve el usuario autenticado o una respuesta 401."""
    from authapp.helpers import usuario_actual
    user = usuario_actual(request)
    if user is None:
        from authapp.helpers import _error_autenticacion
        return _error_autenticacion()
    return user


def _sin_id(pedido):
    pedido = dict(pedido)
    pedido.pop('_id', None)
    return pedido


def _validar_cliente(datos):
    """Valida los datos del cliente que compra (público, puede no
    tener cuenta). Devuelve (cliente, errores)."""
    errores = []
    nombre = str(datos.get('nombre', '')).strip()
    email = str(datos.get('email', '')).strip().lower()
    rut = str(datos.get('rut', '')).strip()
    direccion = str(datos.get('direccion', '')).strip()

    if not nombre:
        errores.append('El nombre es obligatorio.')
    if not email or not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        errores.append('El email no es válido.')
    if not rut:
        errores.append('El RUT es obligatorio.')
    if not direccion:
        errores.append('La dirección es obligatoria.')

    cliente = {
        'nombre': nombre,
        'email': email,
        'rut': rut,
        'direccion': direccion,
    }
    return cliente, errores


@api_view(['POST', 'GET'])
def coleccion_pedidos(request):
    """UNA vista para la raíz /api/pedidos/.

      - POST: PÚBLICO. Cualquier persona (registrada o no) hace un pedido.
      - GET:  solo vendedor/jefe, lista los pedidos.
    """
    if request.method == 'GET':
        # vendedor/jefe: la lista de pedidos (filtro por estado opcional).
        user = _usuario_o_401(request)
        if isinstance(user, Response):
            return user
        if user['rol'] not in ('vendedor', 'jefe'):
            from authapp.helpers import _error_permiso
            return _error_permiso()

        filtro = {}
        estado = request.query_params.get('estado')
        if estado:
            filtro['estado'] = estado
        pedidos = [
            _sin_id(p) for p in db().pedidos.find(filtro).sort('creado_en', -1)
        ]
        return Response({'pedidos': pedidos})

    # ===================== POST (crear pedido) =====================
    # El cuerpo de la petición:
    #   {
    #     "items": [ {"codigo": "A-001", "cantidad": 2}, ... ],
    #     "cliente": { "nombre": "...", "email": "...", "rut": "...", "direccion": "..." }
    #   }
    #
    # Lo que hace el backend:
    #   1. Valida que el carro no esté vacío.
    #   2. Por CADA producto busca su precio REAL en el catálogo.
    #   3. Calcula neto/IVA/total por línea y el total general.
    #   4. Verifica stock suficiente.
    #   5. Guarda el pedido como 'pendiente'.
    items_crudos = request.data.get('items')
    cliente, errores = _validar_cliente(request.data.get('cliente', {}))

    if not isinstance(items_crudos, list) or not items_crudos:
        errores.append('El carro está vacío.')

    if errores:
        return Response({'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

    # ---- Construir las líneas del pedido con datos de la base ----
    items = []
    for linea in items_crudos:
        codigo = str(linea.get('codigo', '')).strip()
        try:
            cantidad = int(linea.get('cantidad', 0))
            if cantidad <= 0:
                raise ValueError
        except (TypeError, ValueError):
            errores.append(f'Cantidad inválida para el producto {codigo}.')
            continue

        producto = db().productos.find_one({'codigo': codigo})
        if producto is None:
            errores.append(f'El producto {codigo} no existe en el catálogo.')
            continue

        # Precio SIEMPRE del catálogo, nunca del navegador.
        calculos = calcular_venta(cantidad, producto['precio'])
        if producto['stock'] < cantidad:
            errores.append(
                f'Stock insuficiente para {producto["nombre"]} '
                f'(hay {producto["stock"]}, pides {cantidad}).'
            )

        items.append({
            'codigo': producto['codigo'],
            'producto': producto['nombre'],
            'cantidad': cantidad,
            'precio_unitario': producto['precio'],
            **calculos,   # neto, iva, total de la línea
        })

    if errores:
        return Response({'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

    totales = {
        'neto': round(sum(i['neto'] for i in items), 2),
        'iva': round(sum(i['iva'] for i in items), 2),
        'total': round(sum(i['total'] for i in items), 2),
    }

    # ---- PAGO (ver pagos.py para la explicación completa) ----
    #   - tarjeta + llaves de Stripe configuradas:
    #       creamos una Checkout Session REAL (modo prueba) y
    #       redirigimos al cliente a la página oficial de Stripe.
    #   - cualquier otro caso: pasarela simulada (proyecto escolar).
    datos_pago = request.data.get('pago', {}) or {}
    metodo = str(datos_pago.get('metodo', '')).strip()

    usar_stripe = (
        metodo == 'tarjeta'
        and stripe_activo()
    )

    if usar_stripe:
        pago = {
            'metodo': 'tarjeta',
            'estado': 'procesando',   # se confirma al volver de Stripe
        }
    else:
        errores_pago, pago = procesar_pago(datos_pago)
        if errores_pago:
            return Response({'errores': errores_pago},
                            status=status.HTTP_400_BAD_REQUEST)

    ahora = dj_timezone.localtime(dj_timezone.now())
    pedido = {
        'numero': siguiente_folio('pedido'),
        'estado': 'pendiente',
        'items': items,
        'cliente': cliente,
        'totales': totales,
        'pago': pago,
        'fecha': _hoy(),
        'creado_en': ahora.isoformat(),
        'ventas_folios': [],
    }

    if usar_stripe:
        # Creamos la sesión de pago en Stripe con los totales que
        # calculamos nosotros (el navegador no pudo tocarlos).
        try:
            url_stripe, session_id, error_stripe = crear_checkout_stripe(pedido)
        except Exception as e:
            url_stripe, session_id, error_stripe = None, None, str(e)
        if error_stripe:
            return Response(
                {'errores': [f'No se pudo iniciar el pago con Stripe: {error_stripe}']},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        pedido['pago']['stripe_session_id'] = session_id
        db().pedidos.insert_one(pedido)

        return Response({
            'ok': True,
            # El frontend redirige al cliente a esta URL (página de pago de Stripe).
            'stripe_url': url_stripe,
            'pedido': _sin_id(pedido),
        }, status=status.HTTP_201_CREATED)

    db().pedidos.insert_one(pedido)

    return Response({
        'ok': True,
        'mensaje': f'Pedido {pedido["numero"]} recibido. La tienda lo confirmará.',
        'pedido': _sin_id(pedido),
    }, status=status.HTTP_201_CREATED)


def _buscar_pedido(numero):
    """Devuelve el pedido o una respuesta de error 404."""
    pedido = db().pedidos.find_one({'numero': numero})
    if pedido is None:
        return None, Response(
            {'error': f'No existe el pedido {numero}.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return pedido, None


@api_view(['POST'])
def completar_pago(request, numero):
    """Se llama CUANDO EL CLIENTE VUELVE DE LA PÁGINA DE STRIPE.

    NO confiamos en el navegador: le preguntamos a Stripe si el
    pago realmente ocurrió (session_id en el cuerpo de la petición
    lo verifica contra el pedido guardado).

    Si Stripe dice "pagado" -> pago.estado = 'pagado' con la marca
    y los últimos 4 dígitos de la tarjeta (nada más se guarda).
    """
    pedido, error = _buscar_pedido(numero)
    if error:
        return error

    pago = pedido.get('pago', {})
    if pago.get('estado') == 'pagado':
        return Response({'ok': True, 'pedido': _sin_id(pedido)})

    session_id = str(request.data.get('session_id', '')).strip()
    if pago.get('estado') != 'procesando' or pago.get('stripe_session_id') != session_id:
        return Response(
            {'error': 'Este pedido no tiene un pago pendiente de verificación.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    pagado, tarjeta, error_stripe = completar_pago_stripe(session_id)
    if error_stripe:
        return Response({'error': error_stripe}, status=status.HTTP_502_BAD_GATEWAY)
    if not pagado:
        return Response(
            {'error': 'El pago no fue completado en Stripe. Vuelve a intentarlo.'},
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )

    db().pedidos.update_one(
        {'numero': numero},
        {'$set': {
            'pago': {
                **pago,
                'estado': 'pagado',
                'tarjeta': tarjeta,
                'procesado_en': dj_timezone.localtime(dj_timezone.now()).isoformat(),
            },
        }},
    )

    pedido_actualizado = db().pedidos.find_one({'numero': numero})
    return Response({'ok': True, 'pedido': _sin_id(pedido_actualizado)})


@api_view(['POST'])
@requiere_rol('vendedor', 'jefe')
def confirmar_pedido(request, user, numero):
    """vendedor/jefe: la tienda acepta el pedido.

    Aquí ocurre "la magia" del negocio:
      1. Verifica que el pedido siga 'pendiente'.
      2. Verifica stock de nuevo (pudo cambiar entre la orden y hoy).
      3. Descuenta stock de cada producto.
      4. Convierte CADA línea del pedido en una VENTA (boleta) con folio.
      5. Marca el pedido como 'confirmado' y guarda los folios.
    """
    pedido, error = _buscar_pedido(numero)
    if error:
        return error

    if pedido['estado'] != 'pendiente':
        return Response(
            {'error': f'El pedido {numero} ya fue procesado (estado: {pedido["estado"]}).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---- 1 y 2: verificar stock antes de tocar cualquier cosa ----
    for linea in pedido['items']:
        producto = db().productos.find_one({'codigo': linea['codigo']})
        if producto is None or producto['stock'] < linea['cantidad']:
            disponible = producto['stock'] if producto else 0
            return Response(
                {'error': f'Stock insuficiente de {linea["producto"]} '
                          f'(hay {disponible}). El pedido sigue pendiente.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # ---- 3 y 4: descuento stock + crear una venta por línea ----
    ahora = dj_timezone.localtime(dj_timezone.now())
    folios = []
    for linea in pedido['items']:
        db().productos.update_one(
            {'codigo': linea['codigo']},
            {'$inc': {'stock': -linea['cantidad']}},   # $inc = restar
        )

        # Cada línea se registra como BOLETA (compra de mostrador online).
        venta = {
            'folio': siguiente_folio('boleta'),
            'fecha': _hoy(),
            'hora': ahora.strftime('%H:%M:%S'),
            'tipo_documento': 'boleta',
            'codigo_producto': linea['codigo'],
            'producto': linea['producto'],
            'cantidad': linea['cantidad'],
            'precio_unitario': linea['precio_unitario'],
            'neto': linea['neto'],
            'iva': linea['iva'],
            'total': linea['total'],
            'cliente': None,
            'vendedor': {
                'usuario': user['usuario'] or user.get('email'),
                'nombre': user.get('nombre_completo') or user.get('nombre'),
            },
            'origen': 'pedido_online',     # cómo llegó esta venta
            'pedido_numero': numero,
            'creado_en': ahora.isoformat(),
        }
        db().ventas.insert_one(venta)
        folios.append(venta['folio'])

    # ---- 5: marcar confirmado ----
    db().pedidos.update_one(
        {'numero': numero},
        {'$set': {
            'estado': 'confirmado',
            'confirmado_por': user['usuario'] or user.get('email'),
            'confirmado_en': ahora.isoformat(),
            'ventas_folios': folios,
        }},
    )

    return Response({
        'ok': True,
        'mensaje': f'Pedido {numero} confirmado: {len(folios)} ventas creadas.',
        'ventas_folios': folios,
    })


@api_view(['POST'])
@requiere_rol('vendedor', 'jefe')
def rechazar_pedido(request, user, numero):
    """vendedor/jefe: la tienda rechaza el pedido (no toca stock)."""
    pedido, error = _buscar_pedido(numero)
    if error:
        return error

    if pedido['estado'] != 'pendiente':
        return Response(
            {'error': f'El pedido {numero} ya fue procesado (estado: {pedido["estado"]}).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ahora = dj_timezone.localtime(dj_timezone.now())
    db().pedidos.update_one(
        {'numero': numero},
        {'$set': {
            'estado': 'rechazado',
            'rechazado_por': user['usuario'] or user.get('email'),
            'rechazado_en': ahora.isoformat(),
        }},
    )
    return Response({'ok': True, 'mensaje': f'Pedido {numero} rechazado.'})
