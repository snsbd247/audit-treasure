#!/bin/bash
# ============================================================
# SmartERP - cPanel Deployment Script
# ============================================================
# Usage: bash deploy.sh
#
# This script prepares the Laravel + React ERP for cPanel deployment.
# Run this on your LOCAL machine before uploading to the server.
# ============================================================

set -e

echo "============================================"
echo "  SmartERP - Build & Package for cPanel"
echo "============================================"

# Step 1: Install Laravel dependencies (production)
echo ""
echo "[1/5] Installing Laravel dependencies..."
cd "$(dirname "$0")"
composer install --no-dev --optimize-autoloader --no-interaction

# Step 2: Build React frontend
echo ""
echo "[2/5] Building React frontend..."
cd ..
npm install
npm run build

# Step 3: Copy React build to Laravel public folder
echo ""
echo "[3/5] Copying frontend build to Laravel public/..."
rm -rf laravel-backend/public/assets
cp -r dist/assets laravel-backend/public/
cp dist/index.html laravel-backend/public/
[ -f dist/favicon.ico ] && cp dist/favicon.ico laravel-backend/public/

# Step 4: Create storage link
echo ""
echo "[4/5] Setting up storage..."
cd laravel-backend
php artisan storage:link 2>/dev/null || true

# Step 5: Create deployment package
echo ""
echo "[5/5] Creating deployment package..."
cd ..
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="smarterp_deploy_${TIMESTAMP}.zip"

zip -r "$PACKAGE_NAME" laravel-backend/ \
  -x "laravel-backend/node_modules/*" \
  -x "laravel-backend/.git/*" \
  -x "laravel-backend/tests/*" \
  -x "laravel-backend/storage/logs/*" \
  -x "laravel-backend/storage/framework/cache/data/*" \
  -x "laravel-backend/storage/framework/sessions/*" \
  -x "laravel-backend/storage/framework/views/*" \
  -x "laravel-backend/deploy.sh"

echo ""
echo "============================================"
echo "  Package created: $PACKAGE_NAME"
echo "============================================"
echo ""
echo "DEPLOYMENT STEPS:"
echo "1. Upload & extract to your server (e.g., /home/user/erp/)"
echo "2. Set document root → /home/user/erp/laravel-backend/public"
echo "3. Create MySQL database & user"
echo "4. Copy .env.example → .env and configure DB credentials"
echo "5. Run: php artisan key:generate"
echo "6. Run: php artisan migrate --force"
echo "7. Run: php artisan db:seed (optional demo data)"
echo "8. Run: php artisan storage:link"
echo "9. Set permissions: chmod -R 775 storage bootstrap/cache"
echo "10. Add cron: * * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1"
echo ""
