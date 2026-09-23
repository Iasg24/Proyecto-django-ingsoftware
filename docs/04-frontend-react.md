# 04 — El frontend (React): cada pieza explicada

---

## 1. ¿Qué es React? (en 3 ideas)

React es una librería de JavaScript que construye interfaces a partir
de **componentes**: funciones que devuelven HTML.

**Idea 1: Todo es un componente.** Así como un documento se arma con
párrafos y tablas, una app React se arma con componentes anidados:

```
<Login />          →  <form> → <input usuario> <input clave> <button>
<Vendedor />       →  <header> <formulario-venta> <Comprobante />
<Jefe />           →  <control-día> <reporte> <tabla-por-vendedor>
<Comprobante />    →  boleta o factura con sus totales
```

**Idea 2: La interfaz "reacciona" al estado.** Cada componente tiene
un **estado** (datos que pueden cambiar). Cuando el estado cambia,
React vuelve a dibujar automáticamente solo lo que cambió. Tú nunca
tocas el HTML a mano: describes cómo se ve según el estado.

```jsx
const [error, setError] = useState('')     // el estado
...
{error && <div className="alerta error">{error}</div>}   // lo que se ve
```

**Idea 3: El estado viaja de arriba hacia abajo.** Las páginas pasan
datos a sus hijos mediante **props**:

```jsx
<Comprobante venta={preview} />    // la página le presta "venta" al hijo
```

---

## 2. El árbol del frontend

```
frontend/
├── index.html        El HTML "hueco" con <div id="root">
├── vite.config.js    Config de Vite + el PROXY hacia Django
├── package.json      Dependencias y comandos (dev, build)
└── src/
    ├── main.jsx      Punto de entrada: monta React en #root
    ├── App.jsx       ⭐ Rutas: qué página según quién entra
    ├── api.js        ⭐ TODAS las llamadas al backend (el puente)
    ├── auth.jsx      ⭐ La sesión: token + usuario + login/logout
    ├── styles.css    Los estilos de toda la app
    ├── pages/
    │   ├── Login.jsx     Pantalla de inicio de sesión
    │   ├── Vendedor.jsx  Formulario + vista previa del comprobante
    │   └── Jefe.jsx      Control de día + reportes
    └── components/
        └── Comprobante.jsx   La boleta/factura impresa en pantalla
```

---

## 3. `main.jsx` y `index.html` — cómo "prende" React

`index.html` es la página mínima que el navegador descarga. Contiene
`<div id="root">` y un `<script>` que carga `main.jsx`. React "agarra"
ese div vacío y dibuja TODO el contenido de la app dentro:

```
index.html  ──►  <div id="root">  ──►  React dibuja  ──►  ¡la app completa!
```

---

## 4. `api.js` — el puente con el backend (el archivo más importante)

Todos los componentes hablan con el backend a través de `api.js`.
Nadie más sabe hacer `fetch()`. Por eso, cuando el backend cambie su
URL, solo se toca este archivo.

```js
async function peticion(url, metodo, cuerpo) {
  const respuesta = await fetch(`${API}${url}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json',
               'Authorization': `Token ${token}` },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  const datos = await respuesta.json()
  if (!respuesta.ok) throw new Error(datos.error || 'Error')
  return datos
}
```

### Lo que debes entender aquí

1. **`fetch()` es la función nativa** del navegador para hacer HTTP.
   Es el equivalente a curl en el navegador.
2. **`async/await`**: el navegador NO se congela mientras espera la
   respuesta. `await` dice "sigue todo, avísame cuando responda".
   Es la forma moderna de manejar la asincronía.
3. **`throw new Error(...)`**: si el backend responde 400/401/403,
   convertimos su mensaje en una excepción que las páginas muestran
   en pantalla. El usuario ve "El día está cerrado..." en vez de
   un error técnico.
4. **El token se agrega solo**: si existe en localStorage, cada
   petición viaja identificada.

### El helper de dinero

```js
export function formatearDinero(monto) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)
}
```

`Intl.NumberFormat` es la API nativa de JavaScript para formatear
números según país: `89250` → `$89.250`. Nunca inventes tu propio
formato: usa el estándar del sistema operativo.

---

## 5. `auth.jsx` — la sesión compartida (Context API)

¿Cómo sabe TODA la app quién está logueado? Con un **Context**: un
contenedor global de datos que cualquier componente puede leer.

```jsx
<AuthProvider>          // <-- envuelve toda la app (main.jsx)
  <App />
</AuthProvider>

