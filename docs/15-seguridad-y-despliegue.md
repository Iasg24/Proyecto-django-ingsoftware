# 15 — Seguridad y preparación para el despliegue (AWS / OCI)

Checklist de lo que se aseguró ANTES de publicar el sistema en internet,
y los pasos restantes para el despliegue en la nube (AWS, Azure u OCI,
como pide el enunciado).

## 1. Seguridad ya aplicada (verificada)

| # | Medida | Cómo se implementó | Estado |
|---|---|---|---|
| 1 | Contraseñas de desarrollo eliminadas | `backend-fastapi/scripts/cambiar_contrasenas.py` reemplaza vendedor123/jefe123/maria123 por claves seguras generadas (guardadas FUERA del repo, en Descargas/CREDENCIALES_PRODUCCION.txt) | ✅ probado (las viejas dan 401) |
| 2 | Credenciales fuera del código del frontend | Los botones de "acceso rápido" se compilan SOLO en desarrollo (`import.meta.env.DEV`); el build de producción no los contiene | ✅ verificado (0 referencias en dist/) |
| 3 | CORS restringido por entorno | Orígenes permitidos leídos de la variable `CORS_ORIGINS`; en producción solo el dominio real | ✅ |
| 4 | Secretos fuera del repositorio | `.env` (Stripe, Mongo URI) está en `.gitignore` | ✅ |
| 5 | Contraseñas con hash | pbkdf2_sha256, nunca texto plano | ✅ desde el inicio |
| 6 | Números de tarjeta | Solo marca + últimos 4 dígitos; CVV se valida y se descarta | ✅ desde el inicio |

## 2. Pendientes para el despliegue real (paso a paso)

1. **Crear la base en la nube**: MongoDB Atlas (free tier M0).
   - atlas.mongodb.com → crear cuenta → New Project → Create Cluster (M0, gratis)
   - Database Access → crear usuario con contraseña fuerte
   - Network Access → permitir la IP del servidor (o 0.0.0.0/0 temporal)
   - Connect → "Drivers" → copiar el connection string
2. **Crear el servidor**: una VM gratis en AWS (EC2 t2.micro), Azure (B1s)
   u OCI (Always Free).
3. **Instalar en la VM** (script de setup que se prepara en la rama deploy):
   - Python + venv + dependencias del backend
   - Nginx (sirve el build de React y hace proxy /api → uvicorn)
   - systemd para uvicorn (se reinicia solo)
4. **Subir el código**: `git clone` en la VM (el repo es público).
5. **Configurar el entorno** en la VM:
   - `MONGO_URI` = connection string de Atlas
   - `CORS_ORIGINS` = URL pública
   - `STRIPE_SECRET_KEY` = sk_test (modo prueba)
6. **Build del frontend** en la VM y servir con Nginx.
7. **Probar**: login con las contraseñas de producción, catálogo, carrito,
   pedido y pago con la tarjeta de prueba de Stripe.

