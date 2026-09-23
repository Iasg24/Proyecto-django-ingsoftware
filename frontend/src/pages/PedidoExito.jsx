/**
 * PedidoExito.jsx — La página a la que STRIPE nos devuelve después de pagar.
 *
 * ¿Por qué existe esta página aparte?
 * Porque con Stripe el pago ocurre en checkout.stripe.com, NO en
 * nuestra web. Cuando Stripe termina, nos trae al navegador con la
 * URL: /pedido-exito?numero=P-000X&session_id=cs_test_...
 *
 * Aquí NO confiamos en la URL: llamamos al backend, y el backend
 * le pregunta a Stripe si el pago realmente fue exitoso
 * (completar_pago). Solo entonces el pedido queda 'pagado'.
 *
 * LEER: docs/10-pedidos-y-carrito.md (sección "Pago real con Stripe")
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as api from '../api.js'

export default function PedidoExito() {
  const [params] = useSearchParams()
  const numero = params.get('numero')
  const sessionId = params.get('session_id')

  const [estado, setEstado] = useState('verificando') // verificando | ok | error
  const [pedido, setPedido] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!numero || !sessionId) {
      setEstado('error')
      setMensaje('Falta la información del pago (vuelve al carrito).')
      return
    }
    api
      .completarPago(numero, sessionId)
      .then((r) => {
        setPedido(r.pedido)
        setEstado('ok')
      })
      .catch((e) => {
        setEstado('error')
        setMensaje(e.message)
      })
  }, [numero, sessionId])

  if (estado === 'verificando') {
    return (
      <div className="pagina">
        <div className="tarjeta exito-centro">
          <p>Verificando tu pago con Stripe...</p>
        </div>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="pagina">
        <header className="barra">
          <h1>💳 Pago</h1>
        </header>
        <main>
          <div className="tarjeta exito-centro">
            <div className="alerta error">{mensaje}</div>
            <p>Si el pago fue rechazado o cancelado, puedes intentarlo de nuevo.</p>
            <Link to="/carrito" className="boton-primario">Volver al carrito</Link>
          </div>
        </main>
      </div>
    )
  }

  const pago = pedido.pago || {}
  return (
    <div className="pagina">
      <header className="barra">
        <h1>🛒 Compra realizada</h1>
        <Link to="/catalogo" className="boton-primario">Volver al catálogo</Link>
      </header>
      <main>
        <div className="tarjeta exito-centro">
          <div className="alerta exito">
            ✅ ¡Pago verificado con Stripe! Tu <strong>pedido {pedido.numero}</strong>
            fue recibido (estado: pendiente de confirmación de la tienda).
          </div>
          <p>
            💳 <strong>
              PAGADO con {pago.tarjeta?.marca || 'tarjeta'} •••• {pago.tarjeta?.ultimos4 || '0000'}
            </strong>
          </p>
          <p>La tienda lo revisará y confirmará. Cuando sea confirmado, tus productos se reservarán.</p>

          <table className="tabla-reporte">
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Total</th></tr>
            </thead>
            <tbody>
              {pedido.items.map((i) => (
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
            <div className="fila-total"><span>Neto</span><strong>{api.formatearDinero(pedido.totales.neto)}</strong></div>
            <div className="fila-total"><span>IVA (19%)</span><strong>{api.formatearDinero(pedido.totales.iva)}</strong></div>
            <div className="fila-total total-grande"><span>TOTAL</span><strong>{api.formatearDinero(pedido.totales.total)}</strong></div>
          </div>
        </div>
      </main>
    </div>
  )
}
