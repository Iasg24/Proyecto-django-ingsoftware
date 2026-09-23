# 11 — Guía de defensa: qué responder por CADA commit

**Truco principal antes de empezar:** en tu historial hay "commits parecidos"
a propósito. Son DOS SPRINTS del mismo proyecto:

```
SPRINT 1 (hace 2 semanas)  →  versión básica con Django + MySQL
SPRINT 2 (ahora)           →  versión completa con Django + React + MongoDB
```

Si la profe pregunta "¿por qué hay dos commits que dicen casi lo mismo?",
tu respuesta es:

> *"Porque el proyecto pasó por dos iteraciones. En el sprint 1 construí la
> base con MySQL y la lógica básica de ventas. En el sprint 2 migré a
> MongoDB (mejor para documentos como boletas y facturas) y agregué toda
> la tienda online: catálogo, clientes, carrito y pagos. En el historial
> se ven las dos etapas del proceso, no son errores ni duplicados."*

---

## SPRINT 1 — La primera versión (Django + MySQL)

### `afff531` docs: incorporacion de backlog, requerimientos BDD y documentacion de arquitectura

> "Fue el primer commit del proyecto: subí la documentación inicial del
> enunciado — el backlog de tareas, los requerimientos en formato BDD
> (historias de usuario con dado/cuando/entonces) y un primer dibujo de
> la arquitectura. Antes de programar, planifiqué."

### `e936fbe` feat(core): inicializacion de proyecto Django y configuracion de base de datos MySQL

> "Creé el esqueleto del backend con Django (`manage.py`, settings, urls)
> y dejé configurada la conexión a MySQL. Era la elección de base de
> datos de esa primera versión."

### `541ebc1` feat(models): definicion de modelos de usuario, productos, ventas y comprobantes

> "Definí el modelo de datos con el ORM de Django: usuarios (con rol
> vendedor/jefe), productos, ventas y comprobantes. Es la base sobre la
> que se construyó toda la lógica después."

### `b27b4dc` feat(ventas): selector boleta/factura con calculo 19% IVA y modal de confirmacion

> "Implementé la venta: el vendedor elige boleta o factura, el sistema
> calcula automáticamente el 19% de IVA y muestra un modal de confirmación
> antes de guardar. Es el corazón del negocio del enunciado."

### `357703b` release: cierre de sprint 2 - integracion MySQL, roles de acceso y modulo de ventas funcional

> "Cerré el primer sprint: todo lo anterior integrado y probado en una
> versión estable — MySQL funcionando, login con roles y el módulo de
> ventas operativo de punta a punta."

---

## SPRINT 2 — La versión final (Django + React + MongoDB)

### `93b70c0` docs: incorporacion de documentacion educativa, backlog y guia de arquitectura

> "Al rediseñar el sistema, reescribí la documentación completa: ahora
> son 10 guías que explican desde cómo funciona la web y el HTTP, hasta
> cada módulo del sistema y el viaje completo de una venta. Lo hice
> pensando en que cualquier persona nueva pueda entender el proyecto."

### `a85ee18` feat(core): inicializacion del proyecto Django + React y conexion a MongoDB

> "Inicié la nueva arquitectura: backend en Django exponiendo una API
> REST, frontend separado en React (Vite), y conexión a MongoDB con
> PyMongo. Es el cambio grande del sprint 2: separar frontend y backend
> en capas."

### `037c232` feat(auth): login con roles Vendedor, Jefe de Ventas y Cliente

> "Implementé la autenticación completa: tokens de sesión, contraseñas
> hasheadas (nunca en texto plano) y TRES roles: Vendedor, Jefe de Ventas
> y Cliente. Cada rol vive en su colección y el sistema redirige a cada
> uno a su panel."

### `1b6a5fe` feat(ventas): registro de ventas con IVA 19%, vista previa de comprobante y control de dia

> "Reescribí el módulo de ventas sobre la nueva arquitectura: el cálculo
> del IVA se hace SIEMPRE en el servidor (regla de seguridad con dinero),
> hay vista previa del comprobante antes de guardar, y agregué el control
> de día: si el jefe cierra el día, nadie puede vender."

### `44e0ad6` feat(catalogo): catalogo publico con fotos reales, CRUD de productos y registro de clientes

> "Agregué la vitrina de la tienda: catálogo público con fotos reales
> (descargadas de Openverse, licencias libres), administración de
> productos para vendedor y jefe, y registro opcional de clientes para
> guardar sus datos y comprar más rápido."

### `a5bbcd6` feat(pedidos): carrito de compras, pedidos online y pagos con Stripe en modo prueba

> "El módulo más ambicioso: carrito de compras que vive en localStorage,
> pedidos online con estado pendiente/confirmado/rechazado, descuento de
> stock al confirmar, y pagos: tarjeta con validación Luhn, transferencia
> y efectivo, más integración con Stripe en modo prueba — el mismo SDK
> que usa una tienda real."

### `ce13cd1` release: cierre del sprint 2 - sistema completo con MongoDB y tienda online

> "Release de la versión 2: todos los módulos integrados y probados de
> punta a punta (catálogo → carrito → pago → pedido → confirmación →
> reporte), con los scripts de encendido del sistema."

### `7c2c62d` merge: se integra el historial del sprint 1 (Django + MySQL)

> "Cuando volví a conectar la carpeta con GitHub, uní las dos historias
> (sprint 1 y sprint 2) para que el repositorio cuente el proceso completo
> y no se pierda el trabajo anterior."

### `744469c` refactor: se reemplaza la version MySQL del sprint 1 por la nueva arquitectura con MongoDB

> "Ese commit deja el repositorio con SOLO la versión final: el código
> viejo de MySQL quedó guardado en la historia (se puede consultar), pero
> el árbol actual es la nueva arquitectura con MongoDB."

---

## Preguntas trampa frecuentes (y sus respuestas)

**"¿Por qué usaste dos bases de datos?"**
> "El enunciado permitía MySQL, Oracle o MongoDB. Empecé con MySQL en el
> sprint 1 y en el sprint 2 migré a MongoDB porque las boletas y facturas
> son documentos que conviene guardar enteros en JSON, y el catálogo
> flexible de productos calza mejor con un esquema de documentos. La
> migración está justificada en la documentación."

**"¿Y ese SQLite que aparece en el código?"**
> "No es una base del negocio: Django exige tener una base relacional
> interna para su panel admin y sesiones. Todos los datos reales del
> sistema viven en MongoDB."

**"¿Los totales los calcula el frontend?"**
> "No. El frontend muestra un adelanto, pero neto/IVA/total se calculan
> SIEMPRE en el servidor con la misma función, y el pedido recalculado
> es el que se guarda. Un usuario no puede alterar el JavaScript y pagar
> menos."

**"¿Guardas los números de tarjeta?"**
> "Nunca. Solo la marca y los últimos 4 dígitos (ej: Visa •••• 4242).
> El CVV se valida y se descarta, y con Stripe activo ni siquiera vemos
> el número: lo procesa la página de Stripe y nosotros verificamos el
> pago preguntándole a su API."

**"¿Qué es el commit `refactor: se reemplaza...`?"**
> "Es el commit que deja limpio el repositorio: la versión MySQL quedó
> en la historia (buena práctica de trazabilidad) pero el código actual
> es solo la versión MongoDB."
