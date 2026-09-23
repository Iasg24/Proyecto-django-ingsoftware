"""
urls.py — El "mapa de rutas" de la app de autenticación.

Relaciona una URL con una vista:
  URL                      ->  Vista (función Python)
  /api/auth/login          ->  login
  /api/auth/logout         ->  logout
  /api/auth/me             ->  me

Cuando llega una petición a Django, config/urls.py primero recorta
el prefijo /api/auth/ y delega el resto a este archivo.
"""

from django.urls import path

from . import views

urlpatterns = [
    path('login', views.login, name='login'),
    path('logout', views.logout, name='logout'),
    path('me', views.me, name='me'),
]
