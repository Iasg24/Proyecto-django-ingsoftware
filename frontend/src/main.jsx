/**
 * main.jsx — El "punto de entrada" de la aplicación React.
 *
 * 1. ReactDOM.createRoot(...) agarra el <div id="root"> del index.html.
 * 2. <AuthProvider> envuelve TODA la app: es quien guarda la sesión
 *    (quién está logueado) y se la comparte a cualquier componente.
 * 3. <App /> es el árbol de páginas (login, vendedor, jefe).
 *
 * LEER: docs/03-frontend.md (sección "El árbol de componentes")
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import { AuthProvider } from './auth.jsx'
import { CarritoProvider } from './carrito.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <App />
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
