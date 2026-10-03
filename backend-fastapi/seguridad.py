"""
seguridad.py — Autenticación del backend FastAPI.

CRÍTICO: los hashes de contraseña son COMPATIBLES con el formato de Django
("pbkdf2_sha256$iteraciones$salt$hash"). Así, los usuarios que ya existen
en MongoDB (creados por la versión Django) siguen funcionando sin migrar
nada — el contrato de datos tampoco cambió.
"""
import base64
import hashlib
import secrets
import uuid

from fastapi import Depends, Header, HTTPException

from database import db

# ---------------------------------------------------------------------------
# Contraseñas (hash compatible con Django: pbkdf2_sha256)
# ---------------------------------------------------------------------------
ITERACIONES = 600000


def make_password(password):
    salt = secrets.token_hex(12)
    digesto = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), ITERACIONES, dklen=32
    )
    return f"pbkdf2_sha256${ITERACIONES}${salt}${base64.b64encode(digesto).decode()}"


def check_password(password, codificado):
    try:
        _, iteraciones, salt, esperado = codificado.split("$", 3)
        digesto = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), salt.encode(), int(iteraciones), dklen=32
        )
        return secrets.compare_digest(base64.b64encode(digesto).decode(), esperado)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Tokens de sesión
# ---------------------------------------------------------------------------
def generar_token(user):
    token = str(uuid.uuid4())
    db().tokens.insert_one({
        "token": token,
        "usuario_id": user["_id"],
        "coleccion": user.get("coleccion", "usuarios"),
        "rol": user["rol"],
    })
    return token


def revocar_token(token):
    db().tokens.delete_one({"token": token})


def usuario_por_token(token):
    sesion = db().tokens.find_one({"token": token})
    if sesion is None:
        return None
    user = db()[sesion["coleccion"]].find_one({"_id": sesion["usuario_id"]})
    if user is not None:
        user["coleccion"] = sesion["coleccion"]
    return user


def verificar_credenciales(identificador, password):
    """Busca en usuarios (por nombre) y luego en clientes (por email)."""
    user = db().usuarios.find_one({"usuario": identificador})
    coleccion = "usuarios"
    if user is None:
        user = db().clientes.find_one({"email": identificador})
        coleccion = "clientes"
    if user is None or not check_password(password, user["password_hash"]):
        return None
    user["coleccion"] = coleccion
    return user


def datos_publicos(user):
    es_cliente = user["rol"] == "cliente"
    return {
        "identificador": user.get("usuario") or user.get("email"),
        "rol": user["rol"],
        "nombre": user.get("nombre_completo") or user.get("nombre"),
        "es_cliente": es_cliente,
    }


# ---------------------------------------------------------------------------
# Dependencias de FastAPI (reemplazan al decorador @requiere_rol de Django)
# ---------------------------------------------------------------------------
def usuario_actual(authorization: str = Header(default="")) -> dict:
    """Lee la cabecera 'Authorization: Token xxxx' y devuelve el usuario
    autenticado, o lanza 401."""
    if not authorization.startswith("Token "):
        raise HTTPException(status_code=401, detail="No has iniciado sesión o tu sesión expiró.")
    user = usuario_por_token(authorization[len("Token "):])
    if user is None:
        raise HTTPException(status_code=401, detail="No has iniciado sesión o tu sesión expiró.")
    return user


def requiere_rol(*roles):
    """Fábrica de dependencias: solo los roles indicados pueden entrar."""

    def dependencia(user: dict = Depends(usuario_actual)):
        if user["rol"] not in roles:
            raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción.")
        return user

    return dependencia


def sin_id(documento):
    documento = dict(documento)
    documento.pop("_id", None)
    return documento
