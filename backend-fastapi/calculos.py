"""
calculos.py — Regla de negocio del IVA 19% (copiada sin cambios de la
versión Django: la lógica de negocio no depende del framework).
"""
from decimal import Decimal, ROUND_HALF_UP

TASA_IVA = Decimal("0.19")


def calcular_venta(cantidad, precio_unitario):
    cantidad_d = Decimal(str(cantidad))
    precio_d = Decimal(str(precio_unitario))

    neto = cantidad_d * precio_d
    iva = (neto * TASA_IVA).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total = (neto + iva).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "neto": float(neto.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "iva": float(iva),
        "total": float(total),
    }
