"""
views.py — Las vistas del módulo de ventas.

Aquí están los 3 grandes bloques del enunciado:
  1. Control de día (abrir / cerrar)           -> requisito módulo 4
  2. Registro de ventas con IVA y comprobante  -> requisito módulo 2 y 3
  3. Reportes diarios                          -> requisito módulo 5

Cada función es una "vista": recibe una petición HTTP y responde
con JSON. Fíjate que TODAS verifican primero quién está llamando
(usuario_actual) y qué rol tiene. Eso es el control de acceso:
ninguna ruta está desprotegida.

LEER: docs/02-backend.md (sección "Rutas de la API")
"""

from datetime import datetime, time, date

from django.utils import timezone as dj_timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from authapp.helpers import usuario_actual, requiere_rol
from database import db
from .calculos import calcular_venta

# Nombres bonitos para los tipos de documento.
TIPOS_DOCUMENTO = {
    'boleta': 'Boleta',
    'factura': 'Factura',
}

CAMPO_EXTRA_FACTURA = ['rut', 'razon_social', 'giro', 'direccion']


# ---------------------------------------------------------------------------
# FUNCIONES AUXILIARES
# ---------------------------------------------------------------------------

def hoy():
    """Devuelve la fecha de hoy en la zona horaria de Chile (America/Santiago).

    Es importante: si el servidor estuviera en otro huso horario,
    "hoy" sería distinto. Usamos timezone.now() que respeta la
    zona configurada en settings.py.
    """
    return dj_timezone.localtime(dj_timezone.now()).date()


def fecha_a_string(fecha):
    """Convierte una fecha en texto 'AAAA-MM-DD' (el formato que
    usa la base de datos y el frontend para filtrar reportes)."""
    return fecha.isoformat()


def estado_dia(fecha=None):
    """Busca en MongoDB el estado del día (abierto o cerrado).

    Si el día no tiene registro, devuelve 'cerrado': el enunciado
    dice que el jefe debe ABRIR el día para permitir ventas, así
    que el estado por defecto es cerrado.
    """
    if fecha is None:
        fecha = hoy()
    dia = db().dia.find_one({'fecha': fecha_a_string(fecha)})
    if dia is None:
        return 'cerrado'
    return dia['estado']


def siguiente_folio(tipo):
    """Genera el número correlativo de una boleta, factura o pedido.

    Ejemplo: boleta 3 del día -> 'B-0003'  |  factura 7 -> 'F-0007'
    pedido 1 -> 'P-0001'
    Lo logramos con una colección "contadores" en MongoDB:
    leemos el último número usado y lo aumentamos en 1.
    """
    LETRA = {'boleta': 'B', 'factura': 'F', 'pedido': 'P'}
    doc = db().folios.find_one_and_update(
        {'tipo': tipo},                    # buscamos el contador de ese tipo
        {'$inc': {'secuencia': 1}},        # le sumamos 1
        upsert=True,                       # si no existe, lo creamos en 1
        return_document=True,
    )
    return f"{LETRA[tipo]}-{doc['secuencia']:04d}"


# ---------------------------------------------------------------------------
# 1. CONTROL DE DÍA
# ---------------------------------------------------------------------------

@api_view(['GET'])
def consultar_dia(request):
    """El jefe consulta el estado del día de hoy.

    El frontend usa esto para saber si muestra el botón
    "Abrir día" o "Cerrar día".
    """
    user = usuario_actual(request)
    if user is None:
        return Response({'error': 'No has iniciado sesión.'},
                        status=status.HTTP_401_UNAUTHORIZED)

    fecha = fecha_a_string(hoy())
    return Response({
        'fecha': fecha,
        'estado': estado_dia(),
        'rol': user['rol'],
    })


@api_view(['POST'])
@requiere_rol('jefe')
def abrir_dia(request, user):
    """Solo el Jefe de Ventas puede abrir el día (permitir ventas).

    El enunciado: 'Abrir o cerrar el día para permitir o impedir ventas'.
    Guardamos en MongoDB un documento {fecha, estado:'abierto'}.
    """
    fecha = fecha_a_string(hoy())
    db().dia.update_one(
        {'fecha': fecha},
        {'$set': {
            'estado': 'abierto',
            'abierto_por': user['usuario'],
            'abierto_en': dj_timezone.localtime(dj_timezone.now()).isoformat(),
        }},
        upsert=True,
    )
    return Response({'fecha': fecha, 'estado': 'abierto'})


@api_view(['POST'])
@requiere_rol('jefe')
def cerrar_dia(request, user):
    """Solo el Jefe de Ventas puede cerrar el día (impedir ventas)."""
    fecha = fecha_a_string(hoy())
    db().dia.update_one(
        {'fecha': fecha},
        {'$set': {
            'estado': 'cerrado',
            'cerrado_por': user['usuario'],
            'cerrado_en': dj_timezone.localtime(dj_timezone.now()).isoformat(),
        }},
        upsert=True,
    )
    return Response({'fecha': fecha, 'estado': 'cerrado'})


