# SmartERP - Single Company cPanel Deployment Guide

## System Architecture
- **Type**: Single-Company ERP (NOT SaaS, NOT multi-tenant)
- **Backend**: Laravel 10 + Sanctum (JWT API)
- **Frontend**: React + Vite (SPA)
- **Database**: MySQL 5.7+ / MariaDB 10.3+
- **Auth Rule**: `employee_id = NULL` → Super Admin (full access)

## Prerequisites
- PHP 8.1+ with extensions: `mbstring`, `pdo_mysql`, `openssl`, `tokenizer`, `json`, `bcmath`, `calendar`
- MySQL 5.7+ / MariaDB 10.3+
- Apache with `mod_rewrite` enabled
- Composer (local machine)
- Node.js 18+ (local machine for building)

---

## Quick Deploy (Automated)
```bash
cd erp-backend
bash deploy.sh
```
This builds React, copies to Laravel `public/`, and creates a deployment ZIP.

---

## Manual Deployment Steps

### 1. Build Frontend
```bash
npm install
npm run build
```

### 2. Install Laravel Dependencies
```bash
cd erp-backend
composer install --no-dev --optimize-autoloader
```

### 3. Copy Frontend Build to Laravel
```bash
cp -r ../dist/assets public/
cp ../dist/index.html public/
cp ../dist/favicon.ico public/
```

### 4. Upload to Server
Upload the `erp-backend/` folder content:
```
/home/username/erp/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/              ← Set as document root
│   ├── .htaccess        ← Routes API to Laravel, SPA to index.html
│   ├── index.html       ← React SPA entry
│   ├── index.php        ← Laravel entry
│   ├── assets/          ← React build assets
│   └── storage → ../storage/app/public
├── resources/
├── routes/
├── storage/
├── vendor/
├── .env
├── artisan
└── composer.json
```

### 5. Set Document Root
In cPanel → Domains → Set document root:
```
/home/username/erp/public
```

### 6. Create MySQL Database
In cPanel → MySQL Databases:
1. Create database: `username_erp`
2. Create user: `username_erpuser`
3. Add user to database with **ALL PRIVILEGES**

### 7. Configure Environment
```bash
cp .env.example .env
nano .env
```
Update these values:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_DATABASE=username_erp
DB_USERNAME=username_erpuser
DB_PASSWORD=your_strong_password

SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=.yourdomain.com
```

### 8. Initialize Application
```bash
cd /home/username/erp
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force    # Creates Super Admin: admin / admin123
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

### 9. Optimize for Production
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 10. Set Up Cron Job
In cPanel → Cron Jobs, add (every minute):
```
* * * * * cd /home/username/erp && php artisan schedule:run >> /dev/null 2>&1
```

Scheduled tasks:
- `users:mark-offline` - marks inactive users as offline (every 2 minutes)

---

## Default Login
- **Username**: admin
- **Password**: admin123
- **Role**: Super Admin (employee_id = NULL → full access)

⚠️ **Change the password immediately after first login!**

---

## RBAC System

### Super Admin Rule
`employee_id = NULL` → **FULL ACCESS** (bypasses all permission checks)

### Regular Users
Permissions are module-based with 4 actions per module:
- `module.view` / `module.create` / `module.edit` / `module.delete`

Example modules: `accounts`, `sales`, `purchase`, `inventory`, `manufacturing`, `hrm`, `reports`, `users`, `roles`, `branches`, `settings`

### Permission Flow
1. User logs in → API returns permissions array
2. Frontend gates UI elements via `hasPermission("module.action")`
3. Backend validates via `permission:module.action` middleware
4. Super Admin bypasses both checks automatically

---

## Troubleshooting

### 404 on all routes
```bash
# Ensure mod_rewrite is enabled
a2enmod rewrite
# Check .htaccess is being processed (AllowOverride All in Apache config)
```

### 500 Internal Server Error
```bash
tail -50 storage/logs/laravel.log
chmod -R 775 storage bootstrap/cache
php artisan config:clear
```

### CORS Errors
Update `.env`:
```env
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
```

### File Upload Issues
```bash
php artisan storage:link
# Check php.ini: upload_max_filesize = 10M, post_max_size = 12M
```

### After Config Changes
```bash
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
```

---

## Security Checklist
- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] Strong `APP_KEY` generated
- [ ] Admin password changed from default
- [ ] SSL certificate installed (HTTPS)
- [ ] `.htaccess` blocks `.env`, `.sql`, `.json` files
- [ ] `storage/` has 775 permissions (not 777)
- [ ] Remove `install.php` if using PHP deploy method
