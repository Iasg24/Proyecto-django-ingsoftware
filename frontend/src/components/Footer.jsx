import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="sitio-pie">
      {/* 1. BARRA ROJA DE BENEFICIOS / CONFIANZA (Estilo Megabytes) */}
      <div className="barra-beneficios-roja">
        <div className="contenedor-beneficios">
          <div className="item-beneficio">
            <div className="icono-beneficio">🚚</div>
            <div className="texto-beneficio">
              <strong>Despacho a todo Chile</strong>
              <span>Chilexpress · Starken · Same day RM</span>
            </div>
          </div>
          <div className="item-beneficio">
            <div className="icono-beneficio">🏬</div>
            <div className="texto-beneficio">
              <strong>Retiro en tienda</strong>
              <span>Calle Falkland Islands 777, Chillán</span>
            </div>
          </div>
          <div className="item-beneficio">
            <div className="icono-beneficio">💳</div>
            <div className="texto-beneficio">
              <strong>Todo medio de pago</strong>
              <span>Webpay · Transferencia · 12 cuotas sin interés</span>
            </div>
          </div>
          <div className="item-beneficio">
            <div className="icono-beneficio">🛡️</div>
            <div className="texto-beneficio">
              <strong>Garantía Oficial</strong>
              <span>Soporte técnico y repuestos garantizados</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CUERPO PRINCIPAL DEL FOOTER (Fondo oscuro) */}
      <div className="footer-principal">
        <div className="contenedor-footer">
          {/* Columna Marca */}
          <div className="columna-footer col-marca">
            <div className="marca-footer">
              <span className="logo-texto-footer">MOTO<span className="texto-rojo">REPUESTOS</span></span>
              <span className="tagline-footer">STORE & WORKSHOP</span>
            </div>
            <p className="descripcion-marca-footer">
              Tu tienda especialista en repuestos de motocicleta, indumentaria, lubricantes de competición y accesorios de alta calidad al mejor precio.
            </p>
            <div className="redes-footer">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook" className="red-link">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram" className="red-link">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://wa.me/56987654321" target="_blank" rel="noreferrer" title="WhatsApp" className="red-link">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.528 1.833.812 2.791.812 3.179 0 5.766-2.587 5.768-5.766 0-3.18-2.587-5.768-5.768-5.768zm9.969 5.768c0 5.485-4.484 9.969-9.969 9.969-1.751 0-3.391-.456-4.819-1.25l-5.212 1.341 1.373-4.992c-.93-1.503-1.473-3.268-1.473-5.068 0-5.485 4.485-9.969 9.969-9.969 5.485 0 9.969 4.484 9.969 9.969z"/></svg>
              </a>
            </div>
          </div>

          {/* Columna Tienda Física */}
          <div className="columna-footer">
            <h4 className="titulo-col-footer">TIENDA FÍSICA</h4>
            <ul className="lista-info-footer">
              <li>
                <span className="icono-li">📍</span>
                <span>Calle Falkland Islands 777, Chillán, Chile</span>
              </li>
              <li>
                <span className="icono-li">🅿️</span>
                <span>Estacionamiento para clientes disponible</span>
              </li>
              <li>
                <span className="icono-li">🗺️</span>
                <span>Sector Chillán, Región de Ñuble</span>
              </li>
              <li>
                <span className="icono-li">✉️</span>
                <a href="mailto:ventas@motorepuestos.cl">ventas@motorepuestos.cl</a>
              </li>
              <li className="horario-caja">
                <span className="horario-label">HORARIO DE ATENCIÓN:</span>
                <span className="horario-valor">Lunes a Viernes: 09:30 - 19:00</span>
                <span className="horario-valor">Sábados: 10:00 - 14:00</span>
                <span className="badge-abierto">● Abierto en tienda</span>
              </li>
            </ul>
          </div>

          {/* Columna Información */}
          <div className="columna-footer">
            <h4 className="titulo-col-footer">INFORMACIÓN</h4>
            <ul className="enlaces-footer">
              <li><Link to="/catalogo">› Catálogo completo de repuestos</Link></li>
              <li><a href="#terminos" onClick={(e) => e.preventDefault()}>› Términos y condiciones</a></li>
              <li><a href="#garantia" onClick={(e) => e.preventDefault()}>› Garantías y devoluciones</a></li>
              <li><a href="#politica" onClick={(e) => e.preventDefault()}>› Política de privacidad</a></li>
              <li><a href="#despachos" onClick={(e) => e.preventDefault()}>› Métodos de pago y despachos</a></li>
              <li><Link to="/login">› Mi cuenta / Seguimiento</Link></li>
              <li><Link to="/carrito">› Carro de compras</Link></li>
            </ul>
          </div>

          {/* Columna Consultas / Atención */}
          <div className="columna-footer">
            <h4 className="titulo-col-footer">CONSULTAS & CONTACTO</h4>
            <div className="bloques-contacto-footer">
              <a href="https://wa.me/56987654321" target="_blank" rel="noreferrer" className="tarjeta-contacto-footer">
                <span className="icono-contacto-wp">💬</span>
                <div>
                  <strong>Ventas y Despachos WhatsApp</strong>
                  <span>+56 9 8765 4321</span>
                </div>
              </a>
              <div className="tarjeta-contacto-footer">
                <span className="icono-contacto-wp">🔧</span>
                <div>
                  <strong>Consultas Técnicas & Compatibilidad</strong>
                  <span>taller@motorepuestos.cl</span>
                </div>
              </div>
              <div className="atencion-directa-badge">
                <span className="punto-verde"></span>
                <span>Atención en vivo: Lun a Vie 09:30 - 19:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUB-FOOTER DE PAGOS Y DERECHOS */}
      <div className="sub-footer">
        <div className="contenedor-sub-footer">
          <div className="medios-pago-strip">
            <span className="label-pagos">PAGO SEGURO:</span>
            <span className="chip-pago">Webpay Plus</span>
            <span className="chip-pago">Redcompra</span>
            <span className="chip-pago">Transferencia</span>
            <span className="chip-pago">Efectivo en retiro</span>
            <span className="chip-pago">Stripe</span>
            <span className="label-pagos sep-izq">DESPACHOS:</span>
            <span className="chip-pago">Chilexpress</span>
            <span className="chip-pago">Starken</span>
            <span className="chip-pago">Same Day RM</span>
          </div>
          <div className="copyright-texto">
            © 2026 MotoRepuestos Store — Pasión por las dos ruedas. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* 4. BOTÓN FLOTANTE DE WHATSAPP (Como en el screenshot) */}
      <a
        href="https://wa.me/56987654321?text=Hola!%20Necesito%20ayuda%20para%20encontrar%20un%20repuesto%20para%20mi%20moto"
        target="_blank"
        rel="noreferrer"
        className="whatsapp-flotante"
        title="Contáctanos por WhatsApp"
      >
        <span className="whatsapp-tooltip">¿Necesitas ayuda?</span>
        <div className="whatsapp-icono-circulo">
          <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.528 1.833.812 2.791.812 3.179 0 5.766-2.587 5.768-5.766 0-3.18-2.587-5.768-5.768-5.768zm9.969 5.768c0 5.485-4.484 9.969-9.969 9.969-1.751 0-3.391-.456-4.819-1.25l-5.212 1.341 1.373-4.992c-.93-1.503-1.473-3.268-1.473-5.068 0-5.485 4.485-9.969 9.969-9.969 5.485 0 9.969 4.484 9.969 9.969z"/>
          </svg>
        </div>
      </a>
    </footer>
  )
}
