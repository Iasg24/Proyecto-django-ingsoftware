"""
routers/auth.py — Login, logout y "quién soy".
CONTRATO IDÉNTICO a la versión Django (el frontend no cambia).
"""
from fastapi import APIRouter, Body, Depends, Header, HTTPException

from database import db
from seguridad import (
    datos_publicos,
    generar_token,
    revocar_token,
    usuario_actual,
    verificar_credenciales,
)

ROLES_NOMBRE = {"vendedor": "Vendedor", "jefe": "Jefe de Ventas", "cliente": "Cliente"}

router = APIRouter()


@router.post("/login")
def login(payload: dict = Body(...)):
    usuario = str(payload.get("usuario", "")).strip()
    password = payload.get("password", "")

    if not usuario or not password:
        raise HTTPException(status_code=400, detail="Debes ingresar usuario y contraseña.")

    user = verificar_credenciales(usuario, password)
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")

    token = generar_token(user)
    publicos = datos_publicos(user)
    return {
        "token": token,
        "rol": publicos["rol"],
        "rol_nombre": ROLES_NOMBRE[publicos["rol"]],
        "nombre": publicos["nombre"],
    }


@router.post("/logout")
def logout(authorization: str = Header(default="")):
    token = authorization[len("Token "):] if authorization.startswith("Token ") else ""
    if token:
        revocar_token(token)
    return {"ok": True}


@router.get("/me")
def me(user: dict = Depends(usuario_actual)):
    publicos = datos_publicos(user)
    return {
        "usuario": publicos["identificador"],
        "rol": publicos["rol"],
        "rol_nombre": ROLES_NOMBRE[publicos["rol"]],
        "nombre": publicos["nombre"],
    }
