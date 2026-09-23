/**
 * App.jsx — El "director de tráfico" de páginas.
 *
 * Reglas de navegación:
 *   - Sin sesión                  ->  Login (o Catálogo/Registro, públicos)
 *   - Vendedor                    ->  /vendedor (formulario de ventas)
 *   - Jefe                        ->  /jefe (control de día + reportes)
 *   - Vendedor y Jefe             ->  /productos (administrar catálogo)
 *   - Cliente (registrado)        ->  /catalogo con "Mis datos"
 *   - Cualquiera (público)        ->  /catalogo  y  /registro
 *
 * React Router lee la URL del navegador y decide qué página mostrar.
 * LEER: docs/03-frontend.md (sección "Rutas y roles")
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Login from './pages/Login.jsx'
import Vendedor from './pages/Vendedor.jsx'
import Jefe from './pages/Jefe.jsx'
import Catalogo from './pages/Catalogo.jsx'
import Registro from './pages/Registro.jsx'
import Productos from './pages/Productos.jsx'
import Carrito from './pages/Carrito.jsx'
import PedidoExito from './pages/PedidoExito.jsx'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Páginas PÚBLICAS: no exigen sesión. */}
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/carrito" element={<Carrito />} />
      {/* Stripe redirige aquí después de pagar (con ?numero= y ?session_id=). */}
      <Route path="/pedido-exito" element={<PedidoExito />} />

      {/* Sin sesión: todos van al login */}
      <Route path="/" element={user ? <IrASuPanel user={user} /> : <Login />} />

      {/* Con sesión: cada rol ve SOLO su panel.
          Si un vendedor intenta entrar a /jefe, se le redirige. */}
      <Route
        path="/vendedor"
        element={user && user.rol === 'vendedor' ? <Vendedor /> : <Navigate to="/" replace />}
      />
      <Route
        path="/jefe"
        element={user && user.rol === 'jefe' ? <Jefe /> : <Navigate to="/" replace />}
      />

      {/* El catálogo lo administran vendedor y jefe (requisito: ambos). */}
      <Route
        path="/productos"
        element={
          user && (user.rol === 'vendedor' || user.rol === 'jefe')
            ? <Productos />
            : <Navigate to="/" replace />
        }
      />

      {/* Cualquier URL desconocida -> login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/** Redirige a cada usuario al panel de su rol (requisito 1.4). */
function IrASuPanel({ user }) {
  if (user.rol === 'jefe') return <Navigate to="/jefe" replace />
  if (user.rol === 'vendedor') return <Navigate to="/vendedor" replace />
  return <Navigate to="/catalogo" replace /> // clientes ven el catálogo
}
