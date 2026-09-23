"""
pagos.py — PAGO SIMULADO (la "pasarela de pago" del proyecto).

¿Qué es una pasarela de pago?
En la vida real, cuando pagas con tarjeta, el dinero NO va directo
a la tienda: pasa por una pasarela (Webpay/Transbank en Chile,
Stripe, PayPal...) que le pregunta al BANCO "¿este cliente tiene
plata?" y responde "aprobado/rechazado".

En este proyecto SIMULAMOS esa pasarela con una función de Python.
En producción la reemplazarías por una llamada HTTP a la pasarela
real. Fíjate en el contrato: la pasarela recibe los datos de pago
y devuelve {aprobado, motivo}.

SEGURIDAD (regla de oro):
  - NUNCA guardamos el número completo de la tarjeta.
  - Solo guardamos los ÚLTIMOS 4 DÍGITOS (para mostrarlos: "Visa •••• 4242")
    y la MARCA (Visa/Mastercard) detectada por el primer dígito.
  - El CVV es de UN SOLO USO: se valida y se olvida.
  - La tarjeta de prueba del proyecto es 4242 4242 4242 4242 (como la
    tarjeta de pruebas estándar de Stripe).
"""

import os
import re
from datetime import datetime

from django.conf import settings

# Marcas de tarjetas según el primer dígito (estándar de la industria):
#   4 -> Visa, 5 -> Mastercard, 3 -> Amex, 6 -> Discover
MARCAS = {
    '4': 'Visa',
    '5': 'Mastercard',
    '3': 'American Express',
    '6': 'Discover',
}

# Métodos de pago aceptados:
METODOS = ('tarjeta', 'transferencia', 'retiro')


def detectar_marca(numero):
    """Devuelve la marca según el primer dígito del número."""
    return MARCAS.get(numero[0], 'Otra')


def validar_tarjeta(numero, titular, mes, anio, cvv):
    """Valida una tarjeta de prueba con las mismas reglas de una pasarela.

    Devuelve (errores, info_guardada).
    La 'info_guardada' NO contiene el número completo ni el CVV.
    """
    errores = []
    solo_digitos = re.sub(r'[\s-]', '', numero)

    if not solo_digitos or not solo_digitos.isdigit():
        errores.append('El número de tarjeta debe contener solo dígitos.')
    elif len(solo_digitos) < 13 or len(solo_digitos) > 19:
        errores.append('El número de tarjeta debe tener entre 13 y 19 dígitos.')
    elif not _verificar_luhn(solo_digitos):
        # El algoritmo de Luhn es el chequeo matemático real que usan
        # los bancos: detecta números mal tipeados al instante.
        errores.append('El número de tarjeta no es válido (falló la verificación de Luhn).')

    if not titular or len(titular.strip()) < 3:
        errores.append('El titular de la tarjeta es obligatorio.')

    try:
        mes_n = int(mes)
        anio_n = int(anio)
        if mes_n < 1 or mes_n > 12:
            raise ValueError
        # Vencimiento: el mes/año deben ser futuros respecto a hoy.
        hoy = datetime.now()
        if anio_n < (hoy.year % 100) or (
            anio_n == (hoy.year % 100) and mes_n < hoy.month
        ):
            errores.append('La tarjeta está vencida.')
    except (TypeError, ValueError):
        errores.append('El vencimiento debe ser MM y AAAA válidos.')

    if not cvv or not cvv.isdigit() or len(cvv) not in (3, 4):
        errores.append('El CVV debe tener 3 o 4 dígitos.')

    # Lo único que se guarda del plástico: marca + últimos 4 dígitos.
    info = {
        'marca': detectar_marca(solo_digitos) if solo_digitos else '',
        'ultimos4': solo_digitos[-4:] if len(solo_digitos) >= 4 else '',
        'titular': titular.strip(),
    }
    return errores, info


def _verificar_luhn(numero):
    """Algoritmo de Luhn: el checksum matemático de las tarjetas reales.

    Funciona así: duplicamos los dígitos en posiciones pares (desde la
    derecha), sumamos todos los dígitos y el total debe ser múltiplo de 10.
    La tarjeta 4242 4242 4242 4242 pasa la prueba; 1234 no.
    """
    total = 0
    invertido = numero[::-1]
    for i, digito in enumerate(invertido):
        valor = int(digito)
        if i % 2 == 1:
            valor *= 2
            if valor > 9:
                valor -= 9
        total += valor
    return total % 10 == 0


