"""
routers/pedidos.py — Pedidos online con pagos (simulación + Stripe modo prueba).
CONTRATO IDÉNTICO a la versión Django.
"""
import os
import re
from datetime import datetime
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from fastapi import APIRouter, Body, Depends, HTTPException

from calculos import calcular_venta
from database import db
from pagos import completar_pago_stripe, crear_checkout_stripe, procesar_pago, stripe_activo
from seguridad import requiere_rol, sin_id
from routers.ventas import hoy, siguiente_folio

load_dotenv()
ZONA = ZoneInfo("America/Santiago")
router = APIRouter()

ROLES_TIENDA = ("vendedor", "jefe")


@router.get("/")
def listar_pedidos(estado: str = None, user: dict = Depends(requiere_rol(*ROLES_TIENDA))):
    filtro = {"estado": estado} if estado else {}
    pedidos = [sin_id(p) for p in db().pedidos.find(filtro).sort("creado_en", -1)]
    return {"pedidos": pedidos}


@router.post("/")
def crear_pedido(payload: dict = Body(...)):
    items_crudos = payload.get("items")
    cliente, errores = _validar_cliente(payload.get("cliente", {}))

    if not isinstance(items_crudos, list) or not items_crudos:
        errores.append("El carro está vacío.")
    if errores:
        raise HTTPException(status_code=400, detail={"errores": errores})

    items = []
    for linea in items_crudos:
        codigo = str(linea.get("codigo", "")).strip()
        try:
            cantidad = int(linea.get("cantidad", 0))
            if cantidad <= 0:
                raise ValueError
        except (TypeError, ValueError):
            errores.append(f"Cantidad inválida para el producto {codigo}.")
            continue
        producto = db().productos.find_one({"codigo": codigo})
        if producto is None:
            errores.append(f"El producto {codigo} no existe en el catálogo.")
            continue
        calculos = calcular_venta(cantidad, producto["precio"])
        if producto["stock"] < cantidad:
            errores.append(
                f"Stock insuficiente para {producto['nombre']} "
                f"(hay {producto['stock']}, pides {cantidad}).")
        items.append({
            "codigo": producto["codigo"],
            "producto": producto["nombre"],
            "cantidad": cantidad,
            "precio_unitario": producto["precio"],
            **calculos,
        })

    if errores:
        raise HTTPException(status_code=400, detail={"errores": errores})

    totales = {
        "neto": round(sum(i["neto"] for i in items), 2),
        "iva": round(sum(i["iva"] for i in items), 2),
        "total": round(sum(i["total"] for i in items), 2),
    }

    datos_pago = payload.get("pago", {}) or {}
    metodo = str(datos_pago.get("metodo", "")).strip()
    usar_stripe = metodo == "tarjeta" and stripe_activo()

    if usar_stripe:
        pago = {"metodo": "tarjeta", "estado": "procesando"}
    else:
        errores_pago, pago = procesar_pago(datos_pago)
        if errores_pago:
            raise HTTPException(status_code=400, detail={"errores": errores_pago})

    ahora = datetime.now(ZONA)
    pedido = {
        "numero": siguiente_folio("pedido"),
        "estado": "pendiente",
        "items": items,
        "cliente": cliente,
        "totales": totales,
        "pago": pago,
        "fecha": hoy(),
        "creado_en": ahora.isoformat(),
        "ventas_folios": [],
    }

    if usar_stripe:
        try:
            url_stripe, session_id, error_stripe = crear_checkout_stripe(pedido)
        except Exception as e:
            raise HTTPException(status_code=502,
                                detail=f"No se pudo iniciar el pago con Stripe: {e}")
        pedido["pago"]["stripe_session_id"] = session_id
        db().pedidos.insert_one(pedido)
        return {"ok": True, "stripe_url": url_stripe, "pedido": sin_id(pedido)}

    db().pedidos.insert_one(pedido)
    return {
        "ok": True,
        "mensaje": f"Pedido {pedido['numero']} recibido. La tienda lo confirmará.",
        "pedido": sin_id(pedido),
    }


