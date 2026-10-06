# =============================================================================
# deploy/setup.sh — Despliegue completo en una VM Ubuntu (AWS, Azure u OCI)
#
# QUÉ HACE ESTE SCRIPT (todo automático):
#   1. Instala Nginx, Python y Git
#   2. Clona el repositorio del proyecto
#   3. Crea el entorno virtual e instala las dependencias del backend
#   4. Configura el archivo .env (MongoDB Atlas + CORS + Stripe)
#   5. Instala el servicio systemd (uvicorn se reinicia solo)
#   6. Configura Nginx (sirve el frontend compilado y proxea /api al backend)
#
# CÓMO USARLO (dentro de la VM, como usuario con sudo):
#   1. Edita abajo: MONGO_URI y DOMINIO
#   2. chmod +x setup.sh && ./setup.sh
#
# Al terminar, la app queda disponible en http://<IP-de-la-VM>
# =============================================================================
#!/usr/bin/env bash
set -e

# ------------------- CONFIGURAR ANTES DE EJECUTAR -------------------
# El connection string de MongoDB Atlas (Base de datos en la nube):
MONGO_URI="mongodb+srv://obelisk188_db_user:CONTRASEÑA@tienda-repuestos-moto.4cktfzh.mongodb.net/?appName=tienda-repuestos-moto"

# La IP pública de la VM (o el dominio). Ej: 190.5.41.80
DOMINIO="IP_PUBLICA_DE_LA_VM"

# Stripe en modo prueba (opcional; vacío = simulación local)
STRIPE_SECRET_KEY=""
# --------------------------------------------------------------------

APP_DIR=/opt/tienda

echo "▶ 1/6 Instalando dependencias del sistema..."
sudo apt update -y
sudo apt install -y nginx python3-venv git curl

echo "▶ 2/6 Clonando el repositorio..."
sudo rm -rf "$APP_DIR"
sudo git clone https://github.com/Iasg24/Proyecto-django-ingsoftware.git "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

echo "▶ 3/6 Instalando dependencias del backend (FastAPI)..."
cd "$APP_DIR/backend-fastapi"
python3 -m venv venv
venv/bin/pip install -q -r requirements.txt

echo "▶ 4/6 Configurando el entorno (.env)..."
cat > .env <<EOF
MONGO_URI=$MONGO_URI
CORS_ORIGINS=http://$DOMINIO
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
EOF

echo "▶ 5/6 Instalando el servicio (systemd)..."
sudo cp "$APP_DIR/deploy/tienda.service" /etc/systemd/system/tienda.service
sudo systemctl daemon-reload
sudo systemctl enable --now tienda

echo "▶ 6/6 Configurando Nginx..."
sudo cp "$APP_DIR/deploy/nginx-tienda.conf" /etc/nginx/sites-available/tienda
sudo sed -i "s|/opt/tienda|$APP_DIR|g" /etc/nginx/sites-available/tienda
sudo ln -sf /etc/nginx/sites-available/tienda /etc/nginx/sites-enabled/tienda
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "==========================================================="
echo "  ¡DESPLIEGUE COMPLETO!"
echo "  Tu tienda está disponible en:  http://$DOMINIO"
echo "  (base de datos en MongoDB Atlas, pagos en modo prueba)"
echo "==========================================================="
