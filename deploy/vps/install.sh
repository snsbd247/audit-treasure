#!/usr/bin/env bash
# ============================================================
#  SmartERP — One-Command VPS Installer
#  Self-hosted Supabase + Laravel (erp-backend) + React frontend
#  Tested on: Ubuntu 22.04 / 24.04 LTS  (root or sudo user)
# ============================================================
#  Usage (on a fresh VPS):
#     curl -fsSL https://raw.githubusercontent.com/snsbd247/audit-treasure/main/deploy/vps/install.sh -o install.sh
#     chmod +x install.sh
#     sudo ./install.sh
# ============================================================
set -euo pipefail

# --------- CONFIG (edit these or pass as env vars) ----------
DOMAIN="${DOMAIN:-smarterp365.com}"
SUPABASE_SUBDOMAIN="${SUPABASE_SUBDOMAIN:-supabase.${DOMAIN}}"
STUDIO_SUBDOMAIN="${STUDIO_SUBDOMAIN:-studio.${DOMAIN}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN}}"
REPO_URL="${REPO_URL:-https://github.com/snsbd247/audit-treasure.git}"
APP_DIR="${APP_DIR:-/var/www/smarterp}"
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
NODE_MAJOR="${NODE_MAJOR:-20}"
PHP_VERSION="${PHP_VERSION:-8.2}"
MYSQL_DB="${MYSQL_DB:-smarterp}"
MYSQL_USER="${MYSQL_USER:-smarterp}"
# -----------------------------------------------------------

C_GREEN='\033[0;32m'; C_YELLOW='\033[1;33m'; C_RED='\033[0;31m'; C_NC='\033[0m'
log()  { echo -e "${C_GREEN}[$(date +%H:%M:%S)]${C_NC} $*"; }
warn() { echo -e "${C_YELLOW}[WARN]${C_NC} $*"; }
err()  { echo -e "${C_RED}[ERR ]${C_NC} $*" >&2; }

if [[ $EUID -ne 0 ]]; then err "Run as root (sudo ./install.sh)"; exit 1; fi
if ! grep -qiE 'ubuntu|debian' /etc/os-release; then
  warn "This script targets Ubuntu/Debian. Continuing anyway..."
fi

rand() { openssl rand -hex "${1:-24}"; }
b64()  { openssl rand -base64 "${1:-32}" | tr -d '\n'; }

