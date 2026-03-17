#!/bin/bash
# ============================================================
# SmartERP - Single Company ERP
# Build & Package Script for cPanel Deployment
# ============================================================
# Usage: cd laravel-backend && bash deploy.sh
# ============================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LARAVEL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  SmartERP - Build & Package for cPanel"
echo "  Single Company ERP (NOT SaaS)"
echo "============================================"

# Step 1: Install Laravel dependencies (production)
echo ""
echo "[1/6] Installing Laravel dependencies..."
cd "$LARAVEL_DIR"
if command -v composer &>/dev/null; then
    composer install --no-dev --optimize-autoloader --no-interaction
else
    echo "⚠ Composer not found. Skipping..."
fi

# Step 2: Build React frontend
echo ""
echo "[2/6] Building React frontend..."
cd "$PROJECT_ROOT"
if [ -f "package.json" ]; then
    npm install --legacy-peer-deps 2>/dev/null || npm install
    npm run build
else
    echo "⚠ No package.json found. Skipping frontend build..."
fi

# Step 3: Copy React build to Laravel public folder
echo ""
echo "[3/6] Copying frontend build to Laravel public/..."
if [ -d "dist" ]; then
    rm -rf "$LARAVEL_DIR/public/assets"
    cp -r dist/assets "$LARAVEL_DIR/public/" 2>/dev/null || true
    cp dist/index.html "$LARAVEL_DIR/public/" 2>/dev/null || true
    [ -f dist/favicon.ico ] && cp dist/favicon.ico "$LARAVEL_DIR/public/" || true
    echo "✓ Frontend files copied"
else
    echo "⚠ No dist/ folder found. Run 'npm run build' first."
fi

# Step 4: Create storage directories
echo ""
echo "[4/6] Setting up storage directories..."
cd "$LARAVEL_DIR"
mkdir -p storage/app/public/employees
mkdir -p storage/framework/{cache/data,sessions,views}
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Step 5: Create storage symlink
echo ""
echo "[5/6] Creating storage link..."
php artisan storage:link 2>/dev/null || echo "⚠ Storage link skipped (run on server)"

# Step 6: Create deployment package
echo ""
echo "[6/6] Creating deployment package..."
cd "$PROJECT_ROOT"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="smarterp_${TIMESTAMP}.zip"

zip -r "$PACKAGE_NAME" laravel-backend/ \
    -x "laravel-backend/node_modules/*" \
    -x "laravel-backend/.git/*" \
    -x "laravel-backend/tests/*" \
    -x "laravel-backend/storage/logs/*.log" \
    -x "laravel-backend/storage/framework/cache/data/*" \
    -x "laravel-backend/storage/framework/sessions/*" \
    -x "laravel-backend/storage/framework/views/*" \
    -x "laravel-backend/deploy.sh" \
    -x "laravel-backend/.env"

echo ""
echo "============================================"
echo "  ✅ Package created: $PACKAGE_NAME"
echo "============================================"
echo ""
echo "DEPLOYMENT STEPS:"
echo "  1. Upload & extract to server"
echo "  2. Set document root → /public"
echo "  3. Create MySQL database"
echo "  4. cp .env.example .env && edit .env"
echo "  5. php artisan key:generate"
echo "  6. php artisan migrate --force"
echo "  7. php artisan db:seed --force"
echo "  8. php artisan storage:link"
echo "  9. chmod -R 775 storage bootstrap/cache"
echo " 10. php artisan config:cache && php artisan route:cache"
echo ""
echo "DEFAULT LOGIN: admin / admin123"
echo "⚠ Change password after first login!"
echo ""
