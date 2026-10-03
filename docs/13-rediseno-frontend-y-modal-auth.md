# 13 — Rediseño del Frontend E-Commerce y Modal de Autenticación Rápida

En esta etapa del proyecto, el frontend dio un salto cualitativo: transformamos la interfaz de una vitrina simple a una **experiencia de tienda e-commerce completa de alto impacto**, inspirada en tiendas especializadas como **Megabytes** y **Motolike**, adaptada 100% al rubro de repuestos, lubricantes, cascos e indumentaria de motocicletas.

Además, incorporamos el sistema de **autenticación en modal flotante (doble columna: Acceder y Registrarse)** para que el cliente pueda iniciar sesión o crear su cuenta **en la misma pantalla**, sin perder el carrito ni lo que estaba mirando.

---

## 1. El problema que resuelve este cambio

| Antes | Con el rediseño |
|---|---|
| Para entrar o registrarse había que ir a `/login` o `/registro` (cambio brusco de página). | **Modal flotante**: Se abre sobre la tienda sin abandonar la navegación. |
| El catálogo era una grilla plana sin categorías laterales ni promociones. | **Layout profesional**: Menú lateral de categorías con contadores, carrusel hero dinámico y vitrina de kits destacados. |
| No había barra de confianza ni información clara de la tienda física. | **Barra de beneficios** (despachos, retiro, garantías, medios de pago) + **Footer completo** con horarios, dirección y WhatsApp flotante. |
| No se podían ver detalles de un producto sin salir del catálogo. | **Modal de vista rápida**: Muestra ficha técnica, fotos ampliadas, compatibilidad y selector de cantidad. |

---

## 2. El árbol de componentes del Frontend actualizado

```
frontend/src/
├── components/
│   ├── Navbar.jsx          ⭐ Encabezado triple (topbar, buscador integrado, barra roja)
│   ├── ModalAuth.jsx       ⭐ Ventana modal de acceso y registro sin cambio de ventana
│   ├── Footer.jsx          ⭐ Barra de confianza roja + pie de página oscuro + WhatsApp
│   └── Comprobante.jsx     ⭐ Boleta/factura térmica para el vendedor
├── pages/
│   ├── Catalogo.jsx        ⭐ Tienda principal con categorías, slider hero y productos
│   ├── Carrito.jsx         ⭐ Carro de compras con flujo de pago online
│   ├── Login.jsx           ⭐ Pantalla de inicio de sesión alternativa
│   ├── Registro.jsx        ⭐ Pantalla de registro de cliente alternativa
│   ├── Vendedor.jsx        ⭐ Punto de venta y emisión de comprobantes
│   ├── Jefe.jsx            ⭐ Control de día, aprobación de pedidos y reportes
│   └── Productos.jsx       ⭐ Administración del inventario (CRUD)
├── auth.jsx                ⭐ Contexto de sesión (token, rol, nombre)
├── carrito.jsx             ⭐ Estado del carro en localStorage
└── styles.css              ⭐ Sistema de diseño Motorsport (paleta racing red, grid, animaciones)
```

---

## 3. ¿Cómo funciona el Modal de Autenticación sin cambiar de ventana?

El modal `ModalAuth.jsx` implementa una arquitectura **Side-by-Side (Doble Columna)** idéntica a los portales modernos de venta:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MODAL DE AUTENTICACIÓN                     [ ✕ ] │
├───────────────────────────────────┬────────────────────────────────────┤
│              ACCEDER              │            REGISTRARSE             │
│                                   │                                    │
│ Usuario o correo:                 │ Nombre completo:                   │
│ [_______________________________] │ [________________________________] │
│                                   │                                    │
│ Contraseña:                       │ RUT:                               │
│ [_______________________________] │ [________________________________] │
│                                   │                                    │
│ [x] Recuérdame                    │ Correo electrónico:               │
│                                   │ [________________________________] │
│ [      BOTÓN: ACCEDER      ]      │                                    │
│                                   │ Contraseña (mínimo 6 caracteres): │
│ ¿Olvidaste la contraseña?         │ [________________________________] │
│                                   │                                    │
│ ── Acceso rápido de prueba ──     │ Al registrarte aceptas los         │
│ [Vendedor] [Jefe] [María]         │ términos y condiciones.            │
│                                   │                                    │
│                                   │ [    BOTÓN: REGISTRARSE    ]       │
└───────────────────────────────────┴────────────────────────────────────┘
```

### El flujo técnico paso a paso:

```
1. Usuario hace clic en "INGRESAR", "CREAR CUENTA" o "MI CUENTA" en Navbar.jsx
   └── setModalAuthAbierto(true)

