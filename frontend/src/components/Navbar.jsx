import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { useCarrito } from '../carrito.jsx'
import ModalAuth from './ModalAuth.jsx'

export default function Navbar({ onBuscar, categoriaActiva, onSeleccionarCategoria }) {
  const { user, cerrarSesion } = useAuth()
  const { unidades } = useCarrito()
  const navigate = useNavigate()
  const location = useLocation()

  const [termino, setTermino] = useState('')
  const [categoriaSelect, setCategoriaSelect] = useState('Todas')
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false)

  const handleSubmitBusqueda = (e) => {
    e.preventDefault()
    if (onBuscar) {
      onBuscar(termino, categoriaSelect)
    } else {
      navigate(`/catalogo?q=${encodeURIComponent(termino)}&cat=${encodeURIComponent(categoriaSelect)}`)
    }
  }

  const manejarCategoriaClick = (cat) => {
    setCategoriaSelect(cat)
    if (onSeleccionarCategoria) {
      onSeleccionarCategoria(cat)
    } else {
      navigate(`/catalogo?cat=${encodeURIComponent(cat)}`)
    }
    setMenuMovilAbierto(false)
  }

  const esAdmin = user && (user.rol === 'vendedor' || user.rol === 'jefe')

  return (
    <>
      <header className="sitio-header">
        {/* 1. TOP BAR SUPERIOR */}
        <div className="topbar">
          <div className="contenedor-topbar">
            <div className="topbar-izq">
              {user ? (
                <span className="topbar-usuario">
                  Hola, <strong>{user.nombre}</strong> ({user.rol_nombre || user.rol})
                </span>
              ) : (
                <div className="topbar-auth-links">
                  <button
                    type="button"
                    className="topbar-btn-auth"
                    onClick={() => setModalAuthAbierto(true)}
                  >
                    INGRESAR
                  </button>
                  <span className="separador">/</span>
                  <button
                    type="button"
                    className="topbar-btn-auth"
                    onClick={() => setModalAuthAbierto(true)}
                  >
                    CREAR CUENTA
                  </button>
                </div>
              )}
            </div>
            <div className="topbar-der">
              <span className="topbar-info">
                📍 DIRECCIÓN: Calle Falkland Islands 777, Chillán
              </span>
              <span className="topbar-sep">|</span>
              <span className="topbar-info">
                ✉️ E-MAIL: <a href="mailto:ventas@motorepuestos.cl">ventas@motorepuestos.cl</a>
              </span>
              <span className="topbar-sep">|</span>
              <span className="topbar-info">
                📞 WHATSAPP: +56 9 8765 4321
              </span>
            </div>
          </div>
        </div>

        {/* 2. HEADER MEDIO (Logo, Buscador, Carrito, Redes) */}
        <div className="header-medio">
          <div className="contenedor-header-medio">
            {/* Logo estilo motorsport */}
            <Link to="/" className="marca-logo">
              <div className="logo-icono">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="8" fill="#111827" />
                  <path d="M12 28L20 12L28 28H23L20 21L17 28H12Z" fill="#DC2626" />
                  <circle cx="20" cy="18" r="3" fill="#FFFFFF" />
                </svg>
              </div>
              <div className="logo-textos">
                <span className="logo-principal">MOTO<span className="texto-rojo">REPUESTOS</span></span>
                <span className="logo-subtitulo">SPEED & PARTS STORE</span>
              </div>
            </Link>

            {/* Formulario de búsqueda con categorías integradas */}
            <form className="barra-busqueda" onSubmit={handleSubmitBusqueda}>
              <div className="busqueda-input-wrapper">
                <input
                  type="text"
                  placeholder="Buscar repuestos, cascos, aceites, bujías..."
                  value={termino}
                  onChange={(e) => {
                    setTermino(e.target.value)
                    if (onBuscar) onBuscar(e.target.value, categoriaSelect)
                  }}
                  className="busqueda-input"
                />
              </div>
              <div className="busqueda-select-wrapper">
                <select
                  value={categoriaSelect}
                  onChange={(e) => {
                    setCategoriaSelect(e.target.value)
                    if (onBuscar) onBuscar(termino, e.target.value)
                  }}
                  className="busqueda-select"
                >
                  <option value="Todas">TODAS LAS CATEGORÍAS</option>
                  <option value="Neumáticos">Neumáticos</option>
                  <option value="Frenos">Frenos</option>
                  <option value="Lubricantes">Lubricantes</option>
                  <option value="Seguridad">Seguridad / Cascos</option>
                  <option value="Transmisión">Transmisión</option>
                  <option value="Eléctricos">Eléctricos</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Indumentaria">Indumentaria</option>
                  <option value="Accesorios">Accesorios</option>
                </select>
              </div>
              <button type="submit" className="boton-buscar" title="Buscar productos">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>

            {/* Iconos de usuario, carrito y redes */}
            <div className="header-acciones">
              {/* Botón de Perfil de Usuario */}
              {user ? (
                <Link
                  to={user.rol === 'cliente' ? '/catalogo' : `/${user.rol}`}
                  className="btn-usuario-icono"
                  title={`Mi Cuenta: ${user.nombre} (${user.rol_nombre || user.rol})`}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn-usuario-icono"
                  onClick={() => setModalAuthAbierto(true)}
                  title="Acceder o Registrarse"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </button>
              )}

              {/* Botón de Carrito */}
              <Link to="/carrito" className="header-carrito-link" title="Ver carrito de compras">
                <div className="carrito-icono-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  <span className="badge-contador">{unidades}</span>
                </div>
                <div className="carrito-texto-info">
                  <span className="carro-label">MI CARRO</span>
                  <span className="carro-estado">{unidades > 0 ? `${unidades} item${unidades > 1 ? 's' : ''}` : 'Vacío'}</span>
                </div>
              </Link>

              {/* Redes sociales */}
              <div className="redes-sociales-header">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook" className="red-icono">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram" className="red-icono">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://wa.me/56987654321" target="_blank" rel="noreferrer" title="WhatsApp" className="red-icono red-whatsapp">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.528 1.833.812 2.791.812 3.179 0 5.766-2.587 5.768-5.766 0-3.18-2.587-5.768-5.768-5.768zm9.969 5.768c0 5.485-4.484 9.969-9.969 9.969-1.751 0-3.391-.456-4.819-1.25l-5.212 1.341 1.373-4.992c-.93-1.503-1.473-3.268-1.473-5.068 0-5.485 4.485-9.969 9.969-9.969 5.485 0 9.969 4.484 9.969 9.969z"/>
                  </svg>
                </a>
              </div>

              {/* Botón hamburguesa móvil */}
              <button
                className="boton-hamburguesa"
                onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
                aria-label="Abrir menú"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. BARRA DE NAVEGACIÓN ROJA PRINCIPAL */}
        <nav className={`nav-roja ${menuMovilAbierto ? 'abierto' : ''}`}>
          <div className="contenedor-nav-roja">
            <ul className="menu-principal">
              <li className={location.pathname === '/' || location.pathname === '/catalogo' ? 'activo' : ''}>
                <Link to="/catalogo" onClick={() => manejarCategoriaClick('Todas')}>INICIO</Link>
              </li>
              <li>
                <button
                  type="button"
                  className={`enlace-nav ${categoriaActiva === 'Neumáticos' ? 'activo' : ''}`}
                  onClick={() => manejarCategoriaClick('Neumáticos')}
                >
                  NEUMÁTICOS
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`enlace-nav ${categoriaActiva === 'Frenos' ? 'activo' : ''}`}
                  onClick={() => manejarCategoriaClick('Frenos')}
                >
                  FRENOS
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`enlace-nav ${categoriaActiva === 'Lubricantes' ? 'activo' : ''}`}
                  onClick={() => manejarCategoriaClick('Lubricantes')}
                >
                  LUBRICANTES
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`enlace-nav ${categoriaActiva === 'Seguridad' ? 'activo' : ''}`}
                  onClick={() => manejarCategoriaClick('Seguridad')}
                >
                  CASCOS & SEGURIDAD
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`enlace-nav ${categoriaActiva === 'Transmisión' ? 'activo' : ''}`}
                  onClick={() => manejarCategoriaClick('Transmisión')}
                >
                  TRANSMISIÓN
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`enlace-nav ${categoriaActiva === 'Mantenimiento' ? 'activo' : ''}`}
                  onClick={() => manejarCategoriaClick('Mantenimiento')}
                >
                  MANTENCIÓN
                </button>
              </li>

              {/* Enlaces de administración para vendedores o jefe */}
              {esAdmin && (
                <>
                  {user.rol === 'vendedor' && (
                    <li>
                      <Link to="/vendedor" className="nav-destacado">PUNTO DE VENTA</Link>
                    </li>
                  )}
                  {user.rol === 'jefe' && (
                    <li>
                      <Link to="/jefe" className="nav-destacado">PANEL JEFE</Link>
                    </li>
                  )}
                  <li>
                    <Link to="/productos" className="nav-destacado">GESTIÓN PRODUCTOS</Link>
                  </li>
                </>
              )}

              {/* Enlace de cuenta */}
              {user ? (
                <li className="item-cuenta">
                  <button type="button" onClick={cerrarSesion} className="boton-nav-logout" title="Cerrar sesión">
                    SALIR ({user.nombre.split(' ')[0]})
                  </button>
                </li>
              ) : (
                <li className="item-cuenta">
                  <button
                    type="button"
                    className="enlace-nav"
                    onClick={() => setModalAuthAbierto(true)}
                  >
                    MI CUENTA
                  </button>
                </li>
              )}

              <li>
                <Link to="/carrito" className="nav-carro-btn">
                  CARRITO ({unidades})
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Modal Popup para Acceder o Registrarse sin cambiar de ventana */}
      <ModalAuth
        abierto={modalAuthAbierto}
        alCerrar={() => setModalAuthAbierto(false)}
      />
    </>
  )
}
