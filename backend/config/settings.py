"""
Configuración del proyecto Django "config".

Este archivo es el CENTRO DE MANDO del backend: aquí se declara
qué apps existen, cómo se conecta a la base de datos, qué idioma
usa, qué hosts pueden acceder, etc.

LEER EN docs/02-backend.md para entender cada sección.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Cargamos las variables del archivo .env (claves de Stripe, etc.).
# El .env NO se sube a Git: es un secreto de cada máquina.
load_dotenv()

# BASE_DIR = la carpeta raíz del backend (/backend).
# Se usa para construir rutas absolutas a archivos y carpetas.
BASE_DIR = Path(__file__).resolve().parent.parent

# IMPORTANTE (seguridad): en producción este valor debe ser un secreto.
# Sirve para firmar cookies, tokens, formularios CSRF, etc.
SECRET_KEY = 'django-insecure-aprev4e5qx0_bu$6!d!qsd1(%hm75-a94n(plxairz9p*4bp8='

# DEBUG = True muestra errores detallados. NUNCA en producción.
DEBUG = True

# Hosts permitidos. '*' = cualquiera (solo para desarrollo).
ALLOWED_HOSTS = ['*']

# ---------------------------------------------------------------------------
# APLICACIONES
# Cada "app" de Django es un módulo con responsabilidad específica.
# - authapp: inicio de sesión, tokens y roles de usuario.
# - ventas:  registro de ventas, control de día y reportes.
# - rest_framework: nos da las herramientas para crear la API REST.
# - corsheaders: permite que el frontend (otro puerto) haga peticiones.
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # --- Nuestras apps ---
    'rest_framework',
    'corsheaders',
    'authapp',
    'ventas',
    'productos',
    'clientes',
    'pedidos',
]

# El MIDDLEWARE es una "cadena de filtros" por la que pasa TODA petición
# HTTP que llega al servidor (como controles de seguridad en un aeropuerto).
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    # corsheaders debe ir lo más arriba posible:
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ---------------------------------------------------------------------------
# BASE DE DATOS
# NO usamos el ORM de Django con SQL. Guardamos TODO en MongoDB.
# Django igual necesita definir una base de datos (la usará el panel admin),
# así que le ponemos SQLite como base "de sistema" y en database.py
# abrimos la conexión real a MongoDB.
# LEER: docs/04-base-de-datos.md
# ---------------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ---------------------------------------------------------------------------
# CONFIGURACIÓN DE MONGO (nuestra base de datos real)
# MongoDB corre en localhost:27017 y la base se llama "tienda_repuestos".
# Mongo escucha por defecto en el puerto 27017.
# ---------------------------------------------------------------------------
MONGO_URI = 'mongodb://localhost:27017/'
MONGO_DB_NAME = 'tienda_repuestos'

# ---------------------------------------------------------------------------
# CORS (Cross-Origin Resource Sharing)
# El frontend corre en http://localhost:5173 y el backend en
# http://localhost:8000. Son "orígenes" distintos, así que sin CORS
# el navegador BLOQUEARÍA las peticiones entre ambos.
# LEER: docs/05-como-se-conectan.md
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
# Permitimos que el frontend envíe la cabecera Authorization (el token).
CORS_ALLOW_HEADERS = ['authorization', 'content-type']
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# STRIPE (pago real en modo prueba)
# Estas llaves se leen del archivo backend/.env (ver .env.example).
#   - Si STRIPE_SECRET_KEY está vacía, el pago con tarjeta usa la
#     SIMULACIÓN local (nadie se entera; el sistema funciona igual).
#   - Si está configurada, el cliente paga en la página oficial de
#     Stripe con la tarjeta de prueba 4242 4242 4242 4242.
# LEER: docs/10-pedidos-y-carrito.md (sección "Pago real con Stripe")
# ---------------------------------------------------------------------------
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')

# ---------------------------------------------------------------------------
# Zona horaria: Chile continental. La fecha del "día" se calcula acá.
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'es-cl'
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