2. React monta el componente <ModalAuth />:
   ├── Se activa el backdrop oscuro con desenfoque: backdrop-filter: blur(5px)
   └── El usuario ve ambas columnas simultáneamente.

3. Si elige ACCEDER:
   ├── Envía formulario -> ejecuta iniciarSesion(usuario, password) de auth.jsx
   ├── auth.jsx hace POST /api/auth/login al backend Django
   ├── Si las credenciales son válidas, guarda el Token en localStorage
   ├── Actualiza el estado reactivo `user` en memoria
   └── Cierra el modal: la barra superior ahora dice "Hola, [Nombre] ([Rol])".
       (Si el usuario es vendedor o jefe, se le redirige automáticamente a su panel).

4. Si elige REGISTRARSE:
   ├── Envía formulario -> llama a api.registrarCliente({ nombre, rut, email, password })
   ├── Backend valida que el RUT y el Email no estén repetidos y contraseña >= 6
   ├── Guarda el cliente en MongoDB (password con hash pbkdf2)
   ├── El frontend de inmediato ejecuta iniciarSesion(email, password)
   └── Cierra el modal con sesión iniciada y listo para comprar.
```

---

## 4. Anatomía de la Tienda E-Commerce ([Catalogo.jsx](file:///home/igna/Documentos/ing%20de%20software%20inacap/proyectos/tienda%20de%20repuestos%20de%20motocicleta%20y%20motos/frontend/src/pages/Catalogo.jsx))

La página principal del bazar reúne los elementos clave de una tienda de motos moderna:

### A. Menú lateral de Categorías (`sidebar-categorias`)
Permite filtrar al instante por tipo de repuesto o accesorio:
- 🛞 Neumáticos & Cámaras
- 🛑 Frenos & Discos
- 🛢️ Aceites & Lubricantes
- 🪖 Cascos & Seguridad
- ⛓️ Transmisión & Cadenas
- 🔋 Baterías & Eléctricos
- 🛠️ Mantención & Filtros
- 🧥 Indumentaria & Chaquetas
- 🏍️ Accesorios & Espejos

Cada categoría muestra el conteo en tiempo real de productos disponibles calculados con `useMemo`.

### B. Carrusel Hero Promocional (`carrusel-hero-wrapper`)
- Implementa 3 diapositivas deportivas con gradientes oscuros y detalles en rojo.
- Autoplay cíclico cada 6 segundos con pausa e interactividad mediante flechas (`<`, `>`) y puntos de navegación (`carrusel-puntos`).
- Etiquetas de homologación: *Certificación DOT / ECE 22.06*, *Despacho el mismo día*, *Garantía oficial*.

### C. Tarjetas de Kits Destacados (`tarjeta-equipo-pro`)
Inspiradas en las tarjetas técnicas de componentes:
- Badge de uso (*Ideal para Rendimiento*, *Ideal Ciudad*).
- Viñetas técnicas con checks (`✓`) de compatibilidad y garantía.
- Doble precio (precio normal tachado + precio oferta en rojo).
- Indicador de stock restante ("Quedan 3 unidades").

### D. Vitrina de Productos con Descuentos
- Insignia circular de descuento en rojo (`-15%`, `-20%`, `-25%`).
- Efecto zoom suave sobre la imagen del repuesto al pasar el mouse.
- Punto verde animado con efecto de pulso para stock disponible.
- Botón **AGREGAR AL CARRO** que actualiza el carro en `localStorage` y muestra un **Toast flotante** con enlace directo a `/carrito`.

### E. Modal de Vista Rápida (`modal-backdrop-tienda`)
Al hacer clic en cualquier tarjeta, el visitante puede examinar la foto ampliada, código SKU, especificaciones, compatibilidad universal y seleccionar la cantidad deseada antes de agregar al carro.

---

## 5. El Encabezado y Pie de Página ([Navbar.jsx](file:///home/igna/Documentos/ing%20de%20software%20inacap/proyectos/tienda%20de%20repuestos%20de%20motocicleta%20y%20motos/frontend/src/components/Navbar.jsx) y [Footer.jsx](file:///home/igna/Documentos/ing%20de%20software%20inacap/proyectos/tienda%20de%20repuestos%20de%20motocicleta%20y%20motos/frontend/src/components/Footer.jsx))

### Navbar en 3 Niveles:
1. **Topbar Negra (`#111827`)**: Muestra dirección, correo de soporte, teléfono WhatsApp y botones de sesión rápida.
2. **Header Blanco**: Logo estilizado *MOTOREPUESTOS — SPEED & PARTS STORE*, barra de búsqueda central con selector de categorías y botón lupa, más el botón del usuario (👤) y contador del carrito con badge dinámico.
3. **Barra Roja Racing (`#DC2626`)**: Enlaces en mayúsculas a las principales secciones, botones de administración para vendedor/jefe y botón directo al carrito.

