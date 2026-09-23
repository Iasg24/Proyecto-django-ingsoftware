"""
urls.py — Mapa de rutas del catálogo de productos.

UNA ruta por URL. Cada vista atiende varios métodos por dentro
(ver views.py: la lección del "Método no permitido").
"""

from django.urls import path

from . import views

urlpatterns = [
    path('', views.coleccion_productos, name='coleccion_productos'),
    path('<str:codigo>/', views.detalle_producto, name='detalle_producto'),
]