def procesar_pago(datos_pago):
    """SIMULA a la pasarela de pago. Recibe los datos y devuelve
    (errores, pago_guardado).

    El pago guardado queda así:
      {
        'metodo': 'tarjeta' | 'transferencia' | 'retiro',
        'estado': 'pagado' (se pagó en línea) | 'pendiente' (paga al retirar),
        'tarjeta': {'marca', 'ultimos4', 'titular'}   (solo si es tarjeta)
      }
    """
    metodo = str(datos_pago.get('metodo', '')).strip()
    if metodo not in METODOS:
        return ['Método de pago inválido.'], None

    if metodo == 'tarjeta':
        errores, tarjeta = validar_tarjeta(
            str(datos_pago.get('numero', '')),
            str(datos_pago.get('titular', '')),
            str(datos_pago.get('mes', '')),
            str(datos_pago.get('anio', '')),
            str(datos_pago.get('cvv', '')),
        )
        if errores:
            return errores, None
        return [], {
            'metodo': 'tarjeta',
            'estado': 'pagado',   # la pasarela "aprobó" el pago
            'tarjeta': tarjeta,   # solo marca + últimos 4 + titular
            'procesado_en': datetime.now().isoformat(),
        }

    if metodo == 'transferencia':
        # En un sistema real aquí se esperaría la confirmación del banco.
        return [], {
            'metodo': 'transferencia',
            'estado': 'pagado',
            'procesado_en': datetime.now().isoformat(),
        }

    # retiro: el cliente paga cuando retira el pedido en la tienda.
    return [], {
        'metodo': 'retiro',
        'estado': 'pendiente',
    }


# ---------------------------------------------------------------------------
# STRIPE REAL (modo prueba)
# ---------------------------------------------------------------------------

def stripe_activo():
    """¿Tenemos llaves de Stripe configuradas en el .env?"""
    return bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_SECRET_KEY.startswith('sk_'))


def crear_checkout_stripe(pedido):
    """Crea una Checkout Session en Stripe y devuelve su URL.

    Es la forma PROFESIONAL de cobrar con tarjeta:
      1. El backend crea la sesión de pago con el monto calculado
         por NOSOTROS (el navegador no puede tocarlo).
      2. El cliente es redirigido a la página de pago de Stripe
         (checkout.stripe.com), que maneja TODA la seguridad de la
         tarjeta (cumplimiento PCI). Nosotros nunca vemos el número.
      3. Al terminar, Stripe nos devuelve al success_url, y el
         backend VERIFICA con Stripe que el pago exista y esté pagado
         (ver completar_pago_stripe).

    En Chile, CLP es moneda de cero decimales: el monto se manda
    como entero (sin multiplicar por 100, como se hace con el dólar).
    """
    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # La URL de retorno debe ser absoluta. En desarrollo usamos
    # localhost; en producción sería https://mibazar.cl.
    base = 'http://localhost:5173'
    linea_items = [
        {
            'price_data': {
                'currency': 'clp',
                'product_data': {'name': f'{i["producto"]} x{i["cantidad"]}'},
                'unit_amount': int(i['total']),   # CLP: cero decimales
            },
            'quantity': 1,
        }
        for i in pedido['items']
    ]

    sesion = stripe.checkout.Session.create(
        mode='payment',
        line_items=linea_items,
        success_url=f'{base}/pedido-exito?numero={pedido["numero"]}&session_id={{CHECKOUT_SESSION_ID}}',
        cancel_url=f'{base}/carrito?cancelado=1',
        # Le pasamos contexto a Stripe para poder mostrar el número
        # del pedido en su página de pago.
        metadata={'pedido': pedido['numero']},
    )
    return sesion.url, sesion.id, None


def completar_pago_stripe(session_id):
    """Verifica en Stripe si el pago de una sesión fue exitoso.

    Devuelve (pagado, info_tarjeta, error).

    Esta verificación es imprescindible: el cliente podría haber
    llegado a la página de éxito sin pagar (o haber cancelado).
    El ÚNICO que sabe la verdad es Stripe.
    """
    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        sesion = stripe.checkout.Session.retrieve(
            session_id,
            expand=['payment_intent'],
        )
    except stripe.error.StripeError as e:
        return False, None, f'No pudimos verificar el pago con Stripe: {e.user_message or e}'

    if sesion.payment_status != 'paid':
        return False, None, 'El pago aún no fue completado en Stripe.'

    # Stripe nos cuenta la tarjeta usada: marca y últimos 4 dígitos.
    # (Nunca el número completo: ni Stripe nos lo entregaría.)
    tarjeta = {'marca': 'Tarjeta', 'ultimos4': '', 'titular': ''}
    intent = sesion.get('payment_intent')
    if intent:
        metodo = intent.get('payment_method')
        try:
            if metodo and hasattr(metodo, 'card') and metodo.card:
                tarjeta = {
                    'marca': metodo.card.brand,
                    'ultimos4': metodo.card.last4,
                    'titular': '',
                }
        except Exception:
            pass

    return True, tarjeta, None
