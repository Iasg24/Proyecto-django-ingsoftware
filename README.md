# 📚 Sistema Web de Ventas para Tienda de Repuestos de Motocicletas

**Proyecto educativo de Ingeniería de Software — INACAP**

Un sistema web completo para que una tienda de repuestos de motocicletas
controle sus ventas digitalmente: registro de ventas con cálculo automático
de IVA (19%), emisión de boletas y facturas, control del día de trabajo y
reportes diarios para el jefe de ventas. Además, un **catálogo público**
con fotos donde los clientes ven los productos, arman un **carrito de
compras** y pueden **registrarse (opcional)** para guardar sus datos y
comprar más rápido.

---

## 🗺️ El mapa del proyecto (LEE ESTO PRIMERO)

```
tienda de repuestos de motocicleta y motos/
│
├── 📁 backend/              → La lógica del negocio (Python + Django)
│   ├── config/              →   Configuración y rutas maestras
│   ├── authapp/             →   Inicio de sesión, tokens y roles
│   ├── ventas/              →   Ventas, control de día y reportes
│   ├── productos/           →   Catálogo (CRUD + lista pública)
│   ├── clientes/            →   Registro de clientes y búsqueda por RUT
│   ├── pedidos/             →   Pedidos online (pendiente/confirmado/rechazado)
│   ├── scripts/seed.py      →   Crea usuarios, cliente y catálogo de prueba
│   ├── scripts/descargar_fotos.py → Fotos reales del catálogo (Openverse)
│   ├── database.py          →   El puente con MongoDB
│   └── venv/                →   Entorno virtual de Python (no se sube a Git)
│
├── 📁 frontend/             → La interfaz de usuario (React + Vite)
│   └── src/
│       ├── api.js           →   Todas las llamadas al backend
│       ├── auth.jsx         →   La sesión del usuario
│       ├── App.jsx          →   Las rutas de páginas por rol
│       ├── pages/           →   Login, Catálogo, Registro, Carrito, Vendedor, Jefe, Productos
│       └── components/      →   Comprobante (boleta/factura)
│
├── 📁 mongodb/              → La base de datos (binario + datos locales)
│
├── 📁 scripts/              → Botones de encendido del sistema
│   ├── todo.sh              →   Enciende TODO (mongo + backend + frontend)
│   ├── mongo.sh             →   Controla MongoDB
│   ├── backend.sh           →   Controla el backend
│   └── frontend.sh          →   Controla el frontend
│
└── 📁 docs/                 → ESTA documentación (empieza aquí)
```

## 🚀 Arranque rápido

```bash
# 1. Prender todo el sistema (3 servicios a la vez):
scripts/todo.sh

# 2. Abrir el navegador:
#    http://localhost:5173

# 3. Iniciar sesión con los usuarios de prueba:
#    Vendedor:      vendedor / vendedor123
#    Jefe de Ventas: jefe    / jefe123
#    Cliente:       maria@mail.com / maria123

# 4. (Opcional) Ver el catálogo público sin iniciar sesión:
#    http://localhost:5173/catalogo
```

> Si la base de datos quedó vacía (o quieres resetear los usuarios):
> `scripts/backend.sh seed`

## 📖 Índice de la documentación

| Documento | ¿Qué vas a aprender? |
|-----------|----------------------|
| [01-como-funciona-la-web.md](01-como-funciona-la-web.md) | Cliente-servidor, HTTP, JSON y las APIs REST: el ABC de todo sistema web |
| [02-arquitectura.md](02-arquitectura.md) | Cómo se conectan frontend, backend y MongoDB (el "mapa del sistema") |
| [03-backend-django.md](03-backend-django.md) | Cada pieza del backend: rutas, vistas, autenticación, IVA, reportes |
| [04-frontend-react.md](04-frontend-react.md) | Cada pieza del frontend: componentes, estado, sesión, rutas |
| [05-mongodb.md](05-mongodb.md) | La base de datos: colecciones, documentos y consultas |
| [06-el-viaje-de-una-venta.md](06-el-viaje-de-una-venta.md) | Paso a paso técnico de una venta real, de la pantalla a la base de datos |
| [07-git-y-control-de-versiones.md](07-git-y-control-de-versiones.md) | Git: el control de versiones de este proyecto, con comandos prácticos |
| [08-siguientes-pasos.md](08-siguientes-pasos.md) | De esto a producción: nube (AWS/OCI), MongoDB Atlas y seguridad |
| [09-catalogo-y-clientes.md](09-catalogo-y-clientes.md) | El catálogo público y el registro de clientes (módulo extra) |
| [10-pedidos-y-carrito.md](10-pedidos-y-carrito.md) | El carrito de compras y los pedidos online (módulo extra) |
| [11-guia-defensa-commits.md](11-guia-defensa-commits.md) | Qué responder por cada commit en la defensa del proyecto |

