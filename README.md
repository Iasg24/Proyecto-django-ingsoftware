# 📚 Sistema Web de Ventas para Tienda de Repuestos de Motocicletas

**Proyecto de Ingeniería de Software — INACAP**

Sistema web completo para que una tienda de repuestos de motocicletas
controle sus ventas digitalmente: registro de ventas con cálculo automático
de IVA (19%), emisión de boletas y facturas, control del día de trabajo,
reportes diarios y **venta en línea** con catálogo público, carrito de
compras, pedidos y pagos con Stripe en modo prueba. Los datos se almacenan
en **MongoDB Atlas** (base de datos en la nube).

---

## 🗺️ Mapa del proyecto

```
tienda de repuestos de motocicleta y motos/
│
├── 📁 backend-fastapi/        → La lógica del negocio (Python + FastAPI)
│   ├── main.py                →   La aplicación y el CORS
│   ├── routers/               →   auth, ventas, productos, clientes, pedidos
│   ├── seguridad.py           →   Tokens, roles y hash de contraseñas
│   ├── calculos.py            →   Regla de negocio: IVA 19%
│   ├── pagos.py               →   Pasarela de pago (simulación + Stripe)
│   ├── database.py            →   El puente con MongoDB
│   ├── scripts/               →   Cambio de contraseñas y visor de datos
│   └── venv/                  →   Entorno virtual (no se sube a Git)
│
├── 📁 frontend/               → La interfaz de usuario (React + Vite)
│   └── src/
│       ├── api.js             →   Todas las llamadas al backend
│       ├── App.jsx            →   Las rutas de páginas
│       ├── pages/             →   Tienda, Login, Carrito, Vendedor, Jefe...
│       └── components/        →   Navbar, Footer, ModalAuth, Comprobante
│
├── 📁 deploy/                 → Despliegue en la nube (AWS / OCI / Azure)
│   ├── setup.sh               →   Script que instala todo en la VM
│   ├── nginx-tienda.conf      →   Nginx: frontend + proxy /api
│   └── tienda.service         →   Servicio systemd (se reinicia solo)
│
├── 📁 scripts/                → Botones de encendido del sistema local
│   ├── todo.sh                →   Enciende TODO (mongo + backend + frontend)
│   ├── backend-fastapi.sh     →   Controla el backend
│   ├── frontend.sh            →   Controla el frontend
│   └── ver_datos.sh           →   Visor de datos de MongoDB
│
└── 📁 docs/                   → Documentación técnica y educativa
```

## 🚀 Arranque rápido (modo desarrollo)

```bash
# 1. Encender el sistema (MongoDB + FastAPI + React):
scripts/todo.sh

# 2. Abrir en el navegador:
#    http://localhost:5173
```

> Las credenciales de acceso se gestionan con
> `backend-fastapi/scripts/cambiar_contrasenas.py` y se guardan fuera del
> repositorio. Las contraseñas viajan siempre con hash (pbkdf2_sha256).

## ☁️ Despliegue (disponibilidad en línea)

La aplicación se publica en una VM de **AWS, Azure u OCI** con Nginx +
uvicorn como servicio, y la base de datos en **MongoDB Atlas**. El paquete
completo está en `deploy/` y el procedimiento en `docs/08` y `docs/15`.

## 📖 Documentación

| Documento | Contenido |
|-----------|-----------|
| [01-como-funciona-la-web.md](docs/01-como-funciona-la-web.md) | Cliente-servidor, HTTP, JSON y APIs REST |
| [02-arquitectura.md](docs/02-arquitectura.md) | Cómo se conectan frontend, backend y MongoDB |
| [04-frontend-react.md](docs/04-frontend-react.md) | Cada pieza del frontend React |
| [05-mongodb.md](docs/05-mongodb.md) | Colecciones, documentos y consultas |
| [06-el-viaje-de-una-venta.md](docs/06-el-viaje-de-una-venta.md) | El viaje completo de una venta, paso a paso |
| [07-git-y-control-de-versiones.md](docs/07-git-y-control-de-versiones.md) | Git y el flujo de trabajo |
| [08-siguientes-pasos.md](docs/08-siguientes-pasos.md) | De esto a producción: nube y seguridad |
| [10-pedidos-y-carrito.md](docs/10-pedidos-y-carrito.md) | Carrito de compras y pedidos online |
| [13-rediseno-frontend-y-modal-auth.md](docs/13-rediseno-frontend-y-modal-auth.md) | Rediseño de la tienda y modal de autenticación |
| [14-migracion-fastapi.md](docs/14-migracion-fastapi.md) | Migración del backend a FastAPI |
| [15-seguridad-y-despliegue.md](docs/15-seguridad-y-despliegue.md) | Seguridad aplicada y pasos de despliegue |

## ✅ Requisitos del enunciado

| Requisito | Dónde está implementado |
|-----------|--------------------------|
| 1.1 Pantalla de login | `frontend/src/pages/Login.jsx` |
| 1.2 Validar credenciales | `backend-fastapi/routers/auth.py` → `login()` |
| 1.3 Roles Vendedor / Jefe | `backend-fastapi/seguridad.py` → `requiere_rol()` |
| 1.4 Redirigir por rol | `frontend/src/App.jsx` |
| 2.1 Formulario de venta | `frontend/src/pages/Vendedor.jsx` |
| 2.2 IVA 19% y total automático | `backend-fastapi/calculos.py` (siempre en el servidor) |
| 2.3 Boleta o Factura | Selector en `Vendedor.jsx` + validación en `crear_venta()` |
| 2.4 Datos de cliente en factura | Campos condicionales + validación en el backend |
| 2.5 Guardar en la nube | MongoDB Atlas (ver `backend-fastapi/.env.example`) |
| 3.1 Vista previa del comprobante | `vista_previa()` + `components/Comprobante.jsx` |
| 4.1 Abrir/Cerrar el día | `Jefe.jsx` + `abrir_dia()` / `cerrar_dia()` |
| 4.2 Bloquear ventas con día cerrado | Chequeo en `crear_venta()` (error 403) |
| 5.1-5.4 Reportes diarios | `reporte_diario()` + `Jefe.jsx` |
| 5.5 Datos desde la base de datos | Todas las cifras se leen de MongoDB |

## ✅ Módulos extra

| Funcionalidad | Dónde está |
|---|---|
| Catálogo público con fotos y carrusel | `pages/Catalogo.jsx` + `public/imagenes/` |
| Registro opcional de clientes | `backend-fastapi/routers/clientes.py` |
| Administración del catálogo (CRUD) | `backend-fastapi/routers/productos.py` |
| Búsqueda de cliente por RUT (autocompletar factura) | `GET /api/clientes/buscar?rut=...` |
| Carrito de compras (localStorage) | `src/carrito.jsx` + `pages/Carrito.jsx` |
| Pedidos online (pendiente/confirmado/rechazado) | `backend-fastapi/routers/pedidos.py` |
| Pago con Stripe en modo prueba (+ simulación local) | `backend-fastapi/pagos.py` |
| Migración a FastAPI (backend único) | `docs/14-migracion-fastapi.md` |
