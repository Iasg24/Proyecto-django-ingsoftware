# 13 — Migración Django → FastAPI (la prueba del desacoplamiento)

Este documento registra el experimento más importante del proyecto:
**cambiar el framework del backend sin tocar una sola línea del frontend**.
Es la demostración empírica de que la arquitectura en capas funciona.

## 1. ¿Qué se cambió y qué NO?

| Capa | ¿Cambió? | Detalle |
|---|---|---|
| Frontend (React + Vite) | ❌ **Intacto** | Ni un carácter modificado |
| Contrato de API | ❌ **Intacto** | Mismas rutas /api/*, mismos JSON, mismos códigos (401/403/201...) |
| Base de datos (MongoDB) | ❌ **Intacta** | Mismos datos, mismas colecciones |
| Reglas de negocio | ❌ **Intactas** | calculos.py (IVA 19%) copiado sin cambios |
| Contraseñas | ❌ **Compatibles** | Los hashes de Django (pbkdf2_sha256) verifican sin migrar |
| Backend | ✅ **Reemplazado** | Django + DRF → FastAPI + Uvicorn |

## 2. Por qué funcionó (la lección de arquitectura)

El frontend no conoce a Django: solo conoce la API. `api.js` habla HTTP/JSON
con rutas como `POST /api/ventas/`. Mientras el servidor que atienda esas
rutas responda **el mismo contrato**, el cliente no distingue quién está
detrás. Esto es el desacoplamiento: cada capa depende de una INTERFAZ, no
de una implementación.

## 3. Mapa de equivalencias (Django → FastAPI)

| Concepto Django | Concepto FastAPI | Archivo |
|---|---|---|
| `urls.py` + `views.py` | `routers/*.py` + decoradores @router | routers/ |
| `@api_view(['POST'])` | `@router.post("/ruta")` | routers/ |
| Decorador `@requiere_rol('jefe')` | Dependencia `Depends(requiere_rol("jefe"))` | seguridad.py |
| `request.data` | `payload: dict = Body(...)` | routers/ |
| `request.query_params` | parámetro tipado `fecha: str = None` | routers/ |
| `make_password` de Django | `make_password` propio (mismo formato hash) | seguridad.py |
| `django-cors-headers` | `CORSMiddleware` | main.py |
| `manage.py runserver` | `uvicorn main:app` | scripts/backend-fastapi.sh |
| settings.TIME_ZONE | `ZoneInfo("America/Santiago")` | routers/ventas.py |

## 4. Cómo alternar entre backends

```bash
# Usar Django (el original):
scripts/backend-fastapi.sh stop
scripts/backend.sh start

# Usar FastAPI (el nuevo):
scripts/backend.sh stop
scripts/backend-fastapi.sh start
```

El frontend (5173) funciona igual con cualquiera de los dos.

## 5. Cómo defender esto en la interrogación

> "Después de entregar el informe, hice un refactoring que demuestra la
> arquitectura: reemplacé Django por FastAPI en el backend y el frontend
> React no requirió NINGÚN cambio, porque ambas versiones exponen el mismo
> contrato de API. Incluso las contraseñas de los usuarios siguieron
> funcionando, porque mantuve el mismo formato de hash. Eso es lo que
> significa desacoplar capas: cambiar un motor sin tocar la carrocería."

## 6. Evidencia verificable

- Rama de Git: `feature/fastapi` (el main conserva la versión Django)
- Prueba de punta a punta ejecutada: login → abrir día → venta con IVA →
  reporte → pedido con pago, todo vía el proxy del frontend (5173)
- El frontend sigue sirviendo con HTTP 200 sin modificaciones
