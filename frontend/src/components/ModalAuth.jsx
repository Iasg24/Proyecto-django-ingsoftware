import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import * as api from '../api.js'

export default function ModalAuth({ abierto, alCerrar, modoInicial = 'ambos' }) {
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()

  // Estado del formulario de Login (Acceder)
  const [usuarioLogin, setUsuarioLogin] = useState('')
  const [passwordLogin, setPasswordLogin] = useState('')
  const [recordarme, setRecordarme] = useState(true)
  const [errorLogin, setErrorLogin] = useState('')
  const [cargandoLogin, setCargandoLogin] = useState(false)

  // Estado del formulario de Registro
  const [regNombre, setRegNombre] = useState('')
  const [regRut, setRegRut] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [errorRegistro, setErrorRegistro] = useState('')
  const [cargandoRegistro, setCargandoRegistro] = useState(false)
  const [exitoRegistro, setExitoRegistro] = useState('')

  if (!abierto) return null

  // Manejador de Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorLogin('')
    setCargandoLogin(true)
    try {
      const rol = await iniciarSesion(usuarioLogin.trim(), passwordLogin)
      alCerrar()
      // Si es personal interno (jefe/vendedor), podemos redirigirlos a su panel
      if (rol === 'jefe') {
        navigate('/jefe')
      } else if (rol === 'vendedor') {
        navigate('/vendedor')
      }
      // Si es cliente, se queda en la misma ventana con su sesión lista
    } catch (err) {
      setErrorLogin(err.message || 'Error al iniciar sesión')
    } finally {
      setCargandoLogin(false)
    }
  }

  // Manejador de Registro
  const handleRegistro = async (e) => {
    e.preventDefault()
    setErrorRegistro('')
    setExitoRegistro('')
    setCargandoRegistro(true)

    try {
      await api.registrarCliente({
        nombre: regNombre.trim(),
        rut: regRut.trim(),
        email: regEmail.trim(),
        password: regPassword,
      })

      setExitoRegistro('¡Cuenta creada con éxito!')
      // Iniciar sesión automáticamente
      await iniciarSesion(regEmail.trim(), regPassword)
      setTimeout(() => {
        alCerrar()
      }, 800)
    } catch (err) {
      setErrorRegistro(err.message || 'Error al registrarse')
    } finally {
      setCargandoRegistro(false)
    }
  }

  // Relleno rápido para pruebas
  const llenarDemo = (u, p) => {
    setUsuarioLogin(u)
    setPasswordLogin(p)
  }

  return (
    <div className="modal-auth-backdrop" onClick={alCerrar}>
      <div className="modal-auth-tarjeta" onClick={(e) => e.stopPropagation()}>
        {/* Botón de cierre (✕) */}
        <button
          type="button"
          className="btn-cerrar-modal-auth"
          onClick={alCerrar}
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        <div className="modal-auth-columnas">
          {/* ============================================================== */}
          {/* COLUMNA IZQUIERDA: ACCEDER (LOGIN)                             */}
          {/* ============================================================== */}
          <div className="columna-auth col-login">
            <h2 className="titulo-auth">ACCEDER</h2>

            {errorLogin && <div className="alerta-auth error">{errorLogin}</div>}

            <form onSubmit={handleLogin} className="form-auth">
              <div className="campo-auth">
                <label>Nombre de usuario o correo electrónico <span className="requerido">*</span></label>
                <input
                  type="text"
                  value={usuarioLogin}
                  onChange={(e) => setUsuarioLogin(e.target.value)}
                  placeholder="Ej: vendedor o maria@mail.com"
                  required
                  autoFocus
                />
              </div>

              <div className="campo-auth">
                <label>Contraseña <span className="requerido">*</span></label>
                <input
                  type="password"
                  value={passwordLogin}
                  onChange={(e) => setPasswordLogin(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="fila-recordarme">
                <label className="checkbox-recordarme">
                  <input
                    type="checkbox"
                    checked={recordarme}
                    onChange={(e) => setRecordarme(e.target.checked)}
                  />
                  <span>Recuérdame</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn-rojo-auth"
                disabled={cargandoLogin}
              >
                {cargandoLogin ? 'Verificando...' : 'ACCEDER'}
              </button>

              <div className="link-olvido-box">
                <a
                  href="#olvido"
                  onClick={(e) => {
                    e.preventDefault()
                    alert('Para restablecer tu contraseña o soporte, comunícate con ventas@motorepuestos.cl o por WhatsApp.')
                  }}
                  className="link-olvido"
                >
                  ¿Olvidaste la contraseña?
                </a>
              </div>

              {/* Botones de prueba: SOLO en desarrollo (import.meta.env.DEV).
                  En producción (vite build) no se compilan: las credenciales
                  de prueba jamás llegan a internet. */}
              {import.meta.env.DEV && (
                <div className="demo-chips-auth">
                  <span className="demo-label">Acceso rápido de prueba:</span>
                  <div className="chips-flex">
                    <button
                      type="button"
                      className="chip-demo"
                      onClick={() => llenarDemo('vendedor', import.meta.env.VITE_DEMO_VENDEDOR_PASS || '')}
                    >
                      👤 Vendedor
                    </button>
                    <button
                      type="button"
                      className="chip-demo"
                      onClick={() => llenarDemo('jefe', import.meta.env.VITE_DEMO_JEFE_PASS || '')}
                    >
                      👔 Jefe
                    </button>
                    <button
                      type="button"
                      className="chip-demo"
                      onClick={() => llenarDemo('maria@mail.com', import.meta.env.VITE_DEMO_CLIENTE_PASS || '')}
                    >
                      🛒 María (Cliente)
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Divisor vertical */}
          <div className="divisor-auth"></div>

          {/* ============================================================== */}
          {/* COLUMNA DERECHA: REGISTRARSE                                   */}
          {/* ============================================================== */}
          <div className="columna-auth col-registro">
            <h2 className="titulo-auth">REGISTRARSE</h2>

            {errorRegistro && <div className="alerta-auth error">{errorRegistro}</div>}
            {exitoRegistro && <div className="alerta-auth exito">{exitoRegistro}</div>}

            <form onSubmit={handleRegistro} className="form-auth">
              <div className="campo-auth">
                <label>Nombre completo <span className="requerido">*</span></label>
                <input
                  type="text"
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez Morales"
                  required
                />
              </div>

              <div className="campo-auth">
                <label>RUT <span className="requerido">*</span></label>
                <input
                  type="text"
                  value={regRut}
                  onChange={(e) => setRegRut(e.target.value)}
                  placeholder="Ej: 19.876.543-2"
                  required
                />
              </div>

              <div className="campo-auth">
                <label>Dirección de correo electrónico <span className="requerido">*</span></label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tunombre@correo.cl"
                  required
                />
              </div>

              <div className="campo-auth">
                <label>Contraseña (mínimo 6 caracteres) <span className="requerido">*</span></label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <p className="texto-terminos-auth">
                Al registrarte podrás guardar tus datos de despacho y revisar tus compras en MotoRepuestos Store.
                <br /><br />
                Al realizar esta acción, acepto los términos y condiciones de compra y privacidad.
              </p>

              <button
                type="submit"
                className="btn-rojo-auth"
                disabled={cargandoRegistro}
              >
                {cargandoRegistro ? 'Creando cuenta...' : 'REGISTRARSE'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
