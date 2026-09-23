# 11 — Guía de defensa: qué responder por CADA commit

El repositorio de GitHub tiene **8 commits** que cuentan la construcción
del sistema módulo por módulo, en orden cronológico. La idea central
para la defensa:

> *"Cada commit es un módulo terminado y probado. No subí el proyecto
> de una vez: lo versioné por hitos, como se trabaja en un equipo real."*

---

## Qué responder por cada commit

### 1. `docs: incorporacion de documentacion educativa, backlog y guia de arquitectura`

> "Fue el primer commit: subí la documentación del proyecto antes de
> programar — el backlog, los requerimientos en formato BDD y la guía
> de arquitectura. Primero se planifica, después se construye."

### 2. `feat(core): inicializacion del proyecto Django + React y conexion a MongoDB`

> "Creé el esqueleto de las tres capas: el backend Django con su API
> REST, el frontend React (Vite) y la conexión a MongoDB con PyMongo,
> más los scripts de encendido del sistema."

### 3. `feat(auth): login con roles Vendedor, Jefe de Ventas y Cliente`

> "Implementé la autenticación completa: sesiones por token, contraseñas
> hasheadas —nunca en texto plano— y tres roles, cada uno redirigido a
> su propio panel y con permisos controlados en el servidor."

### 4. `feat(ventas): registro de ventas con IVA 19%, vista previa de comprobante y control de dia`

> "El corazón del negocio: registro de ventas con boleta o factura,
> cálculo del 19% de IVA SIEMPRE en el servidor, vista previa del
> comprobante antes de guardar, y el control de día: si el jefe cierra
> el día, nadie puede vender."

### 5. `feat(catalogo): catalogo publico con fotos reales, CRUD de productos y registro de clientes`

> "Agregué la vitrina de la tienda: catálogo público con fotografías
> reales (licencia libre), administración de productos para vendedor y
> jefe, y registro opcional de clientes para autocompletar facturas por
> RUT."

### 6. `feat(pedidos): carrito de compras, pedidos online y pagos con Stripe en modo prueba`

> "El módulo más ambicioso: carrito persistente en localStorage, pedidos
> online con estados pendiente/confirmado/rechazado, descuento de stock
> al confirmar, y pagos — tarjeta con validación Luhn, transferencia y
> efectivo, con integración a Stripe en modo prueba."

### 7. `release: cierre del sprint 2 - sistema completo con MongoDB y tienda online`

> "El release: cerré el ciclo con el sistema completo y probado de punta
> a punta — catálogo, carrito, pago, pedido, confirmación y reporte —
> todo funcionando."

### 8. `docs: guia de defensa commit por commit para la presentacion del proyecto`

> "Documenté la guía de defensa del proyecto: qué contiene cada commit,
> para que la presentación quede respaldada por el historial real."

---

## Preguntas frecuentes de la defensa

**"¿Por qué MongoDB y no MySQL?"**
> "El enunciado permitía MySQL, Oracle o MongoDB. Elegí MongoDB porque
> las boletas y facturas son documentos que conviene guardar completos
> en JSON, el catálogo evoluciona sin migraciones de esquema, y se
> integra naturalmente con la API REST."

**"¿Y el SQLite que aparece en la configuración?"**
> "No es una base del negocio: Django exige una base relacional interna
> para su panel admin y sesiones. Todos los datos reales del sistema
> viven en MongoDB."

**"¿Los totales los calcula el frontend?"**
> "No. El frontend muestra un adelanto, pero neto/IVA/total se calculan
> SIEMPRE en el servidor con una única función, y el valor guardado es
> el recalculado por el backend. Un usuario no puede alterar el
> JavaScript para pagar menos."

**"¿Guardas los números de tarjeta?"**
> "Nunca. Solo la marca y los últimos 4 dígitos (ej: Visa •••• 4242).
> El CVV se valida y se descarta. Con Stripe activo, ni siquiera vemos
> el número: lo procesa la página de Stripe y verificamos el pago
> preguntándole a su API."

**"¿Qué es Conventional Commits?"**
> "Es la convención de mensajes `tipo(scope): descripción` que usan los
> equipos profesionales: feat para funcionalidad nueva, docs para
> documentación y release para versiones cerradas. Facilita leer el
> historial y generar automáticamente las notas de cada versión."
