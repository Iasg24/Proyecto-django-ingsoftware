/**
 * auth.jsx — El "guardia de la sesión" de la aplicación.
 *
 * Un Context de React es un contenedor de datos compartidos:
 * AuthProvider guarda quién está logueado y les ofrece a TODOS
 * los componentes las funciones login() y cerrarSesion().
 *
 * ¿Por qué localStorage?
 * El token de sesión debe sobrevivir al cerrar y reabrir el
 * navegador. localStorage es memoria del navegador que persiste
 * entre sesiones (a diferencia de las variables de JavaScript
 * que se borran al recargar la página).
 *
 * LEER: docs/03-frontend.md (sección "El contexto de autenticación")
 */
import { createContext, useContext, useEffect, useState } from 'react'
import * as api from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // user = { usuario, rol, rol_nombre, nombre } o null si no hay sesión.
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Al abrir la app, si hay un token guardado, preguntamos al
  // backend quién es (GET /auth/me). Así la sesión "se recuerda".
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setCargando(false)
      return
    }
    api
      .obtenerUsuario()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setCargando(false))
  }, [])

  // Inicio de sesión: el backend valida y nos da token + rol.
  const iniciarSesion = async (usuario, password) => {
    const respuesta = await api.login(usuario, password)
    localStorage.setItem('token', respuesta.token)
    setUser({
      usuario,
      rol: respuesta.rol,
      rol_nombre: respuesta.rol_nombre,
      nombre: respuesta.nombre,
    })
    return respuesta.rol
  }

  const cerrarSesion = async () => {
    try {
      await api.logout()
    } catch {
      // si el backend no responde, igual cerramos la sesión local
    }
    localStorage.removeItem('token')
    setUser(null)
  }

  if (cargando) {
    return <div className="pantalla-carga">Cargando...</div>
  }

  return (
    <AuthContext.Provider value={{ user, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook que cualquier componente usa para leer el contexto:
//   const { user, iniciarSesion } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
