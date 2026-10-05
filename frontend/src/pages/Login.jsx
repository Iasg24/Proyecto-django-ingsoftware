/**
 * Login.jsx — Pantalla de inicio de sesión (requisito 1 del enunciado).
 *
 * Flujo:
 *   1. El usuario escribe usuario y contraseña.
 *   2. Al enviar, llamamos iniciarSesion() (ver auth.jsx) que
 *      hace POST /api/auth/login.
 *   3. El BACKEND valida las credenciales contra MongoDB.
 *   4. Si son correctas, guarda el token y React Router nos
 *      lleva al panel del rol correspondiente (App.jsx decide).
 *   5. Si fallan, mostramos el error que el backend devolvió.
 *
 * LEER: docs/05-como-se-conectan.md (el viaje de una petición)
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()

  // Estado local del formulario (lo que el usuario va escribiendo).
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault() // evita que el navegador recargue la página
    setError('')
    setEnviando(true)
    try {
      await iniciarSesion(usuario, password)
      // Si llegamos aquí, el login fue exitoso. App.jsx se
      // encarga de redirigir según el rol.
      navigate(usuario === 'jefe' ? '/jefe' : '/vendedor')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-fondo">
      <div className="login-tarjeta">
        <div className="login-logo">🏍️</div>
        <h1>MOTO<span className="texto-rojo">REPUESTOS</span></h1>
        <p className="login-subtitulo">Portal de Clientes y Punto de Venta</p>

        <form onSubmit={handleSubmit}>
          <label>
            Usuario / Email
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: vendedor o maria@mail.com"
              required
              autoFocus
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="alerta error">{error}</div>}

          <button type="submit" disabled={enviando} className="boton-primario">
            {enviando ? 'Iniciando sesión...' : 'Ingresar al Sistema ➔'}
          </button>
        </form>



        <div className="login-enlaces">
          <Link to="/catalogo">← Volver a la Tienda de Motos</Link>
          {' · '}
          <Link to="/registro">Crear cuenta de cliente</Link>
        </div>
      </div>
    </div>
  )
}