const { user, iniciarSesion, cerrarSesion } = useAuth()   // cualquier página
```

### El ciclo de vida de la sesión

```
[Abre la app]
   │
   ├─ ¿hay token en localStorage? ── no ──► pantalla de Login
   │       │
   │       sí
   │       ▼
   │  GET /api/auth/me  (¿este token sigue sirviendo?)
   │       │
   │       ▼
   │  user = {usuario, rol, nombre}  →  la app ya sabe quién eres

[Login exitoso]
   │
   ├─ localStorage.setItem('token', respuesta.token)
   └─ setUser({...})   →  App.jsx redirige según rol

[Cerrar sesión]
   │
   ├─ POST /api/auth/logout  (el backend borra el token)
   ├─ localStorage.removeItem('token')
   └─ setUser(null)  →  vuelve el Login
```

### ¿Por qué localStorage?

Porque sobrevive a recargas y cierres del navegador. El token es
como una pulsera de discoteca: se la pones al entrar y el guardia
(backend) la revisa en cada petición.

---

## 6. `App.jsx` — las rutas y los roles (requisito 1.4)

```jsx
<Route path="/vendedor"
       element={user && user.rol === 'vendedor' ? <Vendedor /> : <Navigate to="/" />} />
```

Doble seguridad, nota: aunque el frontend oculte la ruta /jefe,
aunque el usuario escriba la URL a mano, React lo redirige. Y aunque
un hacker llamara la API directamente, el backend también exige el
rol (ver documento 03).

---

## 7. `pages/Vendedor.jsx` — el flujo de la venta en pantalla

El estado del formulario es UN objeto:

```jsx
const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
```

Un clic en un input solo actualiza su campo:

```jsx
onChange={(e) => cambiarCampo('cantidad', e.target.value)}
```

Dos pasos bien separados (esto es clave):

| Acción | Qué llama | ¿Guarda algo? |
|---|---|---|
| "Ver comprobante" | `api.vistaPrevia(formulario)` | ❌ No |
| "Confirmar y guardar" | `api.guardarVenta(formulario)` | ✅ Sí (MongoDB) |

Al confirmar, el formulario se limpia con `setFormulario(FORMULARIO_VACIO)`
y se muestra la venta con su folio.

### El formulario deshabilitado (requisito 4.2)

```jsx
const diaAbierto = estadoDia === 'abierto'
<form className={`formulario-venta ${diaAbierto ? '' : 'deshabilitado'}`}>
```

Si el día está cerrado, la clase CSS `deshabilitado` atenúa el
formulario y el `pointer-events: none` impide escribir. El aviso en
la parte superior le explica al vendedor qué hacer. Recuerda: esto es
solo comodidad visual; el bloqueo REAL está en el backend.

---

## 8. `components/Comprobante.jsx` — pintar el documento

Recibe `venta` por props y solo dibuja:

- Encabezado con folio y fecha.
- (Factura) la caja "Datos del Cliente".
- Tabla del producto.
- Totales con `formatearDinero()`.

Nada de lógica, nada de fetch: un componente de **presentación** puro.
Le entregas datos, te devuelve el documento impreso.

---

## 9. `pages/Jefe.jsx` — día y reportes

```jsx
useEffect(() => { cargarReporte(fecha) }, [fecha])   // si cambia la fecha, recarga
```

- `useEffect` = "ejecuta esto cuando algo cambie (o al montar)".
- Los botones Abrir/Cerrar llaman a `api.abrirDia()` / `api.cerrarDia()`
  y actualizan el estado al instante.
- El reporte se pinta con tres bloques: tarjetas de resumen
  (boletas/facturas/totales), filas de totales (neto/IVA/recaudado) y
  la tabla por vendedor.

---

## 10. Autoprueba

1. ¿Qué pasa si el backend está apagado y el vendedor hace login?
   → `fetch()` falla y la excepción muestra el mensaje de error en la
     pantalla de login (mira el `catch` en Login.jsx).
2. ¿Dónde se calcula el IVA que muestra el comprobante?
   → En el backend. El frontend solo pinta `venta.iva`.
3. ¿Qué hace `setFormulario(FORMULARIO_VACIO)`?
   → "Restablece" el estado → React vuelve a dibujar el formulario vacío.
4. Si cierro el navegador y vuelvo a abrir la app, ¿sigue mi sesión?
   → Sí, porque el token quedó en localStorage y `auth.jsx` lo valida
     con `GET /api/auth/me` al arrancar.

Continúa con la base de datos: [05-mongodb.md](05-mongodb.md).
