#!/bin/bash
# ============================================================
# SmartERP - Single Company ERP
# Build & Package Script for cPanel Deployment
# ============================================================
# Usage: cd erp-backend && bash deploy.sh
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
echo "[1/7] Installing Laravel dependencies..."
cd "$LARAVEL_DIR"
if command -v composer &>/dev/null; then
    composer install --no-dev --optimize-autoloader --no-interaction
else
    echo "⚠ Composer not found. Make sure vendor/ is included."
fi

# Step 2: Build React frontend
echo ""
echo "[2/7] Building React frontend..."
cd "$PROJECT_ROOT"
if [ -f "package.json" ]; then
    npm install --legacy-peer-deps 2>/dev/null || npm install
    npm run build
else
    echo "⚠ No package.json found. Skipping frontend build..."
fi

# Step 3: Copy React build to Laravel public folder
echo ""
echo "[3/7] Copying frontend build to Laravel public/..."
if [ -d "dist" ]; then
    # Clean old frontend assets
    rm -rf "$LARAVEL_DIR/public/assets"
    # Copy new assets
    cp -r dist/assets "$LARAVEL_DIR/public/" 2>/dev/null || true
    cp dist/index.html "$LARAVEL_DIR/public/" 2>/dev/null || true
    [ -f dist/favicon.ico ] && cp dist/favicon.ico "$LARAVEL_DIR/public/" || true
    [ -f dist/robots.txt ] && cp dist/robots.txt "$LARAVEL_DIR/public/" || true
    echo "✓ Frontend files copied"
else
    echo "⚠ No dist/ folder found. Run 'npm run build' first."
fi

# Step 4: Create storage directories
echo ""
echo "[4/7] Setting up storage directories..."
cd "$LARAVEL_DIR"
mkdir -p storage/app/public/employees
mkdir -p storage/app/backups
mkdir -p storage/framework/{cache/data,sessions,views}
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Step 5: Remove install lock (so installer works on fresh deploy)
echo ""
echo "[5/7] Preparing for fresh install..."
rm -f storage/installed
rm -f .env

# Step 6: Set permissions
echo ""
echo "[6/7] Setting file permissions..."
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Step 7: Create deployment package
echo ""
echo "[7/7] Creating deployment package..."
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
    -x "laravel-backend/storage/installed" \
    -x "laravel-backend/deploy.sh" \
    -x "laravel-backend/.env"

echo ""
echo "============================================"
echo "  ✅ Package created: $PACKAGE_NAME"
echo "============================================"
echo ""
echo "ONE-CLICK DEPLOYMENT STEPS:"
echo "  1. Upload $PACKAGE_NAME to your cPanel"
echo "  2. Extract the ZIP file"
echo "  3. Set document root → laravel-backend/public"
echo "  4. Create an empty MySQL database in cPanel"
echo "  5. Open https://yourdomain.com/install"
echo "  6. Follow the setup wizard (no manual .env editing!)"
echo ""
echo "OPTIONAL CRON JOB (in cPanel → Cron Jobs):"
echo "  * * * * * php /home/USERNAME/public_html/artisan schedule:run >> /dev/null 2>&1"
echo ""
echo "That's it! The installer handles everything else."
echo ""
