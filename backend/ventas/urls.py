"""
urls.py — Mapa de rutas del módulo de ventas.

El prefijo /api/ventas/ lo agrega config/urls.py.
"""

from django.urls import path

from . import views

urlpatterns = [
    # Control de día
    path('dia', views.consultar_dia, name='consultar_dia'),
    path('dia/abrir', views.abrir_dia, name='abrir_dia'),
    path('dia/cerrar', views.cerrar_dia, name='cerrar_dia'),

    # Ventas
    path('', views.crear_venta, name='crear_venta'),
    path('vista-previa', views.vista_previa, name='vista_previa'),

    # Reportes
    path('reporte/diario', views.reporte_diario, name='reporte_diario'),
]
