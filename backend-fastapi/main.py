"""
main.py — Punto de entrada del backend FastAPI.

CONTRATO DE API IDÉNTICO a la versión Django: mismas rutas, mismos JSON,
mismos códigos de estado. Por eso el frontend React funciona SIN cambios.

Ejecutar:  venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, clientes, pedidos, productos, ventas

app = FastAPI(title="Tienda de Repuestos — API (FastAPI)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(ventas.router, prefix="/api/ventas")
app.include_router(productos.router, prefix="/api/productos")
app.include_router(clientes.router, prefix="/api/clientes")
app.include_router(pedidos.router, prefix="/api/pedidos")
