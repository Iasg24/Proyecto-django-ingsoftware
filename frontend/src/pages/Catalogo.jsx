import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { useCarrito } from '../carrito.jsx'
import * as api from '../api.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

// Emoji por categoría para productos sin foto
const EMOJIS = {
  Neumáticos: '🛞',
  Eléctricos: '🔋',
  Seguridad: '🪖',
  Lubricantes: '🛢️',
  Transmisión: '⛓️',
  Mantenimiento: '🛠️',
  Indumentaria: '🧥',
  Frenos: '🛑',
  Accesorios: '🏍️',
  General: '⚙️',
}

// Lista oficial de categorías con iconos
const CATEGORIAS_SIDEBAR = [
  { id: 'Todas', nombre: 'Todas las categorías', icono: '⚡' },
  { id: 'Neumáticos', nombre: 'Neumáticos & Cámaras', icono: '🛞' },
  { id: 'Frenos', nombre: 'Frenos & Discos', icono: '🛑' },
  { id: 'Lubricantes', nombre: 'Aceites & Lubricantes', icono: '🛢️' },
  { id: 'Seguridad', nombre: 'Cascos & Seguridad', icono: '🪖' },
  { id: 'Transmisión', nombre: 'Transmisión & Cadenas', icono: '⛓️' },
  { id: 'Eléctricos', nombre: 'Baterías & Eléctricos', icono: '🔋' },
  { id: 'Mantenimiento', nombre: 'Mantención & Filtros', icono: '🛠️' },
  { id: 'Indumentaria', nombre: 'Indumentaria & Chaquetas', icono: '🧥' },
  { id: 'Accesorios', nombre: 'Accesorios & Espejos', icono: '🏍️' },
]

// Diapositivas para el carrusel Hero (Estilo Megabytes / Motorsport)
const SLIDES = [
  {
    tag: 'EQUIPAMIENTO & SEGURIDAD RIDER',
    titulo: 'EQUÍPATE CON LO MEJOR EN SEGURIDAD',
    subtitulo: 'Cascos integrales certificados DOT y ECE 22.06, chaquetas reforzadas y guantes térmicos con protecciones de carbono.',
    precioPromo: 'HASTA 35% DCTO',
    textoBoton: 'Ver Cascos & Seguridad',
    categoriaDestino: 'Seguridad',
    colorAcento: '#DC2626',
    fondoGradiente: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #7f1d1d 100%)',
    badge: 'N° 1 EN PROTECCIÓN VIAL',
    destacados: ['Homologación DOT / ECE', 'Calota de fibra de carbono', 'Envío express a todo Chile'],
    imagen: '/imagenes/carrusel/carrusel-casco.png',
    imagenAlt: 'Casco Nexx Integral Adventure Pro'
  },
  {
    tag: 'MÁXIMA POTENCIA & RENDIMIENTO',
    titulo: 'REPUESTOS DE ALTO RENDIMIENTO',
    subtitulo: 'Kits de transmisión reforzados DID, pastillas de freno sinterizadas de competición y aceites sintéticos 100% 4T.',
    precioPromo: 'KITS DESDE $8.900',
    textoBoton: 'Ver Frenos & Mantención',
    categoriaDestino: 'Frenos',
    colorAcento: '#EA580C',
    fondoGradiente: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #991b1b 100%)',
    badge: 'CALIDAD Y DURABILIDAD RACING',
    destacados: ['Pastillas cero ruidos', 'Cadenas con o-ring sellado', 'Stock con despacho inmediato'],
    imagen: '/imagenes/carrusel/carrusel-repuestos.png',
    imagenAlt: 'Aceite Liqui Moly 15W-50 Street y Shooter'
  },
  {
    tag: 'AGARRE & TRACCIÓN TOTAL',
    titulo: 'NEUMÁTICOS PISTA Y DUAL SPORT',
    subtitulo: 'Máximo agarre en asfalto húmedo y rutas destapadas. Medidas estándar para cilindradas desde 125cc hasta 1000cc.',
    precioPromo: 'DESDE $22.000',
    textoBoton: 'Ver Neumáticos',
    categoriaDestino: 'Neumáticos',
    colorAcento: '#16A34A',
    fondoGradiente: 'linear-gradient(135deg, #09090b 0%, #1c1917 50%, #14532d 100%)',
    badge: 'AGARRE EN TODO CLIMA',
    destacados: ['Compuesto de alta tracción', 'Homologados para carretera', 'Instalación garantizada'],
    imagen: '/imagenes/carrusel/carrusel-neumaticos.png',
    imagenAlt: 'Neumáticos Michelin Road 6 Moto'
  }
]