## ✅ Requisitos del enunciado cumplidos

| Requisito | Módulo | Dónde está implementado |
|-----------|--------|--------------------------|
| 1.1 Pantalla de login | Frontend | `frontend/src/pages/Login.jsx` |
| 1.2 Validar credenciales | Backend | `backend/authapp/views.py` → `login()` |
| 1.3 Roles Vendedor/Jefe | Ambos | `backend/authapp/helpers.py` → `requiere_rol()` |
| 1.4 Redirigir por rol | Frontend | `frontend/src/App.jsx` |
| 2.1 Formulario de venta | Frontend | `frontend/src/pages/Vendedor.jsx` |
| 2.2 IVA 19% y total automático | Backend | `backend/ventas/calculos.py` |
| 2.3 Boleta o Factura | Ambos | Selector en `Vendedor.jsx` + validación en `crear_venta()` |
| 2.4 Datos de cliente en factura | Ambos | Campos condicionales + validación backend |
| 2.5 Guardar en la nube | Backend | `database.py` (MongoDB) |
| 3.1 Vista previa del comprobante | Ambos | `vista_previa()` + `components/Comprobante.jsx` |
| 4.1 Abrir/Cerrar día | Ambos | `Jefe.jsx` + `abrir_dia()` / `cerrar_dia()` |
| 4.2 Bloquear ventas si día cerrado | Backend | Chequeo en `crear_venta()` (la seguridad real está en el servidor) |
| 5.1-5.4 Reportes diarios | Ambos | `reporte_diario()` + `Jefe.jsx` |
| 5.5 Datos desde la base de datos | Backend | Todas las cifras se calculan leyendo MongoDB |

## ✅ Módulo extra (agregado en esta sesión)

| Funcionalidad | Dónde está |
|---|---|
| Catálogo público (sin login) | `GET /api/productos/` + `pages/Catalogo.jsx` |
| Registro opcional de clientes | `POST /api/clientes/registro` + `pages/Registro.jsx` |
| Clientes guardan sus datos (RUT, dirección...) | Colección `clientes` (contraseñas hasheadas) |
| Vendedor/Jefe administran el catálogo (CRUD) | `productos/views.py` + `pages/Productos.jsx` |
| "Comprar más rápido": vendedor escribe el RUT y se autocompleta la factura | `GET /api/clientes/buscar?rut=...` + selector en `Vendedor.jsx` |
| Formulario de venta conectado al catálogo (elige producto → autocompleta) | Selector en `Vendedor.jsx` |
| Carrito de compras (localStorage, sin login) | `src/carrito.jsx` + `pages/Carrito.jsx` |
| Cliente hace pedido online (P-0001, estado pendiente) | `POST /api/pedidos/` (público) |
| La tienda confirma/rechaza pedidos → crea ventas con folio y descuenta stock | `confirmar_pedido()` + sección "Pedidos online" en `Jefe.jsx` |
| **Pago real con Stripe (modo prueba)**: tarjeta/transferencia/efectivo al retirar | `pedidos/pagos.py` + `PedidoExito.jsx` (activar: `backend/.env`, ver docs/10) |
| Fotos reales del catálogo (licencia libre) | `frontend/public/imagenes/` + `scripts/descargar_fotos.py` |
