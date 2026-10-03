"""
cambiar_contrasenas.py — Cambia las contraseñas de los usuarios internos
y del cliente de prueba ANTES de desplegar a internet.

Uso (desde la raíz del proyecto):
  backend-fastapi/venv/bin/python backend-fastapi/scripts/cambiar_contrasenas.py \
      "nueva-pass-vendedor" "nueva-pass-jefe" "nueva-pass-cliente"

Las contraseñas se guardan con hash (pbkdf2_sha256); nunca se vuelven a
mostrar. Guárdalas en un lugar seguro (no en el repositorio).
"""
import sys
import os

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from seguridad import make_password
from database import db


def main():
    if len(sys.argv) < 4:
        print("Uso: cambiar_contrasenas.py <pass-vendedor> <pass-jefe> <pass-cliente>")
        sys.exit(1)

    p_vendedor, p_jefe, p_cliente = sys.argv[1], sys.argv[2], sys.argv[3]

    cambios = [
        (db().usuarios, {"usuario": "vendedor"}, p_vendedor),
        (db().usuarios, {"usuario": "jefe"}, p_jefe),
        (db().clientes, {"email": "maria@mail.com"}, p_cliente),
    ]

    for coleccion, filtro, password in cambios:
        if len(password) < 10:
            print("ERROR: las contraseñas deben tener al menos 10 caracteres.")
            sys.exit(1)
        resultado = coleccion.update_one(filtro, {"$set": {"password_hash": make_password(password)}})
        if resultado.matched_count == 0:
            print(f"ADVERTENCIA: no se encontró el usuario {filtro}")
        else:
            print(f"✓ Contraseña actualizada para {filtro}")

    print("\nContraseñas cambiadas con éxito. Guárdalas en un lugar seguro.")


if __name__ == "__main__":
    main()