# ---------------------------------------------------------------------------
# 2. REGISTRO DE VENTAS
# ---------------------------------------------------------------------------

@api_view(['POST'])
@requiere_rol('vendedor')
def crear_venta(request, user):
    """Guarda una venta nueva. Es el paso final del módulo 2.

    SECUENCIA COMPLETA de una venta (para el vendedor):
      1. El frontend valida que el día esté ABIERTO (ya se hace antes,
         pero el backend lo vuelve a verificar: la seguridad real
         siempre está en el servidor).
      2. El vendedor manda: producto, cantidad, precio_unitario,
         tipo de documento y (si es factura) los datos del cliente.
      3. El backend recalcula neto, IVA y total (regla de oro:
         el servidor es el dueño de la verdad).
      4. Se guarda el documento completo en la colección "ventas".
    """
    # --- 4.1: ¿está el día abierto? Si no, nadie vende. ---
    if estado_dia() != 'abierto':
        return Response(
            {'error': 'El día está cerrado. Solo el Jefe de Ventas puede abrirlo.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # --- Leer y validar los campos del formulario ---
    datos = request.data
    codigo = str(datos.get('codigo', '')).strip()
    producto = str(datos.get('producto', '')).strip()
    cantidad = datos.get('cantidad')
    precio = datos.get('precio_unitario')
    tipo_doc = datos.get('tipo_documento', '').strip()

    errores = []
    if not codigo:
        errores.append('El código del producto es obligatorio.')
    if not producto:
        errores.append('El nombre del producto es obligatorio.')
    try:
        cantidad = int(cantidad)
        if cantidad <= 0:
            raise ValueError
    except (TypeError, ValueError):
        errores.append('La cantidad debe ser un número entero mayor que 0.')
    try:
        precio = float(precio)
        if precio <= 0:
            raise ValueError
    except (TypeError, ValueError):
        errores.append('El precio unitario debe ser un número mayor que 0.')
    if tipo_doc not in TIPOS_DOCUMENTO:
        errores.append("El tipo de documento debe ser 'boleta' o 'factura'.")

    # --- 2.4: si es factura, pedir datos del cliente ---
    cliente = None
    if tipo_doc == 'factura':
        faltantes = [
            campo for campo in CAMPO_EXTRA_FACTURA
            if not str(datos.get(campo, '')).strip()
        ]
        if faltantes:
            errores.append(
                'Para una FACTURA debes completar: '
                + ', '.join(faltantes) + '.'
            )
        else:
            cliente = {
                'rut': datos['rut'].strip(),
                'razon_social': datos['razon_social'].strip(),
                'giro': datos['giro'].strip(),
                'direccion': datos['direccion'].strip(),
            }

    if errores:
        return Response({'errores': errores},
                        status=status.HTTP_400_BAD_REQUEST)

    # --- 2.2: el BACKEND calcula neto, IVA y total (verdad oficial) ---
    calculos = calcular_venta(cantidad, precio)

    # --- Guardar TODO en MongoDB ---
    ahora = dj_timezone.localtime(dj_timezone.now())
    venta = {
        'folio': siguiente_folio(tipo_doc),
        'fecha': fecha_a_string(ahora.date()),
        'hora': ahora.strftime('%H:%M:%S'),
        'tipo_documento': tipo_doc,
        'codigo_producto': codigo,
        'producto': producto,
        'cantidad': cantidad,
        'precio_unitario': precio,
        'neto': calculos['neto'],
        'iva': calculos['iva'],
        'total': calculos['total'],
        'cliente': cliente,              # solo si es factura, si no None
        'vendedor': {
            'usuario': user['usuario'],
            'nombre': user['nombre_completo'],
        },
        'creado_en': ahora.isoformat(),
    }
    db().ventas.insert_one(venta)

    # MongoDB agrega el campo '_id' (un ObjectId) a todo documento que
    # guarda. Ese tipo NO es serializable a JSON, así que lo quitamos
    # antes de devolver la respuesta al frontend.
    venta.pop('_id', None)

    # Devolvemos la venta completa para que la vista previa sea fiel
    # a lo guardado.
    return Response({'ok': True, 'venta': venta},
                    status=status.HTTP_201_CREATED)


@api_view(['POST'])
@requiere_rol('vendedor')
def vista_previa(request, user):
    """Genera la VISTA PREVIA del comprobante (módulo 3 del enunciado).

    NO guarda nada en la base de datos: solo calcula y devuelve los
    datos tal como se verían impresos. Así el vendedor revisa el
    documento ANTES de confirmar. Cuando confirma, se llama a
    crear_venta() que sí lo guarda.
    """
    if estado_dia() != 'abierto':
        return Response(
            {'error': 'El día está cerrado. Solo el Jefe de Ventas puede abrirlo.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    datos = request.data
    cantidad = int(datos.get('cantidad', 0) or 0)
    precio = float(datos.get('precio_unitario', 0) or 0)

    # El preview usa la MISMA función de cálculo que la venta real:
    # así es imposible que la vista previa y el documento guardado
    # muestren montos distintos.
    calculos = calcular_venta(cantidad, precio)

    cliente = None
    if datos.get('tipo_documento') == 'factura':
        cliente = {
            'rut': datos.get('rut', ''),
            'razon_social': datos.get('razon_social', ''),
            'giro': datos.get('giro', ''),
            'direccion': datos.get('direccion', ''),
        }

    return Response({
        'vista_previa': {
            'tipo_documento': datos.get('tipo_documento'),
            # El formulario manda 'codigo' (ver FORMULARIO_VACIO en Vendedor.jsx);
            # en el documento guardado el campo se llama 'codigo_producto'.
            'codigo_producto': datos.get('codigo', ''),
            'producto': datos.get('producto', ''),
            'cantidad': cantidad,
            'precio_unitario': precio,
            **calculos,
            'cliente': cliente,
            'vendedor': user['nombre_completo'],
            'fecha': fecha_a_string(hoy()),
        }
    })


# ---------------------------------------------------------------------------
# 3. REPORTES DIARIOS
# ---------------------------------------------------------------------------

@api_view(['GET'])
@requiere_rol('jefe')
def reporte_diario(request, user):
    """Reporte del día (módulo 5). Solo el Jefe de Ventas.

    Toma TODOS los datos directamente de MongoDB (requisito 5.5):
    no hay nada "calcado en el código": se leen las ventas reales.

    ¿Cómo filtra por día? Compara el campo 'fecha' (AAAA-MM-DD)
    de cada venta con la fecha pedida. Si no se pasa fecha, usa
    la de hoy. Formato de la URL:
        /api/ventas/reporte/diario?fecha=2026-08-17
    """
    fecha = request.query_params.get('fecha')
    if fecha is None:
        fecha = fecha_a_string(hoy())
    else:
        try:
            # Validamos que la fecha escrita sea una fecha válida.
            datetime.strptime(fecha, '%Y-%m-%d')
        except ValueError:
            return Response(
                {'error': "Fecha inválida. Usa el formato AAAA-MM-DD (ej: 2026-08-17)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    ventas = list(db().ventas.find({'fecha': fecha}))
    if not ventas:
        return Response({
            'fecha': fecha,
            'mensaje': 'No hay ventas registradas para este día.',
            'resumen': _resumen_vacio(),
            'por_vendedor': [],
        })

    return Response({
        'fecha': fecha,
        'resumen': _resumen_ventas(ventas),
        'por_vendedor': _desglose_por_vendedor(ventas),
    })


def _resumen_ventas(ventas):
    """Agrupa las ventas y devuelve los totales del reporte."""
    boletas = [v for v in ventas if v['tipo_documento'] == 'boleta']
    facturas = [v for v in ventas if v['tipo_documento'] == 'factura']

    def sumar(ventas, campo):
        return round(sum(v[campo] for v in ventas), 2)

    return {
        'total_ventas': len(ventas),
        'total_boletas': len(boletas),
        'total_facturas': len(facturas),
        'monto_boletas': sumar(boletas, 'total'),
        'monto_facturas': sumar(facturas, 'total'),
        'total_neto': sumar(ventas, 'neto'),
        'total_iva': sumar(ventas, 'iva'),
        'total_recaudado': sumar(ventas, 'total'),
    }


def _desglose_por_vendedor(ventas):
    """Devuelve el total vendido por cada vendedor (requisito 5.3)."""
    por_vendedor = {}
    for v in ventas:
        usuario = v['vendedor']['usuario']
        if usuario not in por_vendedor:
            por_vendedor[usuario] = {
                'vendedor': usuario,
                'nombre': v['vendedor']['nombre'],
                'cantidad_ventas': 0,
                'monto_neto': 0.0,
                'monto_iva': 0.0,
                'monto_total': 0.0,
            }
        item = por_vendedor[usuario]
        item['cantidad_ventas'] += 1
        item['monto_neto'] += v['neto']
        item['monto_iva'] += v['iva']
        item['monto_total'] += v['total']

    for item in por_vendedor.values():
        item['monto_neto'] = round(item['monto_neto'], 2)
        item['monto_iva'] = round(item['monto_iva'], 2)
        item['monto_total'] = round(item['monto_total'], 2)

    # Ordenamos de mayor a menor monto total (los que más vendieron primero).
    return sorted(por_vendedor.values(), key=lambda x: x['monto_total'], reverse=True)


def _resumen_vacio():
    """Estructura del resumen cuando no hay ventas (todos los montos en 0)."""
    return {
        'total_ventas': 0,
        'total_boletas': 0,
        'total_facturas': 0,
        'monto_boletas': 0,
        'monto_facturas': 0,
        'total_neto': 0,
        'total_iva': 0,
        'total_recaudado': 0,
    }
