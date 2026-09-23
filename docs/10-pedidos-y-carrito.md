# 10 — El carrito de compras y los pedidos online

El cliente ya no solo "mira" el catálogo: ahora arma un **carro de
compras** y hace un **pedido** que la tienda confirma. Esta es la
primera vez que un cliente deja de "ver" y empieza a "participar"
en la operación de la tienda.

---

## 1. El flujo completo (los 3 actores)

```
  CLIENTE                     TIENDA (vendedor/jefe)
  ───────                     ─────────────────────
  1. Ve el catálogo con fotos
  2. "Agregar al carro" → el
     carro vive en su navegador
     (localStorage)
  3. Abre el carro, ajusta
     cantidades
  4. "Confirmar pedido" ─────────► 5. POST /api/pedidos/
     (con o sin cuenta)                - el BACKEND recalcula precios
                                       - verifica stock
                                       - guarda pedido 'pendiente'
                                       con folio P-0001
  6. Ve "Pedido P-0001 recibido,
     la tienda lo confirmará"   ◄────
                                ──────► 7. Jefe abre su panel:
                                           "Pedidos online (1 pendiente)"
                                        8. "Confirmar" → crea UNA venta
                                           por cada línea (con folio),
                                           descuenta stock, pedido pasa
                                           a 'confirmado'
```

| Estado | Significado |
|---|---|
| `pendiente` | El cliente pagó (simulado); la tienda aún no lo procesa |
| `confirmado` | La tienda lo aceptó: stock descontado y ventas creadas |
| `rechazado` | La tienda lo anuló; el stock NO se toca |

---

## 2. El carro vive en el navegador (localStorage) — ¿por qué?

El carro es **contextual**: es del cliente, en su dispositivo, y puede
cambiarlo sin molestar al servidor. Guardarlo en `localStorage` tiene
tres ventajas:

1. Sobrevive a recargas y cierres del navegador.
2. Cero llamadas de red mientras el cliente decide (rápido y gratis).
3. La compra **no se registra** hasta el "Confirmar pedido": el
   servidor no guarda intenciones, guarda hechos.

El código (`src/carrito.jsx`):

```js
const CLAVE = 'carro'
export function cargarCarro() { return JSON.parse(localStorage.getItem(CLAVE)) || {} }
export function guardarCarro(carro) { localStorage.setItem(CLAVE, JSON.stringify(carro)) }
```

El carro es un diccionario `{codigo: cantidad}`: `{"A-001": 2}` = dos
neumáticos. El **CarritoContext** lo conecta con React: cuando cambia,
todos los componentes que lo usan (el badge "Carro (3)" del catálogo,
la página del carro) se actualizan solos.

---

## 3. El checkout: ¿quién confía en quién?

Mira el flujo del `POST /api/pedidos/`:

```python
for linea in items_crudos:
    producto = db().productos.find_one({'codigo': codigo})   # precio REAL de la base
    calculos = calcular_venta(cantidad, producto['precio'])  # IVA 19% en el servidor
    ...
    if producto['stock'] < cantidad:
        errores.append('Stock insuficiente...')
```

**El backend ignora los precios y totales que manda el navegador.**
Busca el precio de cada producto en la base y recalcula todo. Un
cliente "hacker" podría editar el JavaScript para decir "pago $1",
pero el servidor cobraría el precio real. Esta es la regla de oro
que ya conoces, aplicada a la tienda online.

El frontend muestra un adelanto de los totales (para que el cliente
sepa cuánto paga), pero el número oficial es el del pedido guardado.

---

## 4. Confirmar pedido = crear ventas (el momento mágico)

`confirmar_pedido()` en el backend hace exactamente esto:

```python
# 1. Verificar que siga 'pendiente'  (no se puede confirmar dos veces)
# 2. Verificar stock de nuevo  (pudo cambiar desde la orden)
# 3. Por CADA línea:
#      productos.update_one({'codigo': ...}, {'$inc': {'stock': -cantidad}})
#      venta = {folio: siguiente_folio('boleta'), ...}
#      ventas.insert_one(venta)      → ¡una venta como las del mostrador!
# 4. pedido -> 'confirmado', guardando ventas_folios
```

Detalles de diseño:

- **Una venta por línea** con folio propio: así el reporte diario del
  jefe ya las cuenta automáticamente (no hay que tocar el módulo 5).
- **`$inc` con valor negativo** descuenta stock de forma atómica.
- **El pedido guarda `ventas_folios`**: se puede rastrear "P-0002 →
  B-0006, B-0007, B-0008" (trazabilidad).
- Las ventas nacen con `origen: 'pedido_online'` para distinguirlas
  de las de mostrador.

---

## 5. ¿Y si no alcanza el stock?

Hay DOS controles, porque el tiempo entre ellos pasa:

| Cuándo | Dónde | Qué pasa |
|---|---|---|
| Al crear el pedido | `coleccion_pedidos` (POST) | El pedido no se crea: error "Stock insuficiente para X (hay N, pides M)" |
| Al confirmar | `confirmar_pedido` | Si el stock cambió, el pedido NO se toca: queda `pendiente` con su error |

El segundo control es importante: entre que Ana ordena y el jefe
confirma pueden pasar horas y otro pedido pudo agotar el producto.
Confirmar revisa todo de nuevo **antes de tocar nada** — si algo no
calza, no descuenta nada (transaccionalidad: todo o nada).

---

## 6. Comprar con cuenta vs como invitado

El checkout autocompleta los datos si el cliente está registrado:

```jsx
if (esClienteRegistrado) {
  api.obtenerMisDatos().then((r) => setCliente({ nombre, email, rut, direccion }))
}
```

