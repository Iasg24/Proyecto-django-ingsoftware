/**
 * vite.config.js — Configuración del servidor de desarrollo de React.
 *
 * PROXY (concepto clave): el frontend corre en http://localhost:5173
 * y el backend en http://localhost:8000. Sin ayuda, el navegador
 * trataría estas peticiones entre "orígenes" distintos y las bloquearía
 * (la regla CORS). La solución más limpia en desarrollo es el proxy:
 *
 *   El navegador pide  /api/ventas/dia  a Vite (puerto 5173)
 *   Vite reenvía la petición a Django (puerto 8000)
 *   Django responde y Vite le pasa la respuesta al navegador
 *
 * Para el navegador, TODO parece venir del mismo sitio: 5173.
 * Esto además simplifica el código del frontend (no hay que escribir
 * "http://localhost:8000" en cada llamada: basta con "/api/...").
 *
 * LEER: docs/05-como-se-conectan.md
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Todo lo que empiece por /api se reenvía al backend.
      '/api': 'http://localhost:8000',
    },
  },
})
