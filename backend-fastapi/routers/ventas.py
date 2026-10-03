"""
routers/ventas.py — Ventas, control de día y reportes.
CONTRATO IDÉNTICO a la versión Django.
"""
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Body, Depends, HTTPException

from calculos import calcular_venta
from database import db
from seguridad import requiere_rol, sin_id, usuario_actual

ZONA = ZoneInfo("America/Santiago")

router = APIRouter()


def hoy():
    return datetime.now(ZONA).date().isoformat()


def estado_dia(fecha=None):
    fecha = fecha or hoy()
    dia = db().dia.find_one({"fecha": fecha})
    return dia["estado"] if dia else "cerrado"


def siguiente_folio(tipo):
    LETRA = {"boleta": "B", "factura": "F", "pedido": "P"}
    doc = db().folios.find_one_and_update(
        {"tipo": tipo}, {"$inc": {"secuencia": 1}}, upsert=True, return_document=True
    )
    return f"{LETRA[tipo]}-{doc['secuencia']:04d}"


# ---------------------------------------------------------------------------
# Control de día
# ---------------------------------------------------------------------------
@router.get("/dia")
def consultar_dia(user: dict = Depends(usuario_actual)):
    return {"fecha": hoy(), "estado": estado_dia(), "rol": user["rol"]}


@router.post("/dia/abrir")
def abrir_dia(user: dict = Depends(requiere_rol("jefe"))):
    fecha = hoy()
    db().dia.update_one(
        {"fecha": fecha},
        {"$set": {"estado": "abierto", "abierto_por": user.get("usuario") or user.get("email")}},
        upsert=True,
    )
    return {"fecha": fecha, "estado": "abierto"}


@router.post("/dia/cerrar")
def cerrar_dia(user: dict = Depends(requiere_rol("jefe"))):
    fecha = hoy()
    db().dia.update_one(
        {"fecha": fecha},
        {"$set": {"estado": "cerrado", "cerrado_por": user.get("usuario") or user.get("email")}},
        upsert=True,
    )
    return {"fecha": fecha, "estado": "cerrado"}


# ---------------------------------------------------------------------------
# Registro de ventas
# ---------------------------------------------------------------------------
@router.post("/vista-previa")
def vista_previa(payload: dict = Body(...), user: dict = Depends(requiere_rol("vendedor"))):
    if estado_dia() != "abierto":
        raise HTTPException(status_code=403,
                            detail="El día está cerrado. Solo el Jefe de Ventas puede abrirlo.")
    datos = payload
    cantidad = int(datos.get("cantidad", 0) or 0)
    precio = float(datos.get("precio_unitario", 0) or 0)
    calculos = calcular_venta(cantidad, precio)

    cliente = None
    if datos.get("tipo_documento") == "factura":
        cliente = {
            "rut": datos.get("rut", ""),
            "razon_social": datos.get("razon_social", ""),
            "giro": datos.get("giro", ""),
            "direccion": datos.get("direccion", ""),
        }

    return {"vista_previa": {
        "tipo_documento": datos.get("tipo_documento"),
        "codigo_producto": datos.get("codigo", ""),
        "producto": datos.get("producto", ""),
        "cantidad": cantidad,
        "precio_unitario": precio,
        **calculos,
        "cliente": cliente,
        "vendedor": user.get("nombre_completo") or user.get("nombre"),
        "fecha": hoy(),
    }}