Pero el backend NO exige cuenta: el formulario de "invitado" pide
nombre, email, RUT y dirección. Una tienda real siempre ofrece ambas
vías (el registro es un incentivo para comprar más rápido, nunca una
barrera).

---

## 7. La tienda administra desde el panel del Jefe

En `Jefe.jsx` hay una sección "📦 Pedidos online" que lista los
`pendientes` con cliente, líneas y total, y dos botones:

- **✅ Confirmar** → `POST /api/pedidos/<n>/confirmar`
- **✖ Rechazar** → `POST /api/pedidos/<n>/rechazar`

Tras confirmar, el jefe ve los folios creados y el reporte se
actualiza al instante (la misma pantalla llama de nuevo al reporte).

> 💡 La API permite confirmar a **vendedor y jefe**; por ahora solo el
> panel del jefe tiene la interfaz. Agregar el botón al panel del
> vendedor es un ejercicio sencillo (reutilizar la sección).

---

## 8. Las fotos reales

- Se descargan con `python3 backend/scripts/descargar_fotos.py`
  (fuente: **Openverse**, fotos con licencia libre de Flickr/Wikimedia).
- Viven en `frontend/public/imagenes/<codigo>.jpg` — Vite las sirve
  en `/imagenes/<codigo>.jpg`.
- Cada producto tiene el campo `imagen` (URL). Si un producto no tiene
  foto, el catálogo muestra un emoji de su categoría (nunca se rompe
  la página por una imagen faltante).
- El vendedor/jefe puede asignar la foto escribiendo la URL en el
  formulario de administración de productos.

---

## 9. El PAGO REAL con Stripe (modo prueba) 💳

El proyecto soporta dos niveles de pago con tarjeta, y el backend elige
solo:

| ¿Hay llaves de Stripe en `backend/.env`? | Qué pasa al pagar con tarjeta |
|---|---|
| No | **Pasarela simulada** local (valida Luhn/CVV/vencimiento y marca el pago como pagado) |
| Sí (`sk_test_...`) | Se crea una **Checkout Session real** en Stripe y el cliente es redirigido a `checkout.stripe.com` |

### Por qué Checkout (la página de Stripe) y no el formulario nuestro

Cuando el dinero se toca, entra en juego **PCI-DSS** (la norma de
seguridad bancaria). Procesar una tarjeta en tu propia página exige
auditorías carísimas. Por eso las tiendas usan la página de la pasarela:
**Stripe maneja la tarjeta y la seguridad; nosotros nunca vemos el
número**. Nuestro formulario de tarjeta solo se usa en la simulación
(proyecto escolar).

### El flujo con Stripe, paso a paso

```
1. Cliente llena carro + datos + "Pagar"
2. POST /api/pedidos/   (backend)
   └─ valida items/precios/stock (como siempre)
   └─ crea Checkout Session con el TOTAL calculado por el backend
   └─ guarda pedido con pago.estado = 'procesando'
   └─ responde { stripe_url }
3. Frontend: window.location = stripe_url
   → el cliente paga en checkout.stripe.com
     (tarjeta de prueba: 4242 4242 4242 4242, fecha futura, CVV cualquiera)
4. Stripe redirige a: /pedido-exito?numero=P-000X&session_id=cs_test_...
5. Frontend llama: POST /api/pedidos/P-000X/completar-pago
   └─ backend le PREGUNTA a Stripe: ¿esta sesión está pagada?
   └─ si 'paid': pago.estado = 'pagado' + marca y últimos 4 de la tarjeta
   └─ si no: error "El pago no fue completado"
```

**¿Por qué el paso 5?** Porque alguien podría abrir
`/pedido-exito?numero=P-0001&session_id=cualquiercosa` sin haber pagado.
El único que sabe la verdad es Stripe, así que le preguntamos a él.
Nunca confiamos en lo que dice el navegador (ya conoces esta regla).

### Cómo activar Stripe de verdad (modo prueba, gratis)

1. Crea una cuenta gratis en https://stripe.com (sin tarjeta, sin costos).
2. Entra a **Developers → API keys**.
3. Copia la llave **secret key de TEST** (empieza con `sk_test_`).
4. En el backend: `cp backend/.env.example backend/.env` y pega la llave:

```
STRIPE_SECRET_KEY=sk_test_XXXX
```

5. Reinicia el backend (`scripts/backend.sh stop && scripts/backend.sh start`).

Eso es todo: el pago con tarjeta ahora redirige a la página oficial de
Stripe. El `.env` no se sube a Git (está en `.gitignore`) — cada
computador tiene sus llaves.

### Seguridad de los datos de tarjeta (reglas que aplicamos)

- **Nunca guardamos el número completo ni el CVV.** Solo marca
  (Visa/Mastercard) y últimos 4 dígitos: "Visa •••• 4242".
- El CVV se valida y se olvida (es de un solo uso).
- Con Stripe activo, ni siquiera vemos el número: lo maneja su página.
- El backend verifica el pago con Stripe antes de marcarlo pagado.

---

## 10. Autoprueba

1. ¿Dónde vive el carro entre recargas? → En localStorage del navegador.
2. ¿Por qué el backend recalcula los totales del pedido?
   → Porque el cliente podría manipular el JavaScript; el precio real
     sale del catálogo en la base.
3. ¿Qué pasa si se confirma dos veces el mismo pedido?
   → Error 400: "El pedido ya fue procesado (estado: confirmado)".
4. ¿Cuándo se descuenta el stock? → Al CONFIRMAR el pedido, no al crearlo.
5. ¿Cómo entra una compra online al reporte diario?
   → Al confirmar se crean ventas normales (con folio), y el reporte
     ya las lee de la colección `ventas`.
