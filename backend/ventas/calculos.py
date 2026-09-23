"""
calculos.py — Reglas de negocio para los cálculos de una venta.

¿Cómo se calcula el total de una venta en Chile (IVA 19%)?

  neto  = cantidad x precio_unitario     -> el valor de la mercancía sin impuesto
  iva   = neto x 0,19                    -> el 19% de impuesto al valor agregado
  total = neto + iva                     -> lo que el cliente paga

Ejemplo: 3 neumáticos a $25.000
  neto  = 3 x 25.000 = 75.000
  iva   = 75.000 x 0,19 = 14.250
  total = 75.000 + 14.250 = 89.250

Esta es una de las lecciones más importantes: los cálculos que
implican dinero SIEMPRE se hacen y se validan en el BACKEND.
El frontend puede mostrar un adelanto, pero el valor oficial es
el que calcula el servidor. Un usuario malintencionado podría
editar el JavaScript de su navegador y mandar el total que quiera;
el backend debe recalcularlo todo por su cuenta.

LEER: docs/02-backend.md (sección "Cálculo del IVA")
"""

from decimal import Decimal, ROUND_HALF_UP

# Tasa de IVA: 19% = 0,19
TASA_IVA = Decimal('0.19')

# El enunciado pide precios y cantidades; usamos Decimal (no float)
# porque float tiene errores de redondeo con dinero (0.1 + 0.2 != 0.3).
# Decimal hace matemática exacta. ROUND_HALF_UP redondea al centavo más cercano.


def calcular_venta(cantidad, precio_unitario):
    """Calcula neto, IVA y total a partir de cantidad y precio unitario.

    Devuelve un diccionario con los tres valores, cada uno ya
    redondeado a 2 decimales (centavos).
    """
    cantidad_d = Decimal(str(cantidad))
    precio_d = Decimal(str(precio_unitario))

    neto = cantidad_d * precio_d
    iva = (neto * TASA_IVA).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total = (neto + iva).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    return {
        'neto': float(neto.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        'iva': float(iva),
        'total': float(total),
    }