# JWT helper (HS256) using openssl + python3
make_jwt() {
  local role="$1" secret="$2"
  python3 - "$role" "$secret" <<'PY'
import sys, json, hmac, hashlib, base64, time
role, secret = sys.argv[1], sys.argv[2]
def b64u(b): return base64.urlsafe_b64encode(b).rstrip(b'=').decode()
header  = b64u(json.dumps({"alg":"HS256","typ":"JWT"}, separators=(',',':')).encode())
payload = b64u(json.dumps({"role":role,"iss":"supabase","iat":int(time.time()),"exp":int(time.time())+10*365*24*3600}, separators=(',',':')).encode())
sig = b64u(hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
print(f"{header}.{payload}.{sig}")
PY
}

# ===================== 1. SYSTEM PREP ======================
log "Step 1/9  Updating system & installing base packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git unzip zip ca-certificates gnupg lsb-release \
  software-properties-common openssl python3 python3-pip ufw jq net-tools

# ===================== 2. FIREWALL =========================
log "Step 2/9  Configuring firewall (22, 80, 443)..."
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ===================== 3. DOCKER ===========================
log "Step 3/9  Installing Docker + Compose..."
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

# ===================== 4. NODE + PHP + MYSQL ===============
log "Step 4/9  Installing Node ${NODE_MAJOR}, PHP ${PHP_VERSION}, MySQL, Nginx, Composer..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
add-apt-repository -y ppa:ondrej/php
apt-get update -y
apt-get install -y nodejs nginx mysql-server certbot python3-certbot-nginx \
  php${PHP_VERSION} php${PHP_VERSION}-fpm php${PHP_VERSION}-cli php${PHP_VERSION}-mysql \
  php${PHP_VERSION}-mbstring php${PHP_VERSION}-xml php${PHP_VERSION}-curl php${PHP_VERSION}-zip \
  php${PHP_VERSION}-bcmath php${PHP_VERSION}-gd php${PHP_VERSION}-intl
if ! command -v composer >/dev/null; then
  curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# ===================== 5. MYSQL DB =========================
log "Step 5/9  Creating MySQL database for Laravel..."
MYSQL_PASS="$(rand 16)"
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASS}';
GRANT ALL PRIVILEGES ON \`${MYSQL_DB}\`.* TO '${MYSQL_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

# ===================== 6. SELF-HOSTED SUPABASE =============
log "Step 6/9  Installing self-hosted Supabase (Docker)..."
mkdir -p "${SUPABASE_DIR}"
if [ ! -d "${SUPABASE_DIR}/docker" ]; then
  git clone --depth 1 https://github.com/supabase/supabase "${SUPABASE_DIR}/repo"
  cp -r "${SUPABASE_DIR}/repo/docker" "${SUPABASE_DIR}/docker"
fi
cd "${SUPABASE_DIR}/docker"
cp -n .env.example .env

JWT_SECRET="$(rand 32)"
ANON_KEY="$(make_jwt anon "${JWT_SECRET}")"
SERVICE_ROLE_KEY="$(make_jwt service_role "${JWT_SECRET}")"
POSTGRES_PASSWORD="$(rand 16)"
DASHBOARD_USER="admin"
DASHBOARD_PASS="$(rand 12)"
SECRET_KEY_BASE="$(b64 64)"
VAULT_ENC_KEY="$(rand 16)"

sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
sed -i "s|^ANON_KEY=.*|ANON_KEY=${ANON_KEY}|" .env
sed -i "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}|" .env
sed -i "s|^DASHBOARD_USERNAME=.*|DASHBOARD_USERNAME=${DASHBOARD_USER}|" .env
sed -i "s|^DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=${DASHBOARD_PASS}|" .env
sed -i "s|^SECRET_KEY_BASE=.*|SECRET_KEY_BASE=${SECRET_KEY_BASE}|" .env
sed -i "s|^VAULT_ENC_KEY=.*|VAULT_ENC_KEY=${VAULT_ENC_KEY}|" .env
sed -i "s|^SITE_URL=.*|SITE_URL=https://${DOMAIN}|" .env
sed -i "s|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://${SUPABASE_SUBDOMAIN}|" .env
sed -i "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://${SUPABASE_SUBDOMAIN}|" .env

docker compose pull
docker compose up -d

# ===================== 7. APP CODE =========================
log "Step 7/9  Cloning project & building frontend..."
mkdir -p "$(dirname "${APP_DIR}")"
if [ ! -d "${APP_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${APP_DIR}"
else
  cd "${APP_DIR}" && git pull
fi
cd "${APP_DIR}"

# Frontend env
cat > .env.production <<EOF
VITE_SUPABASE_URL=https://${SUPABASE_SUBDOMAIN}
VITE_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
VITE_SUPABASE_PROJECT_ID=self-hosted
VITE_API_BASE_URL=https://${DOMAIN}/api
EOF

npm ci --legacy-peer-deps || npm install --legacy-peer-deps
npm run build

# Laravel install
cd "${APP_DIR}/erp-backend"
composer install --no-dev --optimize-autoloader --no-interaction
mkdir -p storage/{app/public,app/backups,framework/{cache/data,sessions,views},logs} bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
rm -f storage/installed .env

cat > .env <<EOF
APP_NAME="SmartERP"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://${DOMAIN}
LOG_CHANNEL=daily
LOG_LEVEL=warning
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${MYSQL_DB}
DB_USERNAME=${MYSQL_USER}
DB_PASSWORD="${MYSQL_PASS}"
SANCTUM_STATEFUL_DOMAINS=${DOMAIN}
SESSION_DOMAIN=.${DOMAIN}
CORS_ALLOWED_ORIGINS=https://${DOMAIN}
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
FILESYSTEM_DISK=public
SUPABASE_URL=https://${SUPABASE_SUBDOMAIN}
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
EOF
php artisan key:generate --force

# Copy built frontend into Laravel public
rm -rf erp-backend/public/assets 2>/dev/null || true
cp -r "${APP_DIR}/dist/"* "${APP_DIR}/erp-backend/public/" 2>/dev/null || true

chown -R www-data:www-data "${APP_DIR}"

# ===================== 8. NGINX + SSL ======================
log "Step 8/9  Configuring Nginx + Let's Encrypt SSL..."

# Main app vhost
cat > /etc/nginx/sites-available/smarterp <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root ${APP_DIR}/erp-backend/public;
    index index.php index.html;
    client_max_body_size 50M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
    }
    location ~ /\.ht { deny all; }
}
NGINX

# Supabase vhost (proxy to Kong gateway on :8000)
cat > /etc/nginx/sites-available/supabase <<NGINX
server {
    listen 80;
    server_name ${SUPABASE_SUBDOMAIN};
    client_max_body_size 50M;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

# Studio vhost (proxy to Studio on :3000)
cat > /etc/nginx/sites-available/studio <<NGINX
server {
    listen 80;
    server_name ${STUDIO_SUBDOMAIN};
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/smarterp /etc/nginx/sites-enabled/smarterp
ln -sf /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/supabase
ln -sf /etc/nginx/sites-available/studio   /etc/nginx/sites-enabled/studio
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# SSL — needs domains pointing to this VPS first
log "Requesting SSL certificates (make sure DNS A-records already point to this server)..."
certbot --nginx --non-interactive --agree-tos -m "${ADMIN_EMAIL}" \
  -d "${DOMAIN}" -d "www.${DOMAIN}" \
  -d "${SUPABASE_SUBDOMAIN}" -d "${STUDIO_SUBDOMAIN}" || \
  warn "SSL failed — fix DNS, then run: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d ${SUPABASE_SUBDOMAIN} -d ${STUDIO_SUBDOMAIN}"

# ===================== 9. SUMMARY ==========================
log "Step 9/9  Saving credentials..."
CRED_FILE="/root/smarterp-credentials.txt"
cat > "${CRED_FILE}" <<EOF
=========================================================
 SmartERP — Installation Summary  ($(date))
=========================================================
 Frontend (App)        : https://${DOMAIN}
 Supabase API Gateway  : https://${SUPABASE_SUBDOMAIN}
 Supabase Studio       : https://${STUDIO_SUBDOMAIN}

 Studio Login          : ${DASHBOARD_USER} / ${DASHBOARD_PASS}

 Supabase Anon Key     : ${ANON_KEY}
 Supabase Service Key  : ${SERVICE_ROLE_KEY}
 JWT Secret            : ${JWT_SECRET}
 Postgres Password     : ${POSTGRES_PASSWORD}

 MySQL DB / User / Pwd : ${MYSQL_DB} / ${MYSQL_USER} / ${MYSQL_PASS}

 App Path              : ${APP_DIR}
 Supabase Path         : ${SUPABASE_DIR}/docker
=========================================================
 Next steps:
   1. Open https://${DOMAIN}/install   (Laravel installer wizard)
   2. Use the MySQL credentials above
   3. Create the Super Admin account
   4. Login & enjoy SmartERP
=========================================================
EOF
chmod 600 "${CRED_FILE}"

echo
log "✅ Installation complete!"
echo
cat "${CRED_FILE}"
echo
warn "Credentials saved to: ${CRED_FILE}  (chmod 600)"
