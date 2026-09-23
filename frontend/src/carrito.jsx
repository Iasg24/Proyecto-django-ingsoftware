/**
 * carrito.js — El CARRITO DE COMPRAS del cliente.
 *
 * ¿Dónde vive el carro? En localStorage (la memoria del navegador).
 * ¿Por qué? Porque el carro es una decisión "del cliente": no debe
 * perderse al recargar la página ni al cerrar el navegador. Cuando
 * el cliente PAGA, recién ahí los datos viajan al backend (pedido).
 *
 * El carro es un diccionario: { codigo: cantidad }
 *   { "A-001": 2, "C-100": 1 }   -> 2 neumáticos y 1 casco
 *
 * Las funciones "puras" (sin React) viven aquí; el contexto de abajo
 * las conecta con la interfaz para que los componentes se enteren
 * de los cambios (el badge "Carro (3)").
 */

const CLAVE = 'carro'

// ---------- Funciones puras sobre localStorage ----------

export function cargarCarro() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || {}
  } catch {
    return {}
  }
}

export function guardarCarro(carro) {
  localStorage.setItem(CLAVE, JSON.stringify(carro))
}

export function agregarAlCarro(carro, codigo, cantidad = 1) {
  const nuevo = { ...carro }
  nuevo[codigo] = (nuevo[codigo] || 0) + cantidad
  return nuevo
}

export function cambiarCantidad(carro, codigo, cantidad) {
  const nuevo = { ...carro }
  if (cantidad <= 0) delete nuevo[codigo]
  else nuevo[codigo] = cantidad
  return nuevo
}

export function quitarDelCarro(carro, codigo) {
  const nuevo = { ...carro }
  delete nuevo[codigo]
  return nuevo
}

export function vaciarCarro() {
  return {}
}

export function contarUnidades(carro) {
  return Object.values(carro).reduce((suma, n) => suma + n, 0)
}

// ---------- Contexto de React (para que la UI se entere) ----------

import { createContext, useContext, useMemo, useState } from 'react'

const CarritoContext = createContext(null)

export function CarritoProvider({ children }) {
  // El estado del carro vive aquí y se copia a localStorage en cada cambio.
  const [carro, setCarro] = useState(cargarCarro)

  const actualizar = (nuevoCarro) => {
    setCarro(nuevoCarro)
    guardarCarro(nuevoCarro)
  }

  const agregar = (codigo, cantidad = 1) => actualizar(agregarAlCarro(carro, codigo, cantidad))
  const cambiar = (codigo, cantidad) => actualizar(cambiarCantidad(carro, codigo, cantidad))
  const quitar = (codigo) => actualizar(quitarDelCarro(carro, codigo))
  const vaciar = () => actualizar(vaciarCarro())

  const unidades = useMemo(() => contarUnidades(carro), [carro])

  return (
    <CarritoContext.Provider value={{ carro, unidades, agregar, cambiar, quitar, vaciar }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}
