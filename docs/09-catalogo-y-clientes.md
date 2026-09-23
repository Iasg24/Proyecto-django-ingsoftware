# 09 — El catálogo público y los clientes registrados

Este módulo extra convierte al sistema en algo más parecido a una tienda
real: los clientes ven los productos, pueden registrarse (opcional) y
sus datos se reutilizan para vender más rápido.

---

## 1. ¿Qué problema resuelve?

Antes, los productos "no existían": el vendedor escribía el código, el
nombre y el precio a mano en cada venta. Eso es lento y propenso a
errores (¿era $25.000 o $25.500?).

Ahora:

```
┌─────────────────────────────┐
│  PRODUCTOS (MongoDB)        │  ← el catálogo es un dato, no un escrito a mano
│  A-001 Neumático $25.000    │
│  B-005 Batería   $42.000    │
└─────────────────────────────┘
        │
        ├───────────────► CLIENTE (público): ve la vitrina en /catalogo
        ├───────────────► VENDEDOR: elige el producto y se autocompletan
        │                    código, nombre y precio
        └───────────────► JEFE: administra (crear, editar, eliminar)
```

Y el registro de clientes resuelve el segundo problema: cada factura
exigía escribir RUT, razón social, giro y dirección. Con el registro,
el vendedor escribe el RUT y el sistema llena todo.

---

## 2. La nueva colección: `productos`

Cada producto es un documento en la colección `productos`:

```json
{
  "codigo": "A-001",
  "nombre": "Neumático 120/90-18",
  "categoria": "Neumáticos",
  "precio": 25000,
  "stock": 20,
  "descripcion": "Neumático trasero, medida estándar 18\".",
  "creado_en": "2026-08-17T..."
}
```

Diseño a notar:

- **`codigo` es la llave única de negocio**: las URLs lo usan
  (`/api/productos/A-001/`) y el formulario de venta también.
- **El precio vive aquí**: cuando el vendedor elige un producto del
  catálogo, el precio viene de la base. No hay "precios inventados".
- **Stock** se muestra en el catálogo ("20 disponibles" / "Sin stock").

---

## 3. La API del catálogo y su "semáforo" de permisos

| URL | Método | ¿Quién? | ¿Qué hace? |
|---|---|---|---|
| `/api/productos/` | GET | **Público** (sin login) | Lista el catálogo |
| `/api/productos/` | POST | Vendedor o Jefe | Crea producto |
| `/api/productos/<codigo>/` | PUT | Vendedor o Jefe | Edita producto |
| `/api/productos/<codigo>/` | DELETE | Vendedor o Jefe | Elimina producto |

Fíjate en algo importante: **GET es público pero el resto exige rol**.
En `views.py` lo controlamos así:

```python
ROLES_ADMIN_CATALOGO = ('vendedor', 'jefe')

def _autorizar_administrador(request):
    user = usuario_actual(request)
    if user is None:                    # sin token → 401
        return None, _error_autenticacion()
    if user['rol'] not in ROLES_ADMIN_CATALOGO:   # rol equivocado → 403
        return None, _error_permiso()
    return user, None
```

Un cliente registrado recibe 403 si intenta crear productos (lo
probamos en la sesión). La lección: **una misma API puede tener zonas
públicas y zonas privadas**; cada endpoint declara su propia puerta.

### La lección del "Método no permitido" (bug real de esta sesión)

En un primer intento definí en `urls.py` una ruta para cada método:

```python
path('', views.listar_productos)     # solo GET
path('', views.crear_producto)       # solo POST   ← NUNCA se alcanza
```

Django toma **la primera coincidencia** y como esa vista solo permite
GET, el POST respondía "Método no permitido". La solución correcta:

```python
path('', views.coleccion_productos)   # una vista que atiende GET y POST
```

Y dentro, la vista se ramifica:

```python
@api_view(['GET', 'POST'])
def coleccion_productos(request):
    if request.method == 'GET':
        ...listar (público)...
    ...crear (con autorización)...
```

> 💡 **Regla de oro**: una URL = una vista que declara todos sus métodos.

---

## 4. La colección `clientes` y el registro opcional

```
clientes/
├── { nombre, rut, email, telefono, direccion, giro, password_hash, rol:'cliente' }
└── ...
```

Puntos de diseño:

- **Registro público**: `POST /api/clientes/registro` no pide token.
- **Contraseña hasheada**: igual que los usuarios internos
  (`make_password`). Nunca en texto plano.
