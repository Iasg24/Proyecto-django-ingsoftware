"""
routers/productos.py — Catálogo de productos.
CONTRATO IDÉNTICO a la versión Django (GET público, resto vendedor/jefe).
"""
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Body, Depends, HTTPException

from database import db
from seguridad import requiere_rol, sin_id

ZONA = ZoneInfo("America/Santiago")
router = APIRouter()

ROLES_ADMIN = ("vendedor", "jefe")


def _validar(datos, actualizar=False):
    errores = []
    campos = {}
    codigo = str(datos.get("codigo", "")).strip()
    nombre = str(datos.get("nombre", "")).strip()
    categoria = str(datos.get("categoria", "")).strip() or "General"

    if not actualizar:
        if not codigo:
            errores.append("El código es obligatorio.")
        elif db().productos.find_one({"codigo": codigo}):
            errores.append(f"Ya existe un producto con el código {codigo}.")
        if not nombre:
            errores.append("El nombre es obligatorio.")

    try:
        precio = float(datos.get("precio", 0))
        if precio <= 0:
            raise ValueError
    except (TypeError, ValueError):
        errores.append("El precio debe ser un número mayor que 0.")
    try:
        stock = int(datos.get("stock", 0))
        if stock < 0:
            raise ValueError
    except (TypeError, ValueError):
        errores.append("El stock debe ser un número entero mayor o igual que 0.")

    campos.update({
        "codigo": codigo,
        "nombre": nombre,
        "categoria": categoria,
        "precio": precio,
        "stock": stock,
        "descripcion": str(datos.get("descripcion", "")).strip(),
        "imagen": str(datos.get("imagen", "")).strip(),
    })
    return campos, errores


@router.get("/")
def listar_productos():
    productos = [sin_id(p) for p in db().productos.find().sort("codigo", 1)]
    return {"productos": productos}


@router.post("/")
def crear_producto(payload: dict = Body(...), user: dict = Depends(requiere_rol(*ROLES_ADMIN))):
    campos, errores = _validar(payload)
    if errores:
        raise HTTPException(status_code=400, detail={"errores": errores})
    campos["creado_por"] = user.get("usuario") or user.get("email")
    campos["creado_en"] = datetime.now(ZONA).isoformat()
    db().productos.insert_one(campos)
    return {"ok": True, "producto": sin_id(campos)}


@router.put("/{codigo}/")
def editar_producto(codigo: str, payload: dict = Body(...),
                    user: dict = Depends(requiere_rol(*ROLES_ADMIN))):
    existente = db().productos.find_one({"codigo": codigo})
    if existente is None:
        raise HTTPException(status_code=404, detail=f"No existe un producto con código {codigo}.")
    campos, errores = _validar(payload, actualizar=True)
    if errores:
        raise HTTPException(status_code=400, detail={"errores": errores})
    campos = {k: v for k, v in campos.items() if v != ""}
    campos.pop("codigo", None)
    campos["modificado_por"] = user.get("usuario") or user.get("email")
    campos["modificado_en"] = datetime.now(ZONA).isoformat()
    db().productos.update_one({"codigo": codigo}, {"$set": campos})
    campos["codigo"] = codigo
    return {"ok": True, "producto": campos}


@router.delete("/{codigo}/")
def eliminar_producto(codigo: str, user: dict = Depends(requiere_rol(*ROLES_ADMIN))):
    resultado = db().productos.delete_one({"codigo": codigo})
    if resultado.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"No existe un producto con código {codigo}.")
    return {"ok": True, "eliminado": codigo}