export default function Catalogo() {
  const { user } = useAuth()
  const { agregar } = useCarrito()
  const [searchParams, setSearchParams] = useSearchParams()

  const [productos, setProductos] = useState([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  // Filtros activos
  const [categoriaActiva, setCategoriaActiva] = useState(searchParams.get('cat') || 'Todas')
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '')

  // Carrusel activo
  const [slideActual, setSlideActual] = useState(0)

  // Feedback al agregar al carro
  const [mensajeToast, setMensajeToast] = useState('')

  // Modal de Detalle de Producto
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidadModal, setCantidadModal] = useState(1)

  // Datos de cliente registrado
  const [misDatos, setMisDatos] = useState(null)
  const [editandoDatos, setEditandoDatos] = useState(false)
  const [avisoDatos, setAvisoDatos] = useState('')

  const esCliente = user?.rol === 'cliente'

  // Cargar productos
  useEffect(() => {
    setCargando(true)
    api.listarProductos()
      .then((r) => {
        setProductos(r.productos || [])
        setCargando(false)
      })
      .catch((e) => {
        setError(e.message)
        setCargando(false)
      })
  }, [])

  // Sincronizar con parámetros URL si cambian
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const cat = searchParams.get('cat') || 'Todas'
    setBusqueda(q)
    setCategoriaActiva(cat)
  }, [searchParams])

  // Cargar datos de cliente si aplica
  useEffect(() => {
    if (esCliente) {
      api.obtenerMisDatos().then((r) => setMisDatos(r.cliente)).catch(() => {})
    }
  }, [esCliente])

  // Timer para autoplay del carrusel Hero
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideActual((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const handleBuscar = (termino, cat) => {
    setBusqueda(termino)
    if (cat) setCategoriaActiva(cat)
    const params = {}
    if (termino) params.q = termino
    if (cat && cat !== 'Todas') params.cat = cat
    setSearchParams(params)
  }

  const handleSeleccionarCategoria = (cat) => {
    setCategoriaActiva(cat)
    const params = {}
    if (busqueda) params.q = busqueda
    if (cat && cat !== 'Todas') params.cat = cat
    setSearchParams(params)
  }

  const agregarAlCarro = (p, cant = 1) => {
    if (p.stock <= 0) return
    agregar(p.codigo, cant)
    setMensajeToast(`✅ ${cant > 1 ? `${cant}x ` : ''}"${p.nombre}" agregado al carro`)
    setTimeout(() => setMensajeToast(''), 3000)
    if (productoSeleccionado) {
      setProductoSeleccionado(null)
      setCantidadModal(1)
    }
  }

  // Filtrado de productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideCat =
        categoriaActiva === 'Todas' ||
        p.categoria.toLowerCase() === categoriaActiva.toLowerCase()

      const terminoLimpio = busqueda.trim().toLowerCase()
      const coincideTexto =
        !terminoLimpio ||
        p.nombre.toLowerCase().includes(terminoLimpio) ||
        p.codigo.toLowerCase().includes(terminoLimpio) ||
        p.categoria.toLowerCase().includes(terminoLimpio) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(terminoLimpio))

      return coincideCat && coincideTexto
    })
  }, [productos, categoriaActiva, busqueda])

  // Combos / Kits destacados (los primeros 4 con stock o seleccionados)
  const productosDestacadosBanner = useMemo(() => {
    return productos.slice(0, 4)
  }, [productos])

  // Guardar datos cliente
  const guardarMisDatos = async (e) => {
    e.preventDefault()
    try {
      const r = await api.actualizarMisDatos(misDatos)
      setMisDatos(r.cliente)
      setEditandoDatos(false)
      setAvisoDatos('✅ Datos actualizados exitosamente.')
      setTimeout(() => setAvisoDatos(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const slide = SLIDES[slideActual]

  return (
    <div className="pagina-tienda">
      {/* 1. Header con Topbar y Barra Roja */}
      <Navbar
        onBuscar={handleBuscar}
        categoriaActiva={categoriaActiva}
        onSeleccionarCategoria={handleSeleccionarCategoria}
      />

      {/* Toast Flotante de aviso */}
      {mensajeToast && (
        <div className="toast-notificacion">
          <span>{mensajeToast}</span>
          <Link to="/carrito" className="btn-ir-carro-toast">Ver Carrito →</Link>
        </div>
      )}

      {/* 2. Contenedor Principal de la Tienda */}
      <main className="contenedor-tienda">
        {/* Banner de aviso o error */}
        {error && <div className="alerta error">{error}</div>}

        {/* ============================================================== */}
        {/* SECCIÓN HERO: SIDEBAR DE CATEGORÍAS + CARRUSEL PROMO           */}
        {/* (Diseño exacto de Megabytes pero dedicado a Motocicletas)      */}
        {/* ============================================================== */}
        <section className="seccion-hero-layout">
          {/* Menú lateral vertical de categorías */}
          <aside className="sidebar-categorias">
            <div className="sidebar-encabezado">
              <span className="icono-sidebar">🏁</span>
              <h3>CATEGORÍAS</h3>
            </div>
            <ul className="lista-categorias-sidebar">
              {CATEGORIAS_SIDEBAR.map((cat) => {
                const esActiva = categoriaActiva.toLowerCase() === cat.id.toLowerCase()
                // Contar cuántos productos tiene
                const cantidad =
                  cat.id === 'Todas'
                    ? productos.length
                    : productos.filter((p) => p.categoria.toLowerCase() === cat.id.toLowerCase()).length

                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      className={`btn-cat-sidebar ${esActiva ? 'activa' : ''}`}
                      onClick={() => handleSeleccionarCategoria(cat.id)}
                    >
                      <span className="cat-icono">{cat.icono}</span>
                      <span className="cat-nombre">{cat.nombre}</span>
                      {cantidad > 0 && <span className="cat-contador">{cantidad}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* Gran Banner Carrusel Interactivo */}
          <div className="carrusel-hero-wrapper" style={{ background: slide.fondoGradiente }}>
            <div className="hero-contenido">
              <div className="hero-textos">
                <span className="hero-badge-tag">{slide.tag}</span>
                <h2 className="hero-titulo">{slide.titulo}</h2>
                <p className="hero-subtitulo">{slide.subtitulo}</p>

                {/* Bullets destacados */}
                <div className="hero-destacados-lista">
                  {slide.destacados.map((item, idx) => (
                    <span key={idx} className="item-destacado-chip">
                      ✓ {item}
                    </span>
                  ))}
                </div>

                <div className="hero-acciones">
                  <span className="hero-promo-badge">{slide.precioPromo}</span>
                  <button
                    type="button"
                    className="btn-hero-cta"
                    onClick={() => handleSeleccionarCategoria(slide.categoriaDestino)}
                  >
                    {slide.textoBoton} ➔
                  </button>
                </div>
              </div>

              {/* Elemento visual representativo */}
              <div className="hero-visual-box">
                <div className="circulo-fondo-hero"></div>
                <img
                  src={slide.imagen}
                  alt={slide.imagenAlt || slide.titulo}
                  className="hero-imagen-slide"
                />
                <div className="tarjeta-flotante-hero">
                  <span className="badge-calidad">{slide.badge}</span>
                  <strong>Stock en Chillán</strong>
                  <small>Despacho el mismo día</small>
                </div>
              </div>
            </div>

            {/* Controles del Carrusel (Flechas y Paginación de puntos) */}
            <button
              type="button"
              className="carrusel-flecha prev"
              onClick={() => setSlideActual((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
              aria-label="Anterior"
            >
              ❮
            </button>
            <button
              type="button"
              className="carrusel-flecha next"
              onClick={() => setSlideActual((prev) => (prev + 1) % SLIDES.length)}
              aria-label="Siguiente"
            >
              ❯
            </button>

            {/* Paginación de puntos estilo Megabytes */}
            <div className="carrusel-puntos">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`punto-slide ${idx === slideActual ? 'activo' : ''}`}
                  onClick={() => setSlideActual(idx)}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* BOTONES RÁPIDOS DE CATEGORÍA / PILLS (Como en screenshot 5)   */}
        {/* ============================================================== */}
        <section className="seccion-pills-categorias">
          <div className="pills-scroll">
            {CATEGORIAS_SIDEBAR.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pill-categoria ${categoriaActiva.toLowerCase() === cat.id.toLowerCase() ? 'activa' : ''}`}
                onClick={() => handleSeleccionarCategoria(cat.id)}
              >
                <span>{cat.icono}</span>
                <span>{cat.id === 'Todas' ? 'Todos' : cat.id}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* COMBOS Y KITS RECOMENDADOS (Tarjetas con especificaciones)     */}
        {/* (Estilo tarjetas técnicas RTX de Screenshot 4)                */}
        {/* ============================================================== */}
        {categoriaActiva === 'Todas' && !busqueda && productosDestacadosBanner.length > 0 && (
          <section className="seccion-equipos-destacados">
            <div className="encabezado-seccion-tienda">
              <div>
                <span className="subtitulo-seccion-rojo">KITS & MANTENCIÓN FULL</span>
                <h3 className="titulo-seccion-principal">KITS DESTACADOS PARA TU MOTO</h3>
              </div>
              <span className="tag-calidad-destacado">GARANTÍA Y COMPATIBILIDAD 100%</span>
            </div>

            <div className="grilla-equipos-destacados">
              {productosDestacadosBanner.map((p) => {
                const precioCalculado = p.precio
                const precioOriginal = Math.round(p.precio * 1.22)
                return (
                  <div key={`dest-${p.codigo}`} className="tarjeta-equipo-pro">
                    <div className="tarjeta-equipo-header">
                      <span className="badge-tipo-uso">Ideal para Rendimiento</span>
                      <span className="badge-descuento-rojo">-18%</span>
                    </div>

                    <div className="foto-equipo-contenedor">
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.nombre} className="foto-equipo-img" />
                      ) : (
                        <div className="emoji-equipo-grande">{EMOJIS[p.categoria] || '🏍️'}</div>
                      )}
                    </div>

                    <h4 className="titulo-equipo-pro">{p.nombre}</h4>
                    <span className="codigo-equipo">SKU: {p.codigo}</span>

                    {/* Especificaciones técnicas en lista con checks */}
                    <ul className="lista-specs-equipo">
                      <li>
                        <span className="spec-check">✓</span>
                        <span>Categoría: <strong>{p.categoria}</strong></span>
                      </li>
                      <li>
                        <span className="spec-check">✓</span>
                        <span>Compatible con marcas japonesas y chinas</span>
                      </li>
                      <li>
                        <span className="spec-check">✓</span>
                        <span>Garantía de 6 meses por fallas de fábrica</span>
                      </li>
                      <li>
                        <span className="spec-check">✓</span>
                        <span>Stock disponible para entrega inmediata</span>
                      </li>
                    </ul>

                    <div className="precio-caja-equipo">
                      <div className="precios-bloque">
                        <span className="precio-anterior">{api.formatearDinero(precioOriginal)}</span>
                        <span className="precio-oferta-rojo">{api.formatearDinero(precioCalculado)}</span>
                      </div>
                      <span className="stock-info-quedan">
                        {p.stock > 0 ? `Quedan ${p.stock} unidades` : 'Agotado'}
                      </span>
                    </div>

                    <div className="botones-equipo-pro">
                      <button
                        type="button"
                        className="btn-ver-equipo"
                        onClick={() => setProductoSeleccionado(p)}
                      >
                        VER DETALLE
                      </button>
                      <button
                        type="button"
                        className="btn-comprar-equipo"
                        onClick={() => agregarAlCarro(p, 1)}
                        disabled={p.stock <= 0}
                      >
                        {p.stock > 0 ? 'AGREGAR 🛒' : 'AGOTADO'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* GRILLA PRINCIPAL DE PRODUCTOS DESTACADOS                       */}
        {/* ============================================================== */}
        <section className="seccion-catalogo-principal">
          <div className="encabezado-seccion-tienda">
            <div>
              <span className="subtitulo-seccion-rojo">VITRINA DE REPUESTOS</span>
              <h3 className="titulo-seccion-principal">
                {categoriaActiva === 'Todas' ? 'PRODUCTOS DESTACADOS' : `CATEGORÍA: ${categoriaActiva.toUpperCase()}`}
              </h3>
            </div>
            <div className="contador-productos-badge">
              {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto encontrado' : 'productos encontrados'}
              {(busqueda || categoriaActiva !== 'Todas') && (
                <button
                  type="button"
                  className="btn-limpiar-filtros"
                  onClick={() => handleBuscar('', 'Todas')}
                >
                  ✕ Quitar filtros
                </button>
              )}
            </div>
          </div>

          {cargando ? (
            <div className="cargando-estado">
              <div className="spinner-motos"></div>
              <p>Cargando repuestos de motocicleta...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="sin-resultados-caja">
              <span className="icono-vacio">🔍</span>
              <h4>No se encontraron productos</h4>
              <p>No encontramos repuestos que coincidan con tu búsqueda <strong>"{busqueda}"</strong>.</p>
              <button
                type="button"
                className="boton-primario"
                onClick={() => handleBuscar('', 'Todas')}
              >
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <div className="grilla-productos-megabytes">
              {productosFiltrados.map((p, idx) => {
                // Cálculo de descuento simulado atractivo (-15% a -25%)
                const porcentajes = [15, 20, 18, 25, 12, 22]
                const descuento = porcentajes[idx % porcentajes.length]
                const precioNormal = Math.round(p.precio * (1 + descuento / 100))

                return (
                  <div key={p.codigo} className="tarjeta-producto-motos">
                    {/* Badge de descuento rojo en esquina */}
                    <div className="badge-oferta-esquina">-{descuento}%</div>

                    {/* Foto del producto */}
                    <div
                      className="contenedor-foto-prod"
                      onClick={() => setProductoSeleccionado(p)}
                      title="Haz clic para ver detalles"
                    >
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.nombre} className="foto-prod-img" />
                      ) : (
                        <div className="emoji-prod-fallback">{EMOJIS[p.categoria] || '🏍️'}</div>
                      )}
                      <span className="overlay-ver-mas">👁️ Vista Rápida</span>
                    </div>

                    {/* Información del producto */}
                    <div className="info-prod-cuerpo">
                      <div className="categoria-sku-fila">
                        <span className="badge-categoria-tag">{p.categoria}</span>
                        <span className="sku-texto">{p.codigo}</span>
                      </div>

                      <h4
                        className="nombre-producto-titulo"
                        onClick={() => setProductoSeleccionado(p)}
                        title={p.nombre}
                      >
                        {p.nombre}
                      </h4>

                      <p className="descripcion-corta-prod">{p.descripcion}</p>

                      {/* Bloque de precios */}
                      <div className="bloque-precios-tienda">
                        <span className="precio-tachado">{api.formatearDinero(precioNormal)}</span>
                        <div className="precio-actual-linea">
                          <strong className="precio-actual-monto">{api.formatearDinero(p.precio)}</strong>
                          <span className="iva-texto">IVA inc.</span>
                        </div>
                      </div>

                      {/* Stock badge */}
                      <div className="fila-stock-tienda">
                        {p.stock > 0 ? (
                          <span className="chip-stock-disponible">
                            <span className="punto-verde-stock"></span> {p.stock} en stock
                          </span>
                        ) : (
                          <span className="chip-stock-agotado">Agotado</span>
                        )}
                      </div>
                    </div>

                    {/* Botón de acción Agregar al Carrito */}
                    <div className="acciones-tarjeta-pie">
                      <button
                        type="button"
                        className="btn-agregar-carro-rojo"
                        onClick={() => agregarAlCarro(p, 1)}
                        disabled={p.stock <= 0}
                      >
                        {p.stock > 0 ? (
                          <>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                              <line x1="3" y1="6" x2="21" y2="6"></line>
                              <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <span>AGREGAR AL CARRO</span>
                          </>
                        ) : (
                          <span>SIN STOCK</span>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* SECCIÓN SOLO CLIENTES REGISTRADOS: MIS DATOS GUARDADOS         */}
        {/* ============================================================== */}
        {esCliente && misDatos && (
          <section className="seccion-datos-cliente-perfil">
            <div className="encabezado-seccion-tienda">
              <div>
                <span className="subtitulo-seccion-rojo">MI CUENTA</span>
                <h3 className="titulo-seccion-principal">MIS DATOS PARA COMPRAS RÁPIDAS</h3>
              </div>
            </div>

            {avisoDatos && <div className="alerta exito">{avisoDatos}</div>}

            <div className="tarjeta-datos-cliente-caja">
              {editandoDatos ? (
                <form onSubmit={guardarMisDatos} className="formulario-mis-datos">
                  <div className="dos-columnas">
                    <label>Nombre Completo
                      <input
                        value={misDatos.nombre}
                        onChange={(e) => setMisDatos({ ...misDatos, nombre: e.target.value })}
                        required
                      />
                    </label>
                    <label>RUT (opcional)
                      <input
                        value={misDatos.rut || ''}
                        onChange={(e) => setMisDatos({ ...misDatos, rut: e.target.value })}
                        placeholder="Ej: 12.345.678-9"
                      />
                    </label>
                    <label>Email
                      <input
                        type="email"
                        value={misDatos.email}
                        onChange={(e) => setMisDatos({ ...misDatos, email: e.target.value })}
                        required
                      />
                    </label>
                    <label>Teléfono
                      <input
                        value={misDatos.telefono || ''}
                        onChange={(e) => setMisDatos({ ...misDatos, telefono: e.target.value })}
                        placeholder="+56 9 ..."
                      />
                    </label>
                    <label className="span-2">Dirección de Despacho
                      <input
                        value={misDatos.direccion || ''}
                        onChange={(e) => setMisDatos({ ...misDatos, direccion: e.target.value })}
                        placeholder="Calle, número, comuna, ciudad"
                      />
                    </label>
                  </div>
                  <div className="acciones-edicion-datos">
                    <button
                      type="button"
                      className="boton-secundario"
                      onClick={() => setEditandoDatos(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="boton-primario">
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div className="vista-resumen-datos">
                  <div className="grid-datos-resumen">
                    <div className="item-dato">
                      <span className="label-dato">Nombre:</span>
                      <strong>{misDatos.nombre}</strong>
                    </div>
                    <div className="item-dato">
                      <span className="label-dato">RUT:</span>
                      <strong>{misDatos.rut || 'No especificado'}</strong>
                    </div>
                    <div className="item-dato">
                      <span className="label-dato">Email:</span>
                      <strong>{misDatos.email}</strong>
                    </div>
                    <div className="item-dato">
                      <span className="label-dato">Teléfono:</span>
                      <strong>{misDatos.telefono || 'Sin registrar'}</strong>
                    </div>
                    <div className="item-dato span-2">
                      <span className="label-dato">Dirección:</span>
                      <strong>{misDatos.direccion || 'Sin registrar'}</strong>
                    </div>
                  </div>
                  <div className="pie-tarjeta-cliente">
                    <button
                      type="button"
                      className="btn-editar-perfil"
                      onClick={() => setEditandoDatos(true)}
                    >
                      ✏️ Editar mis datos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL DE DETALLE RÁPIDO DE PRODUCTO                            */}
      {/* ============================================================== */}
      {productoSeleccionado && (
        <div className="modal-backdrop-tienda" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-contenido-tienda" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-cerrar-modal"
              onClick={() => setProductoSeleccionado(null)}
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            <div className="modal-layout-dos-col">
              {/* Imagen Grande */}
              <div className="modal-col-imagen">
                {productoSeleccionado.imagen ? (
                  <img
                    src={productoSeleccionado.imagen}
                    alt={productoSeleccionado.nombre}
                    className="modal-imagen-grande"
                  />
                ) : (
                  <div className="modal-emoji-grande">
                    {EMOJIS[productoSeleccionado.categoria] || '🏍️'}
                  </div>
                )}
                <div className="badge-garantia-modal">
                  🛡️ Producto Garantizado · Repuesto Original
                </div>
              </div>

              {/* Información y Compra */}
              <div className="modal-col-info">
                <span className="badge-categoria-tag">{productoSeleccionado.categoria}</span>
                <h3 className="modal-titulo-prod">{productoSeleccionado.nombre}</h3>
                <span className="modal-sku-texto">Código de Repuesto: <strong>{productoSeleccionado.codigo}</strong></span>

                <div className="modal-precios-caja">
                  <span className="modal-precio-anterior">
                    {api.formatearDinero(Math.round(productoSeleccionado.precio * 1.2))}
                  </span>
                  <div className="modal-precio-principal">
                    {api.formatearDinero(productoSeleccionado.precio)}
                    <span className="modal-iva-texto">IVA 19% incluido</span>
                  </div>
                </div>

                <div className="modal-descripcion-caja">
                  <h4>Descripción del Producto:</h4>
                  <p>{productoSeleccionado.descripcion}</p>
                </div>

                <div className="modal-compatibilidad-box">
                  <strong>Compatibilidad:</strong>
                  <p>Universal y específico para motocicletas urbanas, naked, enduro y turismo según especificaciones técnicas.</p>
                </div>

                <div className="modal-stock-linea">
                  <span>Disponibilidad:</span>
                  {productoSeleccionado.stock > 0 ? (
                    <strong className="stock-ok">● {productoSeleccionado.stock} unidades en bodega Chillán</strong>
                  ) : (
                    <strong className="stock-sin">Sin stock por el momento</strong>
                  )}
                </div>

                {productoSeleccionado.stock > 0 && (
                  <div className="modal-selector-cantidad">
                    <span className="label-cant">Cantidad:</span>
                    <div className="stepper-modal">
                      <button
                        type="button"
                        onClick={() => setCantidadModal((c) => Math.max(1, c - 1))}
                        disabled={cantidadModal <= 1}
                      >
                        -
                      </button>
                      <span>{cantidadModal}</span>
                      <button
                        type="button"
                        onClick={() => setCantidadModal((c) => Math.min(productoSeleccionado.stock, c + 1))}
                        disabled={cantidadModal >= productoSeleccionado.stock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="modal-botones-accion">
                  <button
                    type="button"
                    className="btn-agregar-modal-rojo"
                    onClick={() => agregarAlCarro(productoSeleccionado, cantidadModal)}
                    disabled={productoSeleccionado.stock <= 0}
                  >
                    {productoSeleccionado.stock > 0
                      ? `AGREGAR AL CARRO (${api.formatearDinero(productoSeleccionado.precio * cantidadModal)})`
                      : 'AGOTADO'}
                  </button>
                  <Link to="/carrito" className="btn-ir-carro-secundario">
                    Ver Carrito
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Footer Profesional con Beneficios y WhatsApp flotante */}
      <Footer />
    </div>
  )
}
