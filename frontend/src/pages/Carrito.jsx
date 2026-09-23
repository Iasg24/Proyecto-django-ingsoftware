/**
 * Carrito.jsx — El carro de compras y el "PAGAR" (crear pedido).
 *
 * Secciones:
 *   1. Líneas del carro: foto, nombre, precio, cantidad (+/-), quitar.
 *   2. Totales (neto/IVA/total): los muestra el frontend SOLO como
 *      adelanto visual; el backend recalcula todo al crear el pedido
 *      (regla de oro: el dinero se calcula en el servidor).
 *   3. Datos de entrega: si el cliente está registrado se autocompletan;
 *      si no, puede comprar como "invitado".
 *   4. MÉTODO DE PAGO:
 *      - Tarjeta: el formulario se valida (Luhn, CVV, vencimiento) y el
 *        backend decide: con llaves de Stripe configuradas, redirige a
 *        la página oficial de pago; sin llaves, usa la pasarela simulada.
 *      - Transferencia / Efectivo al retirar: se registran sin tarjeta.
 *   5. "Pagar" -> POST /api/pedidos/ -> pedido P-000X pendiente.
 *
 * LEER: docs/10-pedidos-y-carrito.md
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { useCarrito } from '../carrito.jsx'
import * as api from '../api.js'

const EMOJIS = {
  Neumáticos: '🛞', Eléctricos: '🔋', Seguridad: '🪖', Lubricantes: '🛢️',
  Transmisión: '⛓️', Mantenimiento: '🛠️', Indumentaria: '🧥', Frenos: '🛑', General: '🏍️',
}

// Estado inicial del formulario de tarjeta (los datos se validan en el
// servidor; aquí solo damos feedback visual rápido).
const TARJETA_VACIA = { numero: '', titular: '', mes: '', anio: '', cvv: '' }

export default function Carrito() {
  const { user } = useAuth()
  const { carro, unidades, cambiar, quitar, vaciar } = useCarrito()

  const [productos, setProductos] = useState([])   // catálogo (para precios/nombres)
  const [cliente, setCliente] = useState({ nombre: '', email: '', rut: '', direccion: '' })
  const [metodoPago, setMetodoPago] = useState('tarjeta')
  const [tarjeta, setTarjeta] = useState(TARJETA_VACIA)
  const [pedidoCreado, setPedidoCreado] = useState(null)  // pedido confirmado en pantalla
  const [avisoPago, setAvisoPago] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const esClienteRegistrado = user?.rol === 'cliente'

  // Cargamos el catálogo (precios reales de la base) y, si el cliente
  // está registrado, sus datos guardados para autocompletar.
  useEffect(() => {
    api.listarProductos().then((r) => setProductos(r.productos)).catch((e) => setError(e.message))
    if (esClienteRegistrado) {
      api.obtenerMisDatos()
        .then((r) => setCliente({
          nombre: r.cliente.nombre,
          email: r.cliente.email,
          rut: r.cliente.rut,
          direccion: r.cliente.direccion || '',
        }))
        .catch(() => {})
    }
  }, [esClienteRegistrado])

  // Unimos el carro (codigo -> cantidad) con los datos del catálogo.
  const lineas = Object.entries(carro)
    .map(([codigo, cantidad]) => {
      const p = productos.find((x) => x.codigo === codigo)
      return p ? { ...p, cantidad } : null
    })
    .filter(Boolean)

  // Totales de VISTA: solo para mostrar. El backend recalcula al pagar.
  const netoVista = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0)
  const ivaVista = netoVista * 0.19

  const confirmarPedido = async (e) => {
    e.preventDefault()
    setError('')
    setAvisoPago('')
    setOcupado(true)
    try {
      // El pago viaja al backend: él decide entre Stripe (si hay llaves)
      // o la pasarela simulada, y NUNCA confía en nuestros totales.
      const pago = { metodo: metodoPago, ...tarjeta }
      const items = lineas.map((l) => ({ codigo: l.codigo, cantidad: l.cantidad }))
      const respuesta = await api.crearPedido(items, cliente, pago)

      if (respuesta.stripe_url) {
        // Stripe está configurado: el cliente es redirigido a la página
        // oficial de pago. Al terminar, Stripe nos devuelve a
        // /pedido-exito, donde verificamos el pago con el backend.
        window.location.href = respuesta.stripe_url
        return
      }

      setPedidoCreado(respuesta.pedido)
      vaciar()   // la compra ya quedó registrada; el carro se limpia
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const cambiarCliente = (campo, valor) => setCliente((c) => ({ ...c, [campo]: valor }))
  const cambiarTarjeta = (campo, valor) => setTarjeta((t) => ({ ...t, [campo]: valor }))

  /** Texto legible del pago para la pantalla de éxito. */
  const textoPago = (p) => {
    if (p.estado === 'pagado') {
      if (p.metodo === 'tarjeta' && p.tarjeta) {
        return `PAGADO con ${p.tarjeta.marca} •••• ${p.tarjeta.ultimos4}`
      }
      if (p.metodo === 'tarjeta') return 'PAGADO con tarjeta (Stripe)'
      if (p.metodo === 'transferencia') return 'PAGADO por transferencia'
    }
    return 'Pendiente — pagarás al retirar'
  }

  // ---------- Pantalla de éxito ----------
  if (pedidoCreado) {
    const pago = pedidoCreado.pago || {}
    return (
      <div className="pagina">
        <header className="barra">
          <h1>🛒 Compra realizada</h1>
          <Link to="/catalogo" className="boton-primario">Volver al catálogo</Link>
        </header>
        <main>
          <div className="tarjeta exito-centro">
            <div className="alerta exito">
              🎉 ¡Gracias por tu compra! Tu <strong>pedido {pedidoCreado.numero}</strong>
              fue recibido (estado: pendiente).
            </div>
            <p>
              💳 <strong>{textoPago(pago)}</strong>
            </p>
            <p>
              La tienda lo revisará y confirmará. Cuando sea confirmado, tus productos
              se reservarán y podrás retirarlos.
            </p>
            <table className="tabla-reporte">
              <thead>
                <tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Total</th></tr>
              </thead>
              <tbody>
                {pedidoCreado.items.map((i) => (
                  <tr key={i.codigo}>
                    <td>{i.producto}</td>
                    <td>{i.cantidad}</td>
                    <td>{api.formatearDinero(i.precio_unitario)}</td>
                    <td>{api.formatearDinero(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tabla-totales">
              <div className="fila-total"><span>Neto</span><strong>{api.formatearDinero(pedidoCreado.totales.neto)}</strong></div>
              <div className="fila-total"><span>IVA (19%)</span><strong>{api.formatearDinero(pedidoCreado.totales.iva)}</strong></div>
              <div className="fila-total total-grande"><span>TOTAL</span><strong>{api.formatearDinero(pedidoCreado.totales.total)}</strong></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ---------- Carro vacío ----------
  if (lineas.length === 0) {
    return (
      <div className="pagina">
        <header className="barra">
          <h1>🛒 Tu carro</h1>
        </header>
        <main>
          <div className="tarjeta exito-centro">
            <p>Tu carro está vacío.</p>
            <Link to="/catalogo" className="boton-primario">Ir al catálogo</Link>
          </div>
        </main>
      </div>
    )
  }

  // ---------- Carro con productos ----------
  return (
    <div className="pagina">
      <header className="barra">
        <h1>🛒 Tu carro ({unidades} {unidades === 1 ? 'producto' : 'productos'})</h1>
        <div className="barra-derecha">
          <Link to="/catalogo" className="boton-enlace">← Seguir comprando</Link>
        </div>
      </header>

      <main>
        <section className="tarjeta">
          <table className="tabla-reporte">
            <thead>
              <tr><th></th><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
            </thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={l.codigo}>
                  <td>
                    {l.imagen
                      ? <img src={l.imagen} alt={l.nombre} className="mini-foto" />
                      : <span className="mini-emoji">{EMOJIS[l.categoria] || '🏍️'}</span>}
                  </td>
                  <td>
                    <strong>{l.nombre}</strong>
                    <small className="bloque">{l.codigo}</small>
                  </td>
                  <td>{api.formatearDinero(l.precio)}</td>
                  <td>
                    <div className="stepper">
                      <button type="button" onClick={() => cambiar(l.codigo, l.cantidad - 1)}>−</button>
                      <span>{l.cantidad}</span>
                      <button type="button" onClick={() => cambiar(l.codigo, l.cantidad + 1)}>+</button>
                    </div>
                  </td>
                  <td><strong>{api.formatearDinero(l.precio * l.cantidad)}</strong></td>
                  <td>
                    <button className="boton-enlace" onClick={() => quitar(l.codigo)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="tabla-totales">
            <div className="fila-total"><span>Neto (sin IVA)</span><strong>{api.formatearDinero(netoVista)}</strong></div>
            <div className="fila-total"><span>IVA (19%)</span><strong>{api.formatearDinero(ivaVista)}</strong></div>
            <div className="fila-total total-grande"><span>TOTAL</span><strong>{api.formatearDinero(netoVista + ivaVista)}</strong></div>
            <small className="pequeno">El total exacto lo calcula el servidor al confirmar el pedido.</small>
          </div>
        </section>

        {/* ---------- Datos de entrega + pagar ---------- */}
        <section className="tarjeta">
          <h2>Datos de entrega</h2>
          {esClienteRegistrado && (
            <p className="pequeno">
              ✅ Completamos con tus datos guardados ({user.nombre}).
              ¿Quieres cambiarlos? <Link to="/catalogo">Edita "Mis datos"</Link>.
            </p>
          )}
          <form onSubmit={confirmarPedido}>
            <div className="dos-columnas">
              <label>Nombre
                <input value={cliente.nombre} onChange={(e) => cambiarCliente('nombre', e.target.value)} required />
              </label>
              <label>Email
                <input type="email" value={cliente.email} onChange={(e) => cambiarCliente('email', e.target.value)} required />
              </label>
              <label>RUT
                <input value={cliente.rut} onChange={(e) => cambiarCliente('rut', e.target.value)} required />
              </label>
              <label>Dirección de entrega
                <input value={cliente.direccion} onChange={(e) => cambiarCliente('direccion', e.target.value)} required />
              </label>
            </div>

            {/* ---------- MÉTODO DE PAGO ---------- */}
            <fieldset>
              <legend>Método de pago</legend>
              <div className="opciones-documento">
                <label className="radio-tarjeta">
                  <input type="radio" name="pago" value="tarjeta"
                    checked={metodoPago === 'tarjeta'}
                    onChange={(e) => setMetodoPago(e.target.value)} />
                  <span>💳 Tarjeta</span>
                </label>
                <label className="radio-tarjeta">
                  <input type="radio" name="pago" value="transferencia"
                    checked={metodoPago === 'transferencia'}
                    onChange={(e) => setMetodoPago(e.target.value)} />
                  <span>🏦 Transferencia</span>
                </label>
                <label className="radio-tarjeta">
                  <input type="radio" name="pago" value="retiro"
                    checked={metodoPago === 'retiro'}
                    onChange={(e) => setMetodoPago(e.target.value)} />
                  <span>💵 Efectivo al retirar</span>
                </label>
              </div>

              {metodoPago === 'tarjeta' && (
                <div className="tarjeta-form">
                  <label>Número de tarjeta
                    <input value={tarjeta.numero} onChange={(e) => cambiarTarjeta('numero', e.target.value)}
                      placeholder="4242 4242 4242 4242" required />
                  </label>
                  <label>Titular
                    <input value={tarjeta.titular} onChange={(e) => cambiarTarjeta('titular', e.target.value)}
                      placeholder="Nombre como aparece en la tarjeta" required />
                  </label>
                  <div className="dos-columnas">
                    <label>Mes
                      <input value={tarjeta.mes} onChange={(e) => cambiarTarjeta('mes', e.target.value)}
                        placeholder="12" required />
                    </label>
                    <label>Año
                      <input value={tarjeta.anio} onChange={(e) => cambiarTarjeta('anio', e.target.value)}
                        placeholder="2029" required />
                    </label>
                  </div>
                  <label>CVV
                    <input value={tarjeta.cvv} onChange={(e) => cambiarTarjeta('cvv', e.target.value)}
                      placeholder="123" required />
                  </label>
                  <p className="pequeno">
                    Tarjeta de prueba: <strong>4242 4242 4242 4242</strong>, cualquier fecha
                    futura y CVV. Si la tienda tiene Stripe configurado, serás redirigido
                    a la página oficial de pago; si no, el pago se simula localmente.
                  </p>
                </div>
              )}

              {metodoPago === 'transferencia' && (
                <p className="pequeno">
                  🏦 Realiza la transferencia a la cuenta <strong>Bancolito 11-111-11</strong> con
                  tu número de pedido como referencia. Se marca como pagado automáticamente
                  (simulado).
                </p>
              )}

              {metodoPago === 'retiro' && (
                <p className="pequeno">
                  💵 Pagas en efectivo cuando retiras el pedido en la tienda.
                </p>
              )}
            </fieldset>

            {avisoPago && <div className="alerta aviso">{avisoPago}</div>}
            {error && <div className="alerta error">{error}</div>}

            <div className="acciones-comprobante">
              <button type="submit" className="boton-primario" disabled={ocupado}>
                {ocupado ? 'Procesando pago...' : '💰 Pagar'}
              </button>
            </div>
            <p className="pequeno">
              Al pagar se crea un pedido pendiente que la tienda debe aprobar.
            </p>
          </form>
        </section>
      </main>
    </div>
  )
}
