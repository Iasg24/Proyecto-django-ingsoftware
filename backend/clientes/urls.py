"""
urls.py — Mapa de rutas de los clientes.

El prefijo /api/clientes/ lo agrega config/urls.py.
"""

from django.urls import path

from . import views

urlpatterns = [
    # PÚBLICO: creación de cuenta opcional para clientes.
    path('registro', views.registrarse, name='registro_cliente'),

    # vendedor/jefe: buscar por RUT (autocompletar factura).
    path('buscar', views.buscar_cliente, name='buscar_cliente'),

    # cliente: sus propios datos (GET ver / PUT actualizar).
    path('me', views.mis_datos, name='mis_datos'),
]
