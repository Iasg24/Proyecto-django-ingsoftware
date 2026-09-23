/**
 * Productos.jsx — Administración del catálogo (solo Vendedor y Jefe).
 *
 * CRUD completo contra la API:
 *   Crear   -> POST   /api/productos/
 *   Leer    -> GET    /api/productos/   (lista)
 *   Editar  -> PUT    /api/productos/<codigo>/
 *   Borrar  -> DELETE /api/productos/<codigo>/
 *
 * Fíjate en el patrón del formulario: "editar" carga el producto
 * en el mismo formulario que "crear" (botón cambia de modo).
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../auth.jsx'
import * as api from '../api.js'

const VACIO = { codigo: '', nombre: '', categoria: '', precio: '', stock: '', descripcion: '', imagen: '' }

export default function Productos() {
  const { user, cerrarSesion } = useAuth()
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState(VACIO)
  const [editandoCodigo, setEditandoCodigo] = useState(null) // null = modo crear
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const cargar = () =>
    api.listarProductos().then((r) => setProductos(r.productos)).catch((e) => setError(e.message))

  useEffect(() => {
    cargar()
  }, [])

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    setAviso('')
    setOcupado(true)
    try {
      if (editandoCodigo) {
        await api.editarProducto(editandoCodigo, form)
        setAviso(`✅ Producto ${editandoCodigo} actualizado.`)
      } else {
        await api.crearProducto(form)
        setAviso(`✅ Producto ${form.codigo} creado.`)
      }
      setForm(VACIO)
      setEditandoCodigo(null)
      await cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const empezarEdicion = (p) => {
    setEditandoCodigo(p.codigo)
    setForm({ ...p }) // el formulario se llena con los datos del producto
    setError('')
    setAviso('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicion = () => {
    setEditandoCodigo(null)
    setForm(VACIO)
  }

  const eliminar = async (p) => {
    // window.confirm muestra el diálogo nativo del navegador.
    if (!window.confirm(`¿Eliminar el producto ${p.codigo} (${p.nombre})?`)) return
    setError('')
    try {
      await api.eliminarProducto(p.codigo)
      setAviso(`🗑️ Producto ${p.codigo} eliminado.`)
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="pagina">
      <header className="barra">
        <h1>🏷️ Administrar Catálogo</h1>
        <div className="barra-derecha">
          <span>{user.rol_nombre}: <strong>{user.nombre}</strong></span>
          <button className="boton-enlace" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <main>
        {aviso && <div className="alerta exito">{aviso}</div>}
        {error && <div className="alerta error">{error}</div>}

        {/* ---------- Formulario: crear o editar ---------- */}
        <section className="tarjeta">
          <h2>{editandoCodigo ? `Editando ${editandoCodigo}` : 'Nuevo producto'}</h2>
          <form onSubmit={guardar}>
            <div className="dos-columnas">
              <label>Código
                <input value={form.codigo} onChange={(e) => cambiar('codigo', e.target.value)}
                  placeholder="Ej: A-001" disabled={!!editandoCodigo} required />
              </label>
              <label>Categoría
                <input value={form.categoria} onChange={(e) => cambiar('categoria', e.target.value)}
                  placeholder="Ej: Neumáticos" />
              </label>
              <label>Nombre
                <input value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)}
                  placeholder="Ej: Neumático 120/90-18" required />
              </label>
              <div className="dos-columnas">
                <label>Precio ($)
                  <input type="number" min="1" value={form.precio} onChange={(e) => cambiar('precio', e.target.value)} required />
                </label>
                <label>Stock
                  <input type="number" min="0" value={form.stock} onChange={(e) => cambiar('stock', e.target.value)} required />
                </label>
              </div>
            </div>
            <label>Descripción
              <input value={form.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)}
                placeholder="Breve descripción visible en el catálogo" />
            </label>
            <label>URL de la foto (o /imagenes/codigo.jpg de nuestro servidor)
              <input value={form.imagen} onChange={(e) => cambiar('imagen', e.target.value)}
                placeholder="Ej: /imagenes/A-001.jpg" />
              {form.imagen && <img src={form.imagen} alt="Vista previa" className="mini-foto" />}
            </label>
            <div className="acciones-comprobante">
              {editandoCodigo && (
                <button type="button" className="boton-secundario" onClick={cancelarEdicion}>Cancelar</button>
              )}
              <button className="boton-primario" disabled={ocupado}>
                {editandoCodigo ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </div>
          </form>
        </section>

        {/* ---------- Tabla del catálogo ---------- */}
        <section className="tarjeta">
          <h2>Catálogo actual ({productos.length} productos)</h2>
          <table className="tabla-reporte">
            <thead>
              <tr>
                <th></th>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.codigo}>
                  <td>
                    {p.imagen
                      ? <img src={p.imagen} alt={p.nombre} className="mini-foto" />
                      : <span className="mini-emoji">🏍️</span>}
                  </td>
                  <td>{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>{api.formatearDinero(p.precio)}</td>
                  <td>
                    <span className={`chip ${p.stock > 0 ? 'chip-verde' : 'chip-rojo'}`}>{p.stock}</span>
                  </td>
                  <td>
                    <button className="boton-enlace" onClick={() => empezarEdicion(p)}>✏️ Editar</button>
                    <button className="boton-enlace" onClick={() => eliminar(p)}>🗑️ Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}
