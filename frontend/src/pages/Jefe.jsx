/**
 * Jefe.jsx — La interfaz del JEFE DE VENTAS (módulos 4 y 5).
 *
 * Secciones:
 *   1. CONTROL DE DÍA: botones "Abrir día" / "Cerrar día".
 *      Abrir = se permiten ventas. Cerrar = se impiden (requisito 4.1).
 *   2. PEDIDOS PENDIENTES: los pedidos que los clientes hicieron en
 *      línea. Confirmar = crea las ventas (con folio) y descuenta
 *      stock. Rechazar = anula el pedido.
 *   3. REPORTE DIARIO: todo calculado por el backend leyendo
 *      MongoDB (requisito 5.5). Muestra:
 *        - total de ventas por tipo de documento (5.2)
 *        - desglose por vendedor (5.3)
 *        - neto total, IVA recaudado y total recaudado (5.4)
 *      El jefe puede elegir cualquier fecha (por defecto, hoy).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import * as api from '../api.js'

function hoyLocal() {
  // Fecha de hoy en formato AAAA-MM-DD (lo que espera el backend).
  const d = new Date()
  return d.toLocaleDateString('sv-SE') // sv-SE da formato ISO: 2026-08-17
}

export default function Jefe() {
  const { user, cerrarSesion } = useAuth()

  const [estadoDia, setEstadoDia] = useState('cargando')
  const [fecha, setFecha] = useState(hoyLocal())
  const [reporte, setReporte] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const diaAbierto = estadoDia === 'abierto'

  // Cargamos el estado del día y el reporte de hoy al entrar.
  useEffect(() => {
    api.consultarDia().then((d) => setEstadoDia(d.estado)).catch((e) => setError(e.message))
    api.listarPedidos().then((r) => setPedidos(r.pedidos)).catch(() => {})
  }, [])

  useEffect(() => {
    cargarReporte(fecha)
  }, [fecha])

  const cargarReporte = async (fechaElegida) => {
    setOcupado(true)
    setError('')
    try {
      setReporte(await api.reporteDiario(fechaElegida))
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }

  /** Abre o cierra el día y actualiza la pantalla al instante. */
  const cambiarEstadoDia = async (nuevoEstado) => {
    setOcupado(true)
    setError('')
    try {
      if (nuevoEstado === 'abierto') await api.abrirDia()
      else await api.cerrarDia()
      setEstadoDia(nuevoEstado)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const r = reporte?.resumen
  const formato = (m) => api.formatearDinero(m)

  const pendientes = pedidos.filter((p) => p.estado === 'pendiente')

  /** Confirmar pedido: crea las ventas y descuenta stock (backend). */
  const procesarPedido = async (numero, accion) => {
    setAviso('')
    setError('')
    setOcupado(true)
    try {
      const r = accion === 'confirmar'
        ? await api.confirmarPedido(numero)
        : await api.rechazarPedido(numero)
      setAviso(`✅ ${r.mensaje}`)
      await api.listarPedidos().then((res) => setPedidos(res.pedidos))
      cargarReporte(fecha)   // el reporte cambió (nuevas ventas)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="pagina">
      <header className="barra">
        <h1>🏍️ Panel del Jefe de Ventas</h1>
        <div className="barra-derecha">
          <span>Jefe: <strong>{user?.nombre}</strong></span>
          <Link to="/productos" className="boton-enlace">🏷️ Administrar catálogo</Link>
          <button className="boton-enlace" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <main>
        {aviso && <div className="alerta exito">{aviso}</div>}
        {error && <div className="alerta error">{error}</div>}

        {/* ---------------- CONTROL DE DÍA (módulo 4) ---------------- */}
        <section className="tarjeta control-dia">
          <div>
            <h2>Control del día — {reporte?.fecha || fecha}</h2>
            <p className="pequeno">
              {diaAbierto
                ? 'El día está abierto: los vendedores pueden registrar ventas.'
                : 'El día está cerrado: los vendedores NO pueden vender.'}
            </p>
          </div>
          <div className="acciones-dia">
            <button
              className="boton-primario"
              onClick={() => cambiarEstadoDia('abierto')}
              disabled={diaAbierto || ocupado}
            >
              ☀️ Abrir día
            </button>
            <button
              className="boton-peligro"
              onClick={() => cambiarEstadoDia('cerrado')}
              disabled={!diaAbierto || ocupado}
            >
              🌙 Cerrar día
            </button>
          </div>
        </section>

        {/* ---------------- PEDIDOS ONLINE (módulo extra) ---------------- */}
        <section className="tarjeta">
          <h2>📦 Pedidos online ({pendientes.length} pendientes)</h2>
          {pendientes.length === 0 ? (
            <p className="pequeno">No hay pedidos esperando confirmación.</p>
          ) : (
            <table className="tabla-reporte">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((p) => {
                  const pago = p.pago || {}
                  const textoPago = pago.estado === 'pagado'
                    ? (pago.tarjeta
                        ? `💳 ${pago.tarjeta.marca} •••• ${pago.tarjeta.ultimos4}`
                        : '💳 Pagado')
                    : pago.metodo === 'retiro' ? '💵 Al retirar' : '💳 En proceso'
                  return (
                    <tr key={p.numero}>
                      <td><strong>{p.numero}</strong><small className="bloque">{p.fecha}</small></td>
                      <td>
                        <strong>{p.cliente.nombre}</strong>
                        <small className="bloque">{p.cliente.rut}</small>
                      </td>
                      <td>
                        {p.items.map((i) => (
                          <small key={i.codigo} className="bloque">
                            {i.cantidad}× {i.producto} — {formato(i.total)}
                          </small>
                        ))}
                      </td>
                      <td><small>{textoPago}</small></td>
                      <td><strong>{formato(p.totales.total)}</strong></td>
                      <td>
                        <button
                          className="boton-primario"
                          onClick={() => procesarPedido(p.numero, 'confirmar')}
                          disabled={ocupado}
                        >
                          ✅ Confirmar
                        </button>
                        <button
                          className="boton-peligro"
                          onClick={() => procesarPedido(p.numero, 'rechazar')}
                          disabled={ocupado}
                        >
                          ✖ Rechazar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* ---------------- REPORTE DIARIO (módulo 5) ---------------- */}
        <section className="tarjeta">
          <div className="fila-reporte">
            <h2>Reporte diario de ventas</h2>
            <label className="selector-fecha">
              Fecha:
              <input type="date" value={fecha} max={hoyLocal()} onChange={(e) => setFecha(e.target.value)} />
            </label>
          </div>

          {ocupado && <p>Cargando reporte...</p>}

          {reporte?.mensaje && <p className="alerta aviso">{reporte.mensaje}</p>}

          {r && (
            <>
              {/* 5.2: total por tipo de documento */}
              <h3>Ventas por tipo de documento</h3>
              <div className="tarjetas-resumen">
                <div className="resumen-tarjeta">
                  <strong>{r.total_boletas}</strong>
                  <span>Boletas</span>
                  <small>{formato(r.monto_boletas)}</small>
                </div>
                <div className="resumen-tarjeta">
                  <strong>{r.total_facturas}</strong>
                  <span>Facturas</span>
                  <small>{formato(r.monto_facturas)}</small>
                </div>
                <div className="resumen-tarjeta">
                  <strong>{r.total_ventas}</strong>
                  <span>Ventas totales</span>
                  <small>{formato(r.monto_boletas + r.monto_facturas)}</small>
                </div>
              </div>

              {/* 5.4: netos, IVA y total */}
              <h3>Totales del día</h3>
              <div className="tabla-totales">
                <div className="fila-total">
                  <span>Total neto (sin IVA)</span>
                  <strong>{formato(r.total_neto)}</strong>
                </div>
                <div className="fila-total">
                  <span>IVA recaudado (19%)</span>
                  <strong>{formato(r.total_iva)}</strong>
                </div>
                <div className="fila-total total-grande">
                  <span>Total recaudado</span>
                  <strong>{formato(r.total_recaudado)}</strong>
                </div>
              </div>

              {/* 5.3: desglose por vendedor */}
              <h3>Ventas por vendedor</h3>
              {reporte.por_vendedor.length === 0 ? (
                <p className="alerta aviso">No hay ventas para esta fecha.</p>
              ) : (
                <table className="tabla-reporte">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Ventas</th>
                      <th>Neto</th>
                      <th>IVA</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.por_vendedor.map((v) => (
                      <tr key={v.vendedor}>
                        <td>{v.nombre}</td>
                        <td>{v.cantidad_ventas}</td>
                        <td>{formato(v.monto_neto)}</td>
                        <td>{formato(v.monto_iva)}</td>
                        <td><strong>{formato(v.monto_total)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
