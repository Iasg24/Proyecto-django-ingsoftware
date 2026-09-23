# 06 — El viaje completo de una venta

Este es el documento más importante para entender cómo "se conectan las
cosas". Sigue una venta real **de punta a punta**: del clic del vendedor
al documento guardado en MongoDB, y de vuelta a la pantalla.

Escenario: la vendedora Camila vende **2 baterías YTZ7S a $42.000 c/u**
y emite una **factura** para "Motos del Sur SpA".

---

## Paso 1 — El vendedor escribe (Frontend)

Camila abre `http://localhost:5173`, inicia sesión (login: `vendedor`),
y el día está abierto (el jefe lo abrió antes). Completa el formulario:

```
Código: B-005        Nombre: Batería YTZ7S
Cantidad: 2          Precio unitario: 42000
Tipo: ● Boleta   ○ Factura   →  elige Factura
→ aparecen los campos: RUT 76.543.210-5, Razón social Motos del Sur SpA,
  Giro Comercio de repuestos, Dirección Av. Brasil 1200, Valparaíso
```

En el navegador, `Vendedor.jsx` guarda cada tecla en el estado
`formulario` con `useState`. Aún no ha pasado nada por la red.

## Paso 2 — "Ver comprobante" (Frontend → Backend)

Camila hace clic en **Ver comprobante**. `Vendedor.jsx` llama:

```js
await api.vistaPrevia(formulario)
```

que ejecuta (en `api.js`):

```js
fetch('/api/ventas/vista-previa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json',
             'Authorization': 'Token 3f2a9c1b-...' },
  body: JSON.stringify({ codigo_producto: 'B-005', cantidad: 2, ... }),
})
```

### ¿Qué pasó en la red? (el detalle fino)

1. El navegador abre una conexión HTTP al puerto **5173** (Vite).
2. Vite mira la URL `/api/...`, aplica su **proxy** y reenvía al 8000.
3. Django recibe la petición: `config/urls.py` → `ventas/urls.py`
   → vista `vista_previa`.
4. La vista lee la cabecera `Authorization`, busca el token en Mongo,
   encuentra a Camila (rol: vendedor). ✔ Autenticada.

## Paso 3 — El backend calcula (Backend)

```python
calculos = calcular_venta(2, 42000)
#   neto = 2 × 42.000 = 84.000
#   iva  = 84.000 × 0,19 = 15.960
#   total = 84.000 + 15.960 = 99.960
```

No se toca la base de datos (solo el chequeo del día). El backend
responde con el JSON del comprobante "impreso".

## Paso 4 — La vista previa en pantalla (Backend → Frontend)

`Comprobante.jsx` pinta el documento como si fuera papel: encabezado,
datos del cliente, tabla del producto y totales (IVA 19% incluido).
Camila revisa que todo esté bien.

```
┌────────────────────────────────────────┐
│          Bazar de Repuestos            │
│  Av. Siempre Viva 123      FACTURA     │
│  RUT 11.111.111-1      Folio: —        │
│                         2026-08-17     │
│  Datos del Cliente                     │
│  RUT: 76.543.210-5                     │
│  Razón social: Motos del Sur SpA       │
│  Código  Producto     Cant. P.Unit.    │
│  B-005   Batería YTZ7S   2   $42.000   │
│  Neto: $84.000                         │
│  IVA (19%): $15.960                    │
│  TOTAL: $99.960                        │
└────────────────────────────────────────┘
```

> ⚠️ **Nada se guardó todavía.** Este documento es solo un cálculo.
> Por eso si Camila recarga la página, la venta "no existe".

## Paso 5 — "Confirmar y guardar" (Frontend → Backend)

Todo correcto. Camila hace clic en **Confirmar y guardar venta**.

`Vendedor.jsx` llama `api.guardarVenta(formulario)` → `POST /api/ventas/`
con los mismos datos.

## Paso 6 — El backend valida DE NUEVO (Backend)

Aquí está el momento clave de la seguridad. El backend **no confía** en
que el frontend le haya mandado los datos correctos:

```python
# 1. ¿Día abierto? (el vendedor podría tener una pestaña vieja abierta)
#    → 403 si el jefe cerró el día en otro momento.

# 2. ¿Faltan campos? código, producto, cantidad, precio.

# 3. ¿Es factura? → ¿RUT, razón social, giro, dirección?  ✔ (todo presente)

# 4. RECALCULA el IVA (ignora cualquier total que venga del navegador).

# 5. Siguiente folio: F-0001  (contador atómico en Mongo)

# 6. Guarda el documento COMPLETO en la colección "ventas".
```

El documento guardado incluye hasta el vendedor y el momento exacto:

```json
{
  "folio": "F-0001",
  "fecha": "2026-08-17",
  "hora": "18:36:57",
  "tipo_documento": "factura",
  "codigo_producto": "B-005",
  "producto": "Batería YTZ7S",
  "cantidad": 2,
  "precio_unitario": 42000,
  "neto": 84000.0,
  "iva": 15960.0,
  "total": 99960.0,
  "cliente": {
    "rut": "76.543.210-5",
    "razon_social": "Motos del Sur SpA",
    "giro": "Comercio de repuestos",
    "direccion": "Av. Brasil 1200, Valparaíso"
  },
  "vendedor": { "usuario": "vendedor", "nombre": "Camila Rojas Pérez" },
  "creado_en": "2026-08-17T18:36:57.387468-04:00"
}
```

## Paso 7 — La respuesta vuelve (Backend → Frontend)

Django responde `201 Created` con la venta (sin `_id`). El proxy la
devuelve a React, que muestra:

> 🎉 ¡Venta **F-0001** registrada en la base de datos!

…y con el comprobante impreso completo, esta vez con folio y hora.
Camila puede imprimirla o mandarla por correo: es su documento oficial.

## Paso 8 — El jefe ve el impacto (la guinda del pastel)

A las 20:00, el jefe abre su panel y ve el reporte del día. Su pantalla
consulta `GET /api/ventas/reporte/diario` (con su token de jefe).

El backend lee TODAS las ventas de hoy de Mongo, suma y agrupa:

| Boletas | Facturas | Total ventas |
|---|---|---|
| 2 (178.500) | 1 (99.960) | 3 |

| Total neto | IVA recaudado | Total recaudado |
|---|---|---|
| 234.000 | 44.460 | 278.460 |

**Por vendedor:**

| Vendedor | Ventas | Neto | IVA | Total |
|---|---|---|---|---|
| Camila Rojas Pérez | 3 | 234.000 | 44.460 | 278.460 |

Y si el jefe lo desea, cierra el día: desde ese momento, cualquier
intento de venta recibe `403: El día está cerrado`. **Todo, directo de
la base de datos, sin una sola cifra inventada.**

---

## El diagrama resumido del viaje

```
Camila ──clic──► Vendedor.jsx ──fetch──► Vite 5173
                                              │ proxy
                                              ▼
                                   Django 8000: vista_previa / crear_venta
                                              │
                                              ├─► valida token + rol
                                              ├─► valida día abierto
                                              ├─► valida campos
                                              ├─► calcular_venta() [IVA 19%]
                                              └─► MongoDB 27017: guarda
                                              ▲
                                              │
Camila ◄── "¡Venta F-0001!" ◄── React pinta ◄─┘
```

Y esta misma historia, con otros actores, es la historia del reporte
del jefe: **todo lo que ves en pantalla pasó antes por HTTP, y todo lo
que importa quedó guardado en MongoDB.**

Siguiente: [07-git-y-control-de-versiones.md](07-git-y-control-de-versiones.md).
