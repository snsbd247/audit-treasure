# SmartERP - Complete cPanel Deployment Guide

## Prerequisites
- PHP 8.1+ with extensions: `mbstring`, `pdo_mysql`, `openssl`, `tokenizer`, `json`, `bcmath`, `calendar`
- MySQL 5.7+ / MariaDB 10.3+
- Apache with `mod_rewrite` enabled
- Composer (on local machine)
- Node.js 18+ (on local machine for building)

## Quick Deploy

### Option A: Automated Build (Recommended)
```bash
cd laravel-backend
bash deploy.sh
```
This creates a `smarterp_deploy_*.zip` file ready for upload.

### Option B: Manual Steps

#### 1. Build Frontend
```bash
npm install && npm run build
```

#### 2. Install Laravel Dependencies
```bash
cd laravel-backend
composer install --no-dev --optimize-autoloader
```

#### 3. Copy Frontend to Laravel
```bash
cp -r ../dist/assets public/
cp ../dist/index.html public/
cp ../dist/favicon.ico public/
```

## Server Setup

### 1. Upload Files
Upload the `laravel-backend/` folder content to your server:
```
/home/username/erp/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/          ← Set as document root
│   ├── .htaccess
│   ├── index.html   ← React SPA
│   ├── index.php    ← Laravel entry
│   ├── assets/      ← React build assets
│   └── storage/     ← Symlink to ../storage/app/public
├── resources/
├── routes/
├── storage/
├── vendor/
├── .env
├── artisan
└── composer.json
```

### 2. Set Document Root
In cPanel → Domains → Set document root to:
```
/home/username/erp/public
```

### 3. Create Database
In cPanel → MySQL Databases:
1. Create database: `username_erp`
2. Create user: `username_erpuser`
3. Add user to database with **ALL PRIVILEGES**

### 4. Configure Environment
```bash
cp .env.example .env
nano .env  # Edit with your credentials
```

### 5. Initialize Application
```bash
cd /home/username/erp
php artisan key:generate
php artisan migrate --force
php artisan db:seed          # Optional: seed demo data
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

### 6. Set Up Cron Job
In cPanel → Cron Jobs, add:
```
* * * * * cd /home/username/erp && php artisan schedule:run >> /dev/null 2>&1
```

This handles:
- Auto-marking offline users (every 2 minutes)
- Scheduled backups (if configured)

## Security Checklist
- [ ] `APP_DEBUG=false` in `.env`
- [ ] `APP_ENV=production` in `.env`
- [ ] Strong `APP_KEY` generated
- [ ] Database credentials are secure
- [ ] `.htaccess` blocks access to `.env`, `.sql`, `.json` files
- [ ] SSL certificate installed (HTTPS)
- [ ] `storage/` has correct permissions (775)
- [ ] Remove any installer scripts after setup

## Super Admin Setup
The first user created with `employee_id = NULL` is a Super Admin with full access.
All other users must have roles assigned via the Roles management page.

## Troubleshooting

### 404 on all routes
- Ensure `mod_rewrite` is enabled: `a2enmod rewrite`
- Check `.htaccess` is being processed (AllowOverride All)

### 500 Internal Server Error
- Check `storage/logs/laravel.log`
- Verify file permissions: `chmod -R 775 storage bootstrap/cache`
- Run `php artisan config:clear`

### CORS Errors
- Update `SANCTUM_STATEFUL_DOMAINS` in `.env`
- Update `CORS_ALLOWED_ORIGINS` in `.env`

### Login Issues
- Verify `php artisan migrate` ran successfully
- Check that the `users` table has at least one Super Admin user

### File Upload Issues
- Ensure `storage/app/public` exists
- Run `php artisan storage:link`
- Check `upload_max_filesize` in `php.ini` (recommend 10M+)

## Performance Optimization
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Run these after any config or route changes.