- **Email y RUT únicos**: validados en el backend antes de guardar
  ("Ya existe una cuenta con ese email").
- **RUT es la llave de negocio**: lo que el vendedor usará para buscar.
- **Registrarse = sesión iniciada**: el endpoint devuelve token al
  crearla, así el cliente entra directo al catálogo (mira `Registro.jsx`).

---

## 5. El login ahora busca en dos colecciones

¿Cómo sabe el sistema distinguir entre un vendedor y un cliente al
iniciar sesión? Mira `authapp/helpers.py`:

```python
def verificar_credenciales(identificador, password):
    user = db().usuarios.find_one({'usuario': identificador})  # 1° usuarios
    coleccion = 'usuarios'
    if user is None:
        user = db().clientes.find_one({'email': identificador})  # 2° clientes
        coleccion = 'clientes'
    ...
    user['coleccion'] = coleccion   # marcamos de dónde salió
    return user
```

Y el token guarda esa pista:

```python
db().tokens.insert_one({
    'token': token,
    'usuario_id': user['_id'],
    'coleccion': user['coleccion'],   # ¿dónde buscar cuando llegue el token?
    'rol': user['rol'],
})
```

Así, `usuario_por_token` sabe si buscar en `usuarios` o en `clientes`.
Es un patrón sencillo: **el token es un "carnet" que apunta al dueño
correcto**.

### Los tres roles quedaron así

| Rol | Colección | Se identifica con | Entra a |
|---|---|---|---|
| Vendedor | `usuarios` | nombre de usuario | /vendedor, /productos |
| Jefe de Ventas | `usuarios` | nombre de usuario | /jefe, /productos |
| Cliente | `clientes` | email | /catalogo (con "Mis datos") |

---

## 6. El formulario de venta ahora "piensa por el vendedor"

### 6.1 Elegir producto del catálogo

En `Vendedor.jsx` hay un `<select>` con el catálogo. Al elegir:

```js
const elegirProducto = (codigo) => {
  const p = productos.find((x) => x.codigo === codigo)
  setFormulario((f) => ({
    ...f,
    codigo: p.codigo,
    producto: p.nombre,
    precio_unitario: String(p.precio),   // el precio sale de la base
  }))
}
```

El vendedor solo escribe la cantidad. Los campos siguen siendo
editables por si hay un precio especial o un producto fuera de catálogo.

### 6.2 Buscar cliente por RUT (el "comprar más rápido")

```js
const r = await api.buscarCliente(rut)
// si existe: llenamos razón social, giro y dirección con sus datos
```

Flujo en la tienda:

```
Cliente llega con su RUT          →  vendedor lo escribe y clic "Buscar"
  → GET /api/clientes/buscar?rut=...  (solo vendedor/jefe)
  → si está registrado: factura autocompletada en un segundo
  → si no: mensaje "no está registrado", se llenan a mano
```

---

## 7. Rutas del frontend (App.jsx actualizado)

```
/catalogo    PÚBLICA   →  vitrina + (si cliente logueado) "Mis datos"
/registro    PÚBLICA   →  crear cuenta de cliente (opcional)
/            pública   →  login; con sesión → cada rol a su panel
/vendedor    vendedor  →  formulario de venta
/jefe        jefe      →  control de día + reportes
/productos   vendedor o jefe →  administrar catálogo
```

Fíjate en un detalle de diseño: **el catálogo es la única ruta pública
que también ven los clientes logueados**. La página decide con
`user?.rol === 'cliente'` si mostrar la sección "Mis datos".

---

## 8. Autoprueba

1. ¿Por qué GET /api/productos/ no pide login?
   → Es la vitrina: el catálogo es información pública de la tienda.
2. ¿Qué pasa si un cliente registrado intenta crear un producto?
   → 403: `_autorizar_administrador` exige vendedor o jefe.
3. ¿Dónde se guarda la contraseña del cliente?
   → Hasheada en `clientes.password_hash`. Nunca se devuelve al frontend.
4. ¿Cómo sabe el token si su dueño está en `usuarios` o en `clientes`?
   → El campo `coleccion` que se guardó junto al token.
5. ¿Qué pasó cuando definimos dos rutas iguales en urls.py?
   → Django usaba la primera y rechazaba los otros métodos ("Método no
     permitido"). Solución: una vista por URL con todos sus métodos.
