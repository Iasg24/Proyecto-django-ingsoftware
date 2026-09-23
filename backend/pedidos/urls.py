"""
urls.py — Mapa de rutas de los pedidos.

El prefijo /api/pedidos/ lo agrega config/urls.py.
"""

from django.urls import path

from . import views

urlpatterns = [
    # GET (vendedor/jefe lista) | POST (público crea). UNA vista
    # para los dos métodos (lección del bug "Método no permitido").
    path('', views.coleccion_pedidos, name='coleccion_pedidos'),

    # vendedor/jefe: procesar un pedido.
    path('<str:numero>/confirmar', views.confirmar_pedido, name='confirmar_pedido'),
    path('<str:numero>/rechazar', views.rechazar_pedido, name='rechazar_pedido'),

    # PÚBLICO: verificar el pago al volver de Stripe (el pedido guarda
    # el session_id; solo quien lo tenga puede completar el pago).
    path('<str:numero>/completar-pago', views.completar_pago, name='completar_pago'),
]
