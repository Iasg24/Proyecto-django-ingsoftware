/**
 * api.js — La "secretaría de comunicaciones" del frontend.
 *
 * Aquí está TODO el contacto con el backend. Ningún otro archivo
 * llama a fetch() directamente: todos pasan por estas funciones.
 *
 * ¿Cómo viaja una petición? (concepto clave)
 *   1. fetch('/api/auth/login', {...})  -> el navegador arma un
 *      sobre HTTP con método POST y cuerpo JSON.
 *   2. Vite (proxy) lo reenvía a Django en el puerto 8000.
 *   3. Django ejecuta la vista correspondiente.
 *   4. Django responde con un sobre HTTP: código de estado
 *      (200 OK, 400 error del cliente, 401 sin sesión...) + JSON.
 *   5. fetch() recibe la respuesta y nosotros la convertimos en
 *      objeto de JavaScript con .json().
 *
 * LEER: docs/05-como-se-conectan.md (el viaje completo de una venta)
 */

// URL base de la API. Como usamos el proxy de Vite, basta con "/api".
const API = '/api'

// ---------------------------------------------------------------------------
// El TOKEN de sesión se guarda en localStorage (memoria persistente
// del navegador). Cada petición lo manda en la cabecera Authorization.
// ---------------------------------------------------------------------------
function getToken() {
  return localStorage.getItem('token')
}

function cabeceras(conCuerpo = true) {
  const headers = {}
  if (conCuerpo) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers['Authorization'] = `Token ${token}`
  return headers
}

/**
 * función interna: ejecuta fetch() y devuelve el JSON parseado.
 * Si el servidor responde con un error (4xx/5xx), lanza una
 * excepción con el mensaje para que la página lo muestre.
 */
async function peticion(url, metodo, cuerpo) {
  const options = {
    method: metodo,
    headers: cabeceras(cuerpo !== undefined),
  }
  if (cuerpo !== undefined) {
    options.body = JSON.stringify(cuerpo)
  }

  const respuesta = await fetch(`${API}${url}`, options)
  const datos = await respuesta.json()

  if (!respuesta.ok) {
    // El backend nos manda mensajes como {error: "..."} o
    // {errores: [...]}. Los convertimos en texto legible.
    const mensaje = datos.error || (datos.errores || []).join(' ') ||
                    `Error ${respuesta.status}`
    throw new Error(mensaje)
  }
  return datos
}

// ---------------------------------------------------------------------------
// Funciones públicas: una por cada endpoint del backend.
// ---------------------------------------------------------------------------

// --- Autenticación ---
export function login(usuario, password) {
  return peticion('/auth/login', 'POST', { usuario, password })
}

export function logout() {
  return peticion('/auth/logout', 'POST')
}

export function obtenerUsuario() {
  return peticion('/auth/me', 'GET')
}

// --- Control de día ---
export function consultarDia() {
  return peticion('/ventas/dia', 'GET')
}

export function abrirDia() {
  return peticion('/ventas/dia/abrir', 'POST')
}

export function cerrarDia() {
  return peticion('/ventas/dia/cerrar', 'POST')
}

// --- Ventas ---
export function vistaPrevia(datosVenta) {
  return peticion('/ventas/vista-previa', 'POST', datosVenta)
}

export function guardarVenta(datosVenta) {
  return peticion('/ventas/', 'POST', datosVenta)
}

// --- Reportes ---
export function reporteDiario(fecha) {
  const query = fecha ? `?fecha=${fecha}` : ''
  return peticion(`/ventas/reporte/diario${query}`, 'GET')
}

// --- Catálogo de productos (GET es público; el resto vendedor/jefe) ---
export function listarProductos() {
  return peticion('/productos/', 'GET')
}

export function crearProducto(datos) {
  return peticion('/productos/', 'POST', datos)
}

export function editarProducto(codigo, datos) {
  return peticion(`/productos/${encodeURIComponent(codigo)}/`, 'PUT', datos)
}

export function eliminarProducto(codigo) {
  return peticion(`/productos/${encodeURIComponent(codigo)}/`, 'DELETE')
}

// --- Clientes ---
export function registrarCliente(datos) {
  return peticion('/clientes/registro', 'POST', datos)
}

export function buscarCliente(rut) {
  return peticion(`/clientes/buscar?rut=${encodeURIComponent(rut)}`, 'GET')
}

export function obtenerMisDatos() {
  return peticion('/clientes/me', 'GET')
}

export function actualizarMisDatos(datos) {
  return peticion('/clientes/me', 'PUT', datos)
}

// --- Pedidos (compra online) ---
export function crearPedido(items, cliente, pago) {
  return peticion('/pedidos/', 'POST', { items, cliente, pago })
}

export function listarPedidos(estado) {
  const query = estado ? `?estado=${estado}` : ''
  return peticion(`/pedidos/${query}`, 'GET')
}

export function confirmarPedido(numero) {
  return peticion(`/pedidos/${numero}/confirmar`, 'POST')
}

export function rechazarPedido(numero) {
  return peticion(`/pedidos/${numero}/rechazar`, 'POST')
}

/** Verifica el pago al volver de la página de Stripe. */
export function completarPago(numero, sessionId) {
  return peticion(`/pedidos/${numero}/completar-pago`, 'POST', { session_id: sessionId })
}

/** Formatea un número como dinero chileno: 89250 -> "$89.250" */
export function formatearDinero(monto) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto)
}
