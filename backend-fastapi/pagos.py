"""
pagos.py — Pasarela de pago (simulación + Stripe modo prueba).
Adaptada de la versión Django: misma lógica, sin dependencias de Django.
"""
import os
import re
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")

MARCAS = {"4": "Visa", "5": "Mastercard", "3": "American Express", "6": "Discover"}
METODOS = ("tarjeta", "transferencia", "retiro")


def stripe_activo():
    return bool(STRIPE_SECRET_KEY and STRIPE_SECRET_KEY.startswith("sk_"))


def detectar_marca(numero):
    return MARCAS.get(numero[0], "Otra") if numero else ""


def _verificar_luhn(numero):
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


def validar_tarjeta(numero, titular, mes, anio, cvv):
    errores = []
    solo_digitos = re.sub(r"[\s-]", "", numero)
    if not solo_digitos or not solo_digitos.isdigit():
        errores.append("El número de tarjeta debe contener solo dígitos.")
    elif not (13 <= len(solo_digitos) <= 19):
        errores.append("El número de tarjeta debe tener entre 13 y 19 dígitos.")
    elif not _verificar_luhn(solo_digitos):
        errores.append("El número de tarjeta no es válido (falló la verificación de Luhn).")
    if not titular or len(titular.strip()) < 3:
        errores.append("El titular de la tarjeta es obligatorio.")
    try:
        mes_n, anio_n = int(mes), int(anio)
        if not 1 <= mes_n <= 12:
            raise ValueError
        hoy = datetime.now()
        if anio_n < (hoy.year % 100) or (anio_n == hoy.year % 100 and mes_n < hoy.month):
            errores.append("La tarjeta está vencida.")
    except (TypeError, ValueError):
        errores.append("El vencimiento debe ser MM y AAAA válidos.")
    if not cvv or not cvv.isdigit() or len(cvv) not in (3, 4):
        errores.append("El CVV debe tener 3 o 4 dígitos.")

    info = {
        "marca": detectar_marca(solo_digitos),
        "ultimos4": solo_digitos[-4:] if len(solo_digitos) >= 4 else "",
        "titular": titular.strip(),
    }
    return errores, info


def procesar_pago(datos_pago):
    metodo = str(datos_pago.get("metodo", "")).strip()
    if metodo not in METODOS:
        return ["Método de pago inválido."], None

    if metodo == "tarjeta":
        errores, tarjeta = validar_tarjeta(
            str(datos_pago.get("numero", "")),
            str(datos_pago.get("titular", "")),
            str(datos_pago.get("mes", "")),
            str(datos_pago.get("anio", "")),
            str(datos_pago.get("cvv", "")),
        )
        if errores:
            return errores, None
        return [], {"metodo": "tarjeta", "estado": "pagado", "tarjeta": tarjeta,
                    "procesado_en": datetime.now().isoformat()}

    if metodo == "transferencia":
        return [], {"metodo": "transferencia", "estado": "pagado",
                    "procesado_en": datetime.now().isoformat()}

    return [], {"metodo": "retiro", "estado": "pendiente"}


def crear_checkout_stripe(pedido):
    import stripe

    stripe.api_key = STRIPE_SECRET_KEY
    base = "http://localhost:5173"
    linea_items = [
        {
            "price_data": {
                "currency": "clp",
                "product_data": {"name": f"{i['producto']} x{i['cantidad']}"},
                "unit_amount": int(i["total"]),
            },
            "quantity": 1,
        }
        for i in pedido["items"]
    ]
    sesion = stripe.checkout.Session.create(
        mode="payment",
        line_items=linea_items,
        success_url=f"{base}/pedido-exito?numero={pedido['numero']}&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base}/carrito?cancelado=1",
        metadata={"pedido": pedido["numero"]},
    )
    return sesion.url, sesion.id, None


def completar_pago_stripe(session_id):
    import stripe

    stripe.api_key = STRIPE_SECRET_KEY
    try:
        sesion = stripe.checkout.Session.retrieve(session_id, expand=["payment_intent"])
    except stripe.error.StripeError as e:
        return False, None, f"No pudimos verificar el pago con Stripe: {e.user_message or e}"

    if sesion.payment_status != "paid":
        return False, None, "El pago aún no fue completado en Stripe."

    tarjeta = {"marca": "Tarjeta", "ultimos4": "", "titular": ""}
    intent = sesion.get("payment_intent")
    if intent:
        metodo = intent.get("payment_method")
        try:
            if metodo and getattr(metodo, "card", None):
                tarjeta = {"marca": metodo.card.brand, "ultimos4": metodo.card.last4, "titular": ""}
        except Exception:
            pass
    return True, tarjeta, None