### Footer en 3 Secciones:
1. **Barra Roja de Beneficios**: 4 pilares de valor comercial:
   - 🚚 Despacho a todo Chile (Chilexpress, Starken, Same Day RM).
   - 🏬 Retiro en tienda física (Av. Departamental 1450, Santiago).
   - 💳 Todo medio de pago (Webpay, Redcompra, 12 cuotas).
   - 🛡️ Garantía oficial y repuestos certificados.
2. **Columnas de Información**: Datos del local, metro cercano, estacionamiento, horarios de atención con estado `● Abierto en tienda`, políticas de devolución y enlaces directos de atención.
3. **Sub-footer y WhatsApp Flotante**: Sellos de medios de pago seguro y botón verde fijo con tooltip interactivo *¿Necesitas ayuda?*.

---

## 6. Preguntas clave para la defensa del proyecto (Evaluación Oral)

**1. ¿Por qué usamos un modal emergente para la autenticación en vez de obligar al usuario a ir a otra página?**
> *Respuesta:* Por **experiencia de usuario (UX)** y **tasa de conversión**. En un e-commerce, redirigir al cliente fuera del catálogo o del carro interrumpe su proceso de compra y puede hacer que desista. Con el modal, el cliente se autentica en 2 clics y sigue exactamente donde estaba.

**2. ¿Cómo se comunican el modal y el Navbar si están en componentes separados?**
> *Respuesta:* A través de **React Context (`AuthContext`)**. Cuando el modal completa la petición exitosa con `api.login()`, llama a `iniciarSesion()`, la cual actualiza el estado global en `AuthContext`. Automáticamente, todos los componentes suscritos (como el `Navbar`, que muestra el nombre del usuario y su rol) se re-renderizan sin necesidad de recargar la página.

**3. ¿Cómo se garantiza que el stock y los precios del catálogo no sean alterados desde el cliente?**
> *Respuesta:* El frontend solo muestra datos visuales. La regla de oro de la arquitectura es que **el dinero y el stock se controlan estrictamente en el backend**: al momento de crear la venta o pedido (`POST /api/pedidos/`), Django ignora cualquier total enviado por el navegador y vuelve a consultar los precios oficiales y el stock real en MongoDB.
