/**
 * Catalogo.jsx — LA VITRINA del bazar (página PÚBLICA).
 *
 * Cualquier persona puede entrar a /catalogo sin iniciar sesión.
 * El backend la sirve con GET /api/productos/ que no pide token.
 *
 * Si el visitante es un CLIENTE registrado (inició sesión), además
 * ve una sección "Mis datos" donde puede revisar y actualizar la
 * información guardada (así compra más rápido la próxima vez).
 *
 * LEER: docs/09-catalogo-y-clientes.md
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { useCarrito } from '../carrito.jsx'
import * as api from '../api.js'

// Emoji por categoría: se usa SOLO si el producto no tiene foto real.
const EMOJIS = {
  Neumáticos: '🛞',
  Eléctricos: '🔋',
  Seguridad: '🪖',
  Lubricantes: '🛢️',
  Transmisión: '⛓️',
  Mantenimiento: '🛠️',
  Indumentaria: '🧥',
  Frenos: '🛑',
  General: '🏍️',
}

export default function Catalogo() {
  const { user, cerrarSesion } = useAuth()
  const { unidades, agregar } = useCarrito()
  const [productos, setProductos] = useState([])
  const [error, setError] = useState('')
  const [misDatos, setMisDatos] = useState(null)
  const [editando, setEditando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [agregado, setAgregado] = useState('')   // mensaje al agregar al carro

  const esCliente = user?.rol === 'cliente'

  // Cargar el catálogo (siempre, público).
  useEffect(() => {
    api.listarProductos().then((r) => setProductos(r.productos)).catch((e) => setError(e.message))
  }, [])

  // Si hay un cliente logueado, cargar también sus datos guardados.
  useEffect(() => {
    if (esCliente) {
      api.obtenerMisDatos().then((r) => setMisDatos(r.cliente)).catch(() => {})
    }
  }, [esCliente])

  const guardarMisDatos = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const r = await api.actualizarMisDatos(misDatos)
      setMisDatos(r.cliente)
      setEditando(false)
      setAviso('✅ Tus datos fueron actualizados.')
    } catch (err) {
      setError(err.message)
    }
  }

  const cambiarDato = (campo, valor) => setMisDatos((d) => ({ ...d, [campo]: valor }))

  const agregarProducto = (p) => {
    if (p.stock <= 0) return
    agregar(p.codigo)
    setAgregado(`✅ ${p.nombre} agregado al carro`)
    setTimeout(() => setAgregado(''), 2000)   // el aviso desaparece solo
  }

  return (
    <div className="pagina">
      <header className="barra">
        <h1>🏍️ Catálogo de Repuestos</h1>
        <div className="barra-derecha">
          {/* Badge del carro: visible para todos (comprar no exige login) */}
          <Link to="/carrito" className="boton-carrito">
            🛒 Carro{unidades > 0 ? ` (${unidades})` : ''}
          </Link>
          {user ? (
            <>
              <span>{esCliente ? 'Cliente' : user.rol_nombre}: <strong>{user.nombre}</strong></span>
              <button className="boton-enlace" onClick={cerrarSesion}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/registro" className="boton-secundario">Crear cuenta</Link>
              <Link to="/" className="boton-primario">Iniciar sesión</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <p className="pequeno">Todos los precios incluyen IVA 19%. Stock actualizado por nuestro equipo.</p>

        {agregado && <div className="alerta exito">{agregado}</div>}
        {error && <div className="alerta error">{error}</div>}

        {/* ---------- Grilla de productos ---------- */}
        <div className="grilla-catalogo">
          {productos.map((p) => (
            <div key={p.codigo} className="tarjeta-producto">
              {/* Foto real si existe; si no, emoji de la categoría. */}
              {p.imagen ? (
                <img src={p.imagen} alt={p.nombre} className="foto-producto" />
              ) : (
                <div className="producto-emoji">{EMOJIS[p.categoria] || '🏍️'}</div>
              )}
              <span className="producto-codigo">{p.codigo}</span>
              <h3>{p.nombre}</h3>
              <p className="producto-categoria">{p.categoria}</p>
              <p className="producto-descripcion">{p.descripcion}</p>
              <div className="producto-pie">
                <strong>{api.formatearDinero(p.precio)}</strong>
                <span className={p.stock > 0 ? 'stock chip-verde' : 'stock chip-rojo'}>
                  {p.stock > 0 ? `${p.stock} disponibles` : 'Sin stock'}
                </span>
              </div>
              <button
                className="boton-primario boton-agregar"
                onClick={() => agregarProducto(p)}
                disabled={p.stock <= 0}
              >
                {p.stock > 0 ? '🛒 Agregar al carro' : 'Agotado'}
              </button>
            </div>
          ))}
        </div>

        {/* ---------- Solo clientes registrados: sus datos guardados ---------- */}
        {esCliente && misDatos && (
          <section className="tarjeta">
            <div className="fila-reporte">
              <h2>Mis datos guardados</h2>
              <small className="pequeno">
                El vendedor los usa para completar tu factura más rápido.
              </small>
            </div>

            {aviso && <div className="alerta exito">{aviso}</div>}

            {editando ? (
              <form onSubmit={guardarMisDatos}>
                <div className="dos-columnas">
                  <label>Nombre
                    <input value={misDatos.nombre} onChange={(e) => cambiarDato('nombre', e.target.value)} required />
                  </label>
                  <label>RUT
                    <input value={misDatos.rut} onChange={(e) => cambiarDato('rut', e.target.value)} required />
                  </label>
                  <label>Email
                    <input type="email" value={misDatos.email} onChange={(e) => cambiarDato('email', e.target.value)} required />
                  </label>
                  <label>Teléfono
                    <input value={misDatos.telefono} onChange={(e) => cambiarDato('telefono', e.target.value)} />
                  </label>
                  <label>Dirección
                    <input value={misDatos.direccion} onChange={(e) => cambiarDato('direccion', e.target.value)} />
                  </label>
                  <label>Giro
                    <input value={misDatos.giro || ''} onChange={(e) => cambiarDato('giro', e.target.value)} />
                  </label>
                </div>
                <div className="acciones-comprobante">
                  <button type="button" className="boton-secundario" onClick={() => setEditando(false)}>Cancelar</button>
                  <button className="boton-primario">Guardar cambios</button>
                </div>
              </form>
            ) : (
              <div className="datos-cliente">
                <p><strong>Nombre:</strong> {misDatos.nombre}</p>
                <p><strong>RUT:</strong> {misDatos.rut}</p>
                <p><strong>Email:</strong> {misDatos.email}</p>
                <p><strong>Teléfono:</strong> {misDatos.telefono || '—'}</p>
                <p><strong>Dirección:</strong> {misDatos.direccion || '—'}</p>
                <p><strong>Giro:</strong> {misDatos.giro || '—'}</p>
                <button className="boton-secundario" onClick={() => setEditando(true)}>Editar mis datos</button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
