"""
config/urls.py — El "router maestro" del backend.

Toda petición que llega a Django entra por aquí. Fíjate cómo se
delega: el prefijo /api/ dice "esto es nuestra API" y luego cada
app recibe su parte:

  http://localhost:8000/api/auth/login    -> lo maneja authapp/urls.py
  http://localhost:8000/api/ventas/       -> lo maneja ventas/urls.py

LEER: docs/05-como-se-conectan.md (cómo viaja una petición completa)
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    # Nuestra API. El prefijo 'api/' no es obligatorio, es una
    # convención para separar la API del resto de la web.
    path('api/auth/', include('authapp.urls')),
    path('api/ventas/', include('ventas.urls')),
    path('api/productos/', include('productos.urls')),
    path('api/clientes/', include('clientes.urls')),
    path('api/pedidos/', include('pedidos.urls')),
]