@router.post("/{numero}/confirmar")
def confirmar_pedido(numero: str, user: dict = Depends(requiere_rol(*ROLES_TIENDA))):
    pedido = db().pedidos.find_one({"numero": numero})
    if pedido is None:
        raise HTTPException(status_code=404, detail=f"No existe el pedido {numero}.")
    if pedido["estado"] != "pendiente":
        raise HTTPException(status_code=400,
                            detail=f"El pedido {numero} ya fue procesado (estado: {pedido['estado']}).")

    for linea in pedido["items"]:
        producto = db().productos.find_one({"codigo": linea["codigo"]})
        if producto is None or producto["stock"] < linea["cantidad"]:
            disponible = producto["stock"] if producto else 0
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente de {linea['producto']} (hay {disponible}). "
                       f"El pedido sigue pendiente.")

    ahora = datetime.now(ZONA)
    folios = []
    for linea in pedido["items"]:
        db().productos.update_one(
            {"codigo": linea["codigo"]}, {"$inc": {"stock": -linea["cantidad"]}})
        venta = {
            "folio": siguiente_folio("boleta"),
            "fecha": hoy(),
            "hora": ahora.strftime("%H:%M:%S"),
            "tipo_documento": "boleta",
            "codigo_producto": linea["codigo"],
            "producto": linea["producto"],
            "cantidad": linea["cantidad"],
            "precio_unitario": linea["precio_unitario"],
            "neto": linea["neto"],
            "iva": linea["iva"],
            "total": linea["total"],
            "cliente": None,
            "vendedor": {
                "usuario": user.get("usuario") or user.get("email"),
                "nombre": user.get("nombre_completo") or user.get("nombre"),
            },
            "origen": "pedido_online",
            "pedido_numero": numero,
            "creado_en": ahora.isoformat(),
        }
        db().ventas.insert_one(venta)
        folios.append(venta["folio"])

    db().pedidos.update_one(
        {"numero": numero},
        {"$set": {
            "estado": "confirmado",
            "confirmado_por": user.get("usuario") or user.get("email"),
            "confirmado_en": ahora.isoformat(),
            "ventas_folios": folios,
        }},
    )
    return {"ok": True, "mensaje": f"Pedido {numero} confirmado: {len(folios)} ventas creadas.",
            "ventas_folios": folios}


@router.post("/{numero}/rechazar")
def rechazar_pedido(numero: str, user: dict = Depends(requiere_rol(*ROLES_TIENDA))):
    pedido = db().pedidos.find_one({"numero": numero})
    if pedido is None:
        raise HTTPException(status_code=404, detail=f"No existe el pedido {numero}.")
    if pedido["estado"] != "pendiente":
        raise HTTPException(status_code=400,
                            detail=f"El pedido {numero} ya fue procesado (estado: {pedido['estado']}).")
    ahora = datetime.now(ZONA)
    db().pedidos.update_one(
        {"numero": numero},
        {"$set": {
            "estado": "rechazado",
            "rechazado_por": user.get("usuario") or user.get("email"),
            "rechazado_en": ahora.isoformat(),
        }},
    )
    return {"ok": True, "mensaje": f"Pedido {numero} rechazado."}


@router.post("/{numero}/completar-pago")
def completar_pago(numero: str, payload: dict = Body(...)):
    pedido = db().pedidos.find_one({"numero": numero})
    if pedido is None:
        raise HTTPException(status_code=404, detail=f"No existe el pedido {numero}.")
    pago = pedido.get("pago", {})
    if pago.get("estado") == "pagado":
        return {"ok": True, "pedido": sin_id(pedido)}

    session_id = str(payload.get("session_id", "")).strip()
    if pago.get("estado") != "procesando" or pago.get("stripe_session_id") != session_id:
        raise HTTPException(status_code=400,
                            detail="Este pedido no tiene un pago pendiente de verificación.")

    pagado, tarjeta, error_stripe = completar_pago_stripe(session_id)
    if error_stripe:
        raise HTTPException(status_code=502, detail=error_stripe)
    if not pagado:
        raise HTTPException(status_code=402, detail="El pago no fue completado en Stripe. Vuelve a intentarlo.")

    db().pedidos.update_one(
        {"numero": numero},
        {"$set": {"pago": {
            **pago,
            "estado": "pagado",
            "tarjeta": tarjeta,
            "procesado_en": datetime.now(ZONA).isoformat(),
        }}},
    )
    pedido_actualizado = db().pedidos.find_one({"numero": numero})
    return {"ok": True, "pedido": sin_id(pedido_actualizado)}


def _validar_cliente(datos):
    errores = []
    nombre = str(datos.get("nombre", "")).strip()
    email = str(datos.get("email", "")).strip().lower()
    rut = str(datos.get("rut", "")).strip()
    direccion = str(datos.get("direccion", "")).strip()

    if not nombre:
        errores.append("El nombre es obligatorio.")
    if not email or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        errores.append("El email no es válido.")
    if not rut:
        errores.append("El RUT es obligatorio.")
    if not direccion:
        errores.append("La dirección es obligatoria.")
    return {"nombre": nombre, "email": email, "rut": rut, "direccion": direccion}, errores
