/**
 * Comprobante.jsx — La VISTA PREVIA del documento (boleta o factura).
 *
 * Este componente NO hace cálculos ni guarda nada: solo pinta
 * los datos que el backend calculó (vista-previa) o guardó (venta).
 *
 * Fíjate que la boleta y la factura se ven casi iguales; la
 * diferencia es que la factura incluye la caja "Cliente" con
 * RUT, razón social, giro y dirección.
 *
 * LEER: docs/03-frontend.md (sección "Vista previa del comprobante")
 */
import { formatearDinero } from '../api.js'

export default function Comprobante({ venta }) {
  const esFactura = venta.tipo_documento === 'factura'

  return (
    <div className={`comprobante ${esFactura ? 'factura' : 'boleta'}`}>
      {/* Encabezado del documento */}
      <div className="comprobante-cabecera">
        <div>
          <h3>Bazar de Repuestos</h3>
          <p className="pequeno">Av. Siempre Viva 123, Chile</p>
          <p className="pequeno">RUT 11.111.111-1</p>
        </div>
        <div className="comprobante-tipo">
          <strong>{esFactura ? 'FACTURA' : 'BOLETA'}</strong>
          <p className="pequeno">Folio: {venta.folio || '—'}</p>
          <p className="pequeno">Fecha: {venta.fecha}</p>
          <p className="pequeno">Hora: {venta.hora || ''}</p>
        </div>
      </div>

      {/* Solo las facturas llevan datos del cliente */}
      {esFactura && venta.cliente && (
        <div className="comprobante-cliente">
          <h4>Datos del Cliente</h4>
          <p>RUT: {venta.cliente.rut}</p>
          <p>Razón social: {venta.cliente.razon_social}</p>
          <p>Giro: {venta.cliente.giro}</p>
          <p>Dirección: {venta.cliente.direccion}</p>
        </div>
      )}

      {/* Detalle del producto vendido */}
      <table className="comprobante-tabla">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Cant.</th>
            <th>P. Unitario</th>
            <th>Neto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{venta.codigo_producto}</td>
            <td>{venta.producto}</td>
            <td>{venta.cantidad}</td>
            <td>{formatearDinero(venta.precio_unitario)}</td>
            <td>{formatearDinero(venta.neto)}</td>
          </tr>
        </tbody>
      </table>

      {/* Totales: IVA 19% y total. Estos valores YA vienen calculados
          por el backend (el frontend nunca calcula dinero por su cuenta). */}
      <div className="comprobante-totales">
        <p>Neto: <span>{formatearDinero(venta.neto)}</span></p>
        <p>IVA (19%): <span>{formatearDinero(venta.iva)}</span></p>
        <p className="total">TOTAL: <span>{formatearDinero(venta.total)}</span></p>
      </div>

      <p className="comprobante-pie pequeno">
        Atendido por: {venta.vendedor || venta.vendedor_nombre || '—'}
      </p>
    </div>
  )
}