@router.post("/")
def crear_venta(payload: dict = Body(...), user: dict = Depends(requiere_rol("vendedor"))):
    if estado_dia() != "abierto":
        raise HTTPException(status_code=403,
                            detail="El día está cerrado. Solo el Jefe de Ventas puede abrirlo.")

    datos = payload
    codigo = str(datos.get("codigo", "")).strip()
    producto = str(datos.get("producto", "")).strip()
    tipo_doc = str(datos.get("tipo_documento", "")).strip()

    errores = []
    if not codigo:
        errores.append("El código del producto es obligatorio.")
    if not producto:
        errores.append("El nombre del producto es obligatorio.")
    try:
        cantidad = int(datos.get("cantidad"))
        if cantidad <= 0:
            raise ValueError
    except (TypeError, ValueError):
        errores.append("La cantidad debe ser un número entero mayor que 0.")
    try:
        precio = float(datos.get("precio_unitario"))
        if precio <= 0:
            raise ValueError
    except (TypeError, ValueError):
        errores.append("El precio unitario debe ser un número mayor que 0.")
    if tipo_doc not in ("boleta", "factura"):
        errores.append("El tipo de documento debe ser 'boleta' o 'factura'.")

    cliente = None
    if tipo_doc == "factura":
        faltantes = [c for c in ("rut", "razon_social", "giro", "direccion")
                     if not str(datos.get(c, "")).strip()]
        if faltantes:
            errores.append("Para una FACTURA debes completar: " + ", ".join(faltantes) + ".")
        else:
            cliente = {
                "rut": datos["rut"].strip(),
                "razon_social": datos["razon_social"].strip(),
                "giro": datos["giro"].strip(),
                "direccion": datos["direccion"].strip(),
            }

    if errores:
        raise HTTPException(status_code=400, detail={"errores": errores})

    calculos = calcular_venta(cantidad, precio)
    ahora = datetime.now(ZONA)
    venta = {
        "folio": siguiente_folio(tipo_doc),
        "fecha": hoy(),
        "hora": ahora.strftime("%H:%M:%S"),
        "tipo_documento": tipo_doc,
        "codigo_producto": codigo,
        "producto": producto,
        "cantidad": cantidad,
        "precio_unitario": precio,
        "neto": calculos["neto"],
        "iva": calculos["iva"],
        "total": calculos["total"],
        "cliente": cliente,
        "vendedor": {
            "usuario": user.get("usuario") or user.get("email"),
            "nombre": user.get("nombre_completo") or user.get("nombre"),
        },
        "creado_en": ahora.isoformat(),
    }
    db().ventas.insert_one(venta)
    return {"ok": True, "venta": sin_id(venta)}


# ---------------------------------------------------------------------------
# Reporte diario
# ---------------------------------------------------------------------------
def _resumen_ventas(ventas):
    boletas = [v for v in ventas if v["tipo_documento"] == "boleta"]
    facturas = [v for v in ventas if v["tipo_documento"] == "factura"]

    def sumar(lista, campo):
        return round(sum(v[campo] for v in lista), 2)

    return {
        "total_ventas": len(ventas),
        "total_boletas": len(boletas),
        "total_facturas": len(facturas),
        "monto_boletas": sumar(boletas, "total"),
        "monto_facturas": sumar(facturas, "total"),
        "total_neto": sumar(ventas, "neto"),
        "total_iva": sumar(ventas, "iva"),
        "total_recaudado": sumar(ventas, "total"),
    }


def _desglose_por_vendedor(ventas):
    por_vendedor = {}
    for v in ventas:
        usuario = v["vendedor"]["usuario"]
        if usuario not in por_vendedor:
            por_vendedor[usuario] = {
                "vendedor": usuario,
                "nombre": v["vendedor"]["nombre"],
                "cantidad_ventas": 0,
                "monto_neto": 0.0,
                "monto_iva": 0.0,
                "monto_total": 0.0,
            }
        item = por_vendedor[usuario]
        item["cantidad_ventas"] += 1
        item["monto_neto"] += v["neto"]
        item["monto_iva"] += v["iva"]
        item["monto_total"] += v["total"]
    for item in por_vendedor.values():
        item["monto_neto"] = round(item["monto_neto"], 2)
        item["monto_iva"] = round(item["monto_iva"], 2)
        item["monto_total"] = round(item["monto_total"], 2)
    return sorted(por_vendedor.values(), key=lambda x: x["monto_total"], reverse=True)


@router.get("/reporte/diario")
def reporte_diario(fecha: str = None, user: dict = Depends(requiere_rol("jefe"))):
    if fecha is None:
        fecha = hoy()
    else:
        try:
            datetime.strptime(fecha, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400,
                                detail="Fecha inválida. Usa el formato AAAA-MM-DD (ej: 2026-08-17).")

    ventas = list(db().ventas.find({"fecha": fecha}))
    if not ventas:
        return {
            "fecha": fecha,
            "mensaje": "No hay ventas registradas para este día.",
            "resumen": {"total_ventas": 0, "total_boletas": 0, "total_facturas": 0,
                        "monto_boletas": 0, "monto_facturas": 0,
                        "total_neto": 0, "total_iva": 0, "total_recaudado": 0},
            "por_vendedor": [],
        }
    return {
        "fecha": fecha,
        "resumen": _resumen_ventas(ventas),
        "por_vendedor": _desglose_por_vendedor(ventas),
    }
