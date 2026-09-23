/**
 * Vendedor.jsx — La interfaz del VENDEDOR (módulos 2 y 3 del enunciado).
 *
 * Qué hace esta pantalla:
 *   1. Muestra el estado del día (abierto/cerrado). Si está cerrado,
 *      el formulario queda deshabilitado (requisito 4.2).
 *   2. Formulario de venta: código, nombre, cantidad, precio unitario.
 *   3. Selector Boleta / Factura. Si elige Factura, aparecen los
 *      campos del cliente (requisito 2.4).
 *   4. Botón "Ver comprobante": pide la vista previa al backend
 *      y la muestra ANTES de guardar (módulo 3).
 *   5. Botón "Confirmar venta": guarda en MongoDB.
 *
 * FLUJO COMPLETO DE UNA VENTA (léelo con docs/05-como-se-conectan.md):
 *   Usuario llena el form -> vistaPrevia() -> POST /api/ventas/vista-previa
 *   -> Django calcula neto/IVA/total -> responde JSON -> mostramos
 *   el Comprobante -> si el usuario confirma -> guardarVenta() ->
 *   POST /api/ventas -> Django valida, recalcula y guarda en MongoDB
 *   -> responde con folio -> mostramos "Venta B-0003 registrada".
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import * as api from '../api.js'
import Comprobante from '../components/Comprobante.jsx'

const FORMULARIO_VACIO = {
  // OJO: los nombres de estos campos son el CONTRATO con el backend.
  // Deben ser idénticos a los que lee crear_venta() en el servidor:
  //   codigo, producto, cantidad, precio_unitario, tipo_documento...
  // Si cambias un nombre acá, cambia también allá (y viceversa).
  codigo: '',
  producto: '',
  cantidad: '',
  precio_unitario: '',
  tipo_documento: 'boleta',
  rut: '',
  razon_social: '',
  giro: '',
  direccion: '',
}

export default function Vendedor() {
  const { user, cerrarSesion } = useAuth()

  const [estadoDia, setEstadoDia] = useState('cargando') // cargando | abierto | cerrado
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [preview, setPreview] = useState(null)      // respuesta del backend
  const [guardada, setGuardada] = useState(null)    // venta confirmada
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  // Datos del catálogo (para el selector de producto) y del cliente buscado:
  const [productos, setProductos] = useState([])
  const [avisoCliente, setAvisoCliente] = useState('')

  const esFactura = formulario.tipo_documento === 'factura'
  const diaAbierto = estadoDia === 'abierto'

  // Al entrar a la pantalla, preguntamos al backend si el día está abierto
  // y cargamos el catálogo (para el selector de producto).
  useEffect(() => {
    api
      .consultarDia()
      .then((d) => setEstadoDia(d.estado))
      .catch((e) => setError(e.message))
    api
      .listarProductos()
      .then((r) => setProductos(r.productos))
      .catch(() => {})
  }, [])

  /** Al elegir un producto del catálogo, autocompletamos código,
   *  nombre y precio. El vendedor solo escribe la cantidad. */
  const elegirProducto = (codigo) => {
    const p = productos.find((x) => x.codigo === codigo)
    if (!p) return
    setFormulario((f) => ({
      ...f,
      codigo: p.codigo,
      producto: p.nombre,
      precio_unitario: String(p.precio),
    }))
    setPreview(null)
    setGuardada(null)
  }

  /** Busca un cliente registrado por RUT y autocompleta los datos
   *  de la factura (así comprar "la próxima vez" es más rápido). */
  const buscarClienteRegistrado = async () => {
    const rut = formulario.rut.trim()
    if (!rut) {
      setAvisoCliente('Escribe un RUT para buscar.')
      return
    }
    setError('')
    setAvisoCliente('')
    try {
      const r = await api.buscarCliente(rut)
      if (!r.encontrado) {
        setAvisoCliente(`El RUT ${rut} no está registrado. Completa los datos a mano.`)
        return
      }
      const c = r.cliente
      setFormulario((f) => ({
        ...f,
        razon_social: c.nombre,      // el nombre del cliente es su "razón social"
        giro: c.giro || '',
        direccion: c.direccion || '',
      }))
      setAvisoCliente(`✅ Cliente encontrado: ${c.nombre}. Datos autocompletados.`)
    } catch (err) {
      setError(err.message)
    }
  }

  const cambiarCampo = (campo, valor) => {
    setFormulario((f) => ({ ...f, [campo]: valor }))
    setPreview(null)   // si cambia algo, la vista previa queda desactualizada
    setGuardada(null)
  }

  /** Pide la vista previa al backend (NO guarda nada todavía). */
  const generarVistaPrevia = async (e) => {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      const respuesta = await api.vistaPrevia(formulario)
      setPreview(respuesta.vista_previa)
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  /** Confirma y GUARDA la venta en la base de datos. */
  const confirmarVenta = async () => {
    setError('')
    setOcupado(true)
    try {
      const respuesta = await api.guardarVenta(formulario)
      setGuardada(respuesta.venta)
      setPreview(null)
      setFormulario(FORMULARIO_VACIO)   // limpiamos el formulario
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="pagina">
      <header className="barra">
        <h1>🏍️ Registrar Venta</h1>
        <div className="barra-derecha">
          <span>Vendedor: <strong>{user?.nombre}</strong></span>
          <span className={`chip ${diaAbierto ? 'chip-verde' : 'chip-rojo'}`}>
            Día {diaAbierto ? 'ABIERTO' : 'CERRADO'}
          </span>
          <Link to="/productos" className="boton-enlace">🏷️ Administrar catálogo</Link>
          <button className="boton-enlace" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <main>
        {estadoDia === 'cerrado' && (
          <div className="alerta aviso">
            🔒 El día está <strong>cerrado</strong>. No se pueden registrar ventas.
            Pide al Jefe de Ventas que abra el día.
          </div>
        )}

        {/* ---------------- FORMULARIO DE VENTA ---------------- */}
        <form onSubmit={generarVistaPrevia} className={`formulario-venta ${diaAbierto ? '' : 'deshabilitado'}`}>
          <h2>Nueva venta</h2>

          {/* Selector del catálogo: autocompleta código, nombre y precio. */}
          <label>
            Producto del catálogo (opcional: autocompleta los datos)
            <select value={formulario.codigo} onChange={(e) => elegirProducto(e.target.value)}>
              <option value="">— Elegir del catálogo —</option>
              {productos.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.codigo} · {p.nombre} · ${p.precio}
                </option>
              ))}
            </select>
          </label>

          <div className="dos-columnas">
            <label>
              Código del producto
              <input
                type="text"
                value={formulario.codigo}
                onChange={(e) => cambiarCampo('codigo', e.target.value)}
                placeholder="Ej: A-001"
                required
              />
            </label>
            <label>
              Nombre del producto
              <input
                type="text"
                value={formulario.producto}
                onChange={(e) => cambiarCampo('producto', e.target.value)}
                placeholder="Ej: Neumático 120/90-18"
                required
              />
            </label>
            <label>
              Cantidad vendida
              <input
                type="number"
                min="1"
                value={formulario.cantidad}
                onChange={(e) => cambiarCampo('cantidad', e.target.value)}
                placeholder="Ej: 2"
                required
              />
            </label>
            <label>
              Precio unitario ($)
              <input
                type="number"
                min="1"
                step="any"
                value={formulario.precio_unitario}
                onChange={(e) => cambiarCampo('precio_unitario', e.target.value)}
                placeholder="Ej: 25000"
                required
              />
            </label>
          </div>

          {/* ---------------- TIPO DE DOCUMENTO ---------------- */}
          <fieldset>
            <legend>Tipo de documento (requisito 2.3)</legend>
            <div className="opciones-documento">
              <label className="radio-tarjeta">
                <input
                  type="radio"
                  name="tipo_documento"
                  value="boleta"
                  checked={formulario.tipo_documento === 'boleta'}
                  onChange={(e) => cambiarCampo('tipo_documento', e.target.value)}
                />
                <span>🧾 Boleta</span>
              </label>
              <label className="radio-tarjeta">
                <input
                  type="radio"
                  name="tipo_documento"
                  value="factura"
                  checked={formulario.tipo_documento === 'factura'}
                  onChange={(e) => cambiarCampo('tipo_documento', e.target.value)}
                />
                <span>📄 Factura</span>
              </label>
            </div>
          </fieldset>

          {/* ---------------- DATOS DEL CLIENTE (solo factura) ---------------- */}
          {esFactura && (
            <fieldset className="datos-factura">
              <legend>Datos del cliente (obligatorios para factura)</legend>

              {/* Atajo: si el cliente se registró, el RUT autocompleta todo. */}
              <div className="busqueda-cliente">
                <label>
                  RUT del cliente
                  <input type="text" value={formulario.rut}
                    onChange={(e) => cambiarCampo('rut', e.target.value)}
                    placeholder="Ej: 76.543.210-5" required />
                </label>
                <button type="button" className="boton-secundario" onClick={buscarClienteRegistrado}>
                  🔍 Buscar cliente registrado
                </button>
              </div>
              {avisoCliente && <p className="pequeno">{avisoCliente}</p>}

              <div className="dos-columnas">
                <label>
                  Razón social
                  <input type="text" value={formulario.razon_social}
                    onChange={(e) => cambiarCampo('razon_social', e.target.value)}
                    placeholder="Ej: Motos del Sur SpA" required />
                </label>
                <label>
                  Giro
                  <input type="text" value={formulario.giro}
                    onChange={(e) => cambiarCampo('giro', e.target.value)}
                    placeholder="Ej: Comercio de repuestos" required />
                </label>
                <label>
                  Dirección
                  <input type="text" value={formulario.direccion}
                    onChange={(e) => cambiarCampo('direccion', e.target.value)}
                    placeholder="Ej: Av. Brasil 1200" required />
                </label>
              </div>
            </fieldset>
          )}

          {error && <div className="alerta error">{error}</div>}

          <button type="submit" className="boton-primario" disabled={!diaAbierto || ocupado}>
            {ocupado ? 'Calculando...' : 'Ver comprobante'}
          </button>
        </form>

        {/* ---------------- VISTA PREVIA (módulo 3) ---------------- */}
        {preview && (
          <section className="seccion-comprobante">
            <h2>Vista previa del comprobante</h2>
            <Comprobante venta={preview} />
            <div className="acciones-comprobante">
              <button className="boton-secundario" onClick={() => setPreview(null)}>
                Editar venta
              </button>
              <button className="boton-primario" onClick={confirmarVenta} disabled={ocupado}>
                ✅ Confirmar y guardar venta
              </button>
            </div>
          </section>
        )}

        {/* ---------------- VENTA GUARDADA ---------------- */}
        {guardada && (
          <section className="seccion-exito">
            <div className="alerta exito">
              🎉 ¡Venta <strong>{guardada.folio}</strong> registrada en la base de datos!
            </div>
            <Comprobante venta={guardada} />
          </section>
        )}
      </main>
    </div>
  )
}
