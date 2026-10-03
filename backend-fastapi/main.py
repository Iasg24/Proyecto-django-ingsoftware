"""
main.py — Punto de entrada del backend FastAPI.

CONTRATO DE API IDÉNTICO a la versión Django: mismas rutas, mismos JSON,
mismos códigos de estado. Por eso el frontend React funciona SIN cambios.

Ejecutar:  venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload

SEGURIDAD (producción): los orígenes permitidos por CORS se leen de la
variable de entorno CORS_ORIGINS (separados por coma). En desarrollo el
valor por defecto es localhost:5173; en producción se define el dominio
real (ej. https://mitienda.cl) y NINGÚN otro origen puede llamar a la API.
"""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, clientes, pedidos, productos, ventas

load_dotenv()

ORIGENES = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if o.strip()
]

app = FastAPI(title="Tienda de Repuestos — API (FastAPI)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(ventas.router, prefix="/api/ventas")
app.include_router(productos.router, prefix="/api/productos")
app.include_router(clientes.router, prefix="/api/clientes")
app.include_router(pedidos.router, prefix="/api/pedidos")
