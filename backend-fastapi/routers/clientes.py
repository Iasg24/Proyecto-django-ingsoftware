"""
routers/clientes.py — Registro de clientes y búsqueda por RUT.
CONTRATO IDÉNTICO a la versión Django.
"""
import re
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Body, Depends, HTTPException

from database import db
from seguridad import generar_token, make_password, requiere_rol, sin_id

ZONA = ZoneInfo("America/Santiago")
router = APIRouter()

CAMPOS_CLIENTE = ["nombre", "rut", "email", "telefono", "direccion", "giro"]


@router.post("/registro")
def registrarse(payload: dict = Body(...)):
    nombre = str(payload.get("nombre", "")).strip()
    rut = str(payload.get("rut", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    telefono = str(payload.get("telefono", "")).strip()
    direccion = str(payload.get("direccion", "")).strip()
    password = payload.get("password", "")

    errores = []
    if not nombre:
        errores.append("El nombre es obligatorio.")
    if not rut:
        errores.append("El RUT es obligatorio.")
    elif db().clientes.find_one({"rut": rut}):
        errores.append(f"Ya existe un cliente con el RUT {rut}.")
    if not email:
        errores.append("El email es obligatorio.")
    elif not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        errores.append("El email no es válido.")
    elif db().clientes.find_one({"email": email}):
        errores.append("Ya existe una cuenta con ese email.")
    if len(password) < 6:
        errores.append("La contraseña debe tener al menos 6 caracteres.")
    if errores:
        raise HTTPException(status_code=400, detail={"errores": errores})

    cliente = {
        "nombre": nombre,
        "rut": rut,
        "email": email,
        "telefono": telefono,
        "direccion": direccion,
        "giro": str(payload.get("giro", "")).strip(),
        "password_hash": make_password(password),
        "rol": "cliente",
        "creado_en": datetime.now(ZONA).isoformat(),
    }
    db().clientes.insert_one(cliente)
    cliente["coleccion"] = "clientes"
    token = generar_token(cliente)

    return {
        "ok": True,
        "mensaje": "¡Cuenta creada! Bienvenido al bazar.",
        "token": token,
        "rol": "cliente",
        "rol_nombre": "Cliente",
        "nombre": cliente["nombre"],
    }


@router.get("/buscar")
def buscar_cliente(rut: str = "", user: dict = Depends(requiere_rol("vendedor", "jefe"))):
    rut = rut.strip()
    if not rut:
        raise HTTPException(status_code=400, detail="Debes indicar el RUT a buscar (?rut=...)")
    cliente = db().clientes.find_one({"rut": rut})
    if cliente is None:
        return {"encontrado": False, "mensaje": "Cliente no registrado."}
    return {"encontrado": True, "cliente": sin_id(cliente)}


@router.get("/me")
def mis_datos(user: dict = Depends(requiere_rol("cliente"))):
    return {"cliente": sin_id(user)}


@router.put("/me")
def actualizar_mis_datos(payload: dict = Body(...), user: dict = Depends(requiere_rol("cliente"))):
    cambios = {}
    for campo in CAMPOS_CLIENTE:
        valor = str(payload.get(campo, "")).strip()
        if valor:
            cambios[campo] = valor
    nueva_password = payload.get("password", "")
    if nueva_password:
        if len(nueva_password) < 6:
            raise HTTPException(status_code=400,
                                detail={"errores": ["La contraseña debe tener al menos 6 caracteres."]})
        cambios["password_hash"] = make_password(nueva_password)
    if not cambios:
        raise HTTPException(status_code=400, detail="No enviaste ningún dato para actualizar.")
    db().clientes.update_one({"_id": user["_id"]}, {"$set": cambios})
    cliente = db().clientes.find_one({"_id": user["_id"]})
    return {"ok": True, "cliente": sin_id(cliente)}
