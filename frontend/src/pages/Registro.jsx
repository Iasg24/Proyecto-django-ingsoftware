/**
 * Registro.jsx — Creación de cuenta para CLIENTES (OPCIONAL).
 *
 * El cliente puede comprar viendo el catálogo sin registrarse.
 * Pero si crea una cuenta, guarda sus datos (RUT, dirección, etc.)
 * y el vendedor los autocompleta en su factura con solo escribir
 * el RUT: comprar la próxima vez es más rápido.
 *
 * Flujo: el cliente llena el formulario -> POST /api/clientes/registro
 * -> el backend valida (email/RUT únicos) -> crea la cuenta con la
 * contraseña hasheada -> inicia sesión automáticamente -> lo
 * llevamos al catálogo.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import * as api from '../api.js'

export default function Registro() {
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', rut: '', email: '', telefono: '', direccion: '', giro: '', password: '',
  })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      // El backend crea la cuenta Y devuelve un token (sesión iniciada).
      const respuesta = await api.registrarCliente(form)
      localStorage.setItem('token', respuesta.token)
      // Aprovechamos el contexto de autenticación para guardar la sesión.
      await iniciarSesion(form.email, form.password)
      navigate('/catalogo')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-fondo">
      <div className="login-tarjeta">
        <div className="login-logo">🧑‍🤝‍🧑</div>
        <h1>Crear cuenta de cliente</h1>
        <p className="login-subtitulo">
          Opcional: guarda tus datos para comprar más rápido la próxima vez.
          También puedes seguir navegando <Link to="/catalogo">sin registrarte</Link>.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Nombre completo
            <input value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Ej: María Pérez" required />
          </label>
          <label>RUT
            <input value={form.rut} onChange={(e) => cambiar('rut', e.target.value)} placeholder="Ej: 12.345.678-9" required />
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={(e) => cambiar('email', e.target.value)} placeholder="Ej: maria@mail.com" required />
          </label>
          <div className="dos-columnas">
            <label>Teléfono
              <input value={form.telefono} onChange={(e) => cambiar('telefono', e.target.value)} placeholder="Ej: +56 9 1234 5678" />
            </label>
            <label>Giro (opcional)
              <input value={form.giro} onChange={(e) => cambiar('giro', e.target.value)} placeholder="Ej: Comercio minorista" />
            </label>
          </div>
          <label>Dirección
            <input value={form.direccion} onChange={(e) => cambiar('direccion', e.target.value)} placeholder="Ej: Av. Brasil 1200, Valparaíso" />
          </label>
          <label>Contraseña (mínimo 6 caracteres)
            <input type="password" value={form.password} onChange={(e) => cambiar('password', e.target.value)} required />
          </label>

          {error && <div className="alerta error">{error}</div>}

          <button type="submit" className="boton-primario" disabled={enviando}>
            {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="login-ayuda">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
