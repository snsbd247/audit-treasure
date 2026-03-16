# SmartERP - cPanel Deployment Guide

## Requirements

- **PHP**: 7.4+ (recommended 8.1+)
- **MySQL**: 5.7+ or MariaDB 10.3+
- **Apache**: with mod_rewrite enabled
- **Node.js**: 18+ (for building the frontend only - not needed on server)

## Step 1: Build the Frontend

On your local machine, run:

```bash
npm run build
```

This creates a `dist/` folder with the production-ready frontend.

## Step 2: Prepare the API Configuration

Edit `deploy/api/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_DATABASE', 'your_cpanel_db_name');
define('DB_USERNAME', 'your_cpanel_db_user');
define('DB_PASSWORD', 'your_db_password');
define('APP_URL', 'https://yourdomain.com/erp');
define('APP_SECRET', 'random-64-char-string');
define('JWT_SECRET', 'another-random-64-char-string');
```

## Step 3: Upload to cPanel

1. Login to cPanel → File Manager
2. Navigate to `public_html/erp/` (create `erp` folder if needed)
3. Upload the following structure:

```
public_html/erp/
├── .htaccess              ← from deploy/.htaccess
├── index.html             ← from dist/index.html
├── assets/                ← from dist/assets/
├── favicon.ico            ← from dist/favicon.ico
├── erp_mysql.sql          ← from deploy/erp_mysql.sql
└── api/
    ├── .htaccess          ← from deploy/api/.htaccess
    ├── index.php          ← from deploy/api/index.php
    ├── config.php         ← from deploy/api/config.php
    ├── db.php             ← from deploy/api/db.php
    ├── auth.php           ← from deploy/api/auth.php
    ├── install.php        ← from deploy/api/install.php
    └── uploads/           ← create empty folder (chmod 755)
```

## Step 4: Create MySQL Database

In cPanel:
1. Go to **MySQL Databases**
2. Create database: `erp_db`
3. Create user: `erp_user` with a strong password
4. Add user to database with **ALL PRIVILEGES**

## Step 5: Run Installer

1. Visit: `https://yourdomain.com/erp/api/install.php`
2. Enter your MySQL credentials
3. The installer will import the schema and demo data
4. Create your Super Admin account
5. **DELETE `install.php` after installation!**

## Step 6: Update Frontend API URL

Before building, update `src/lib/api-client.ts` to point to your server:

```typescript
const API_BASE = 'https://yourdomain.com/erp/api';
```

Then rebuild with `npm run build`.

## Step 7: Configure Vite Base Path

In `vite.config.ts`, add:

```typescript
export default defineConfig({
  base: '/erp/',
  // ... rest of config
});
```

## Troubleshooting

### 404 errors on routes
Ensure `mod_rewrite` is enabled and `.htaccess` files are being processed.
In cPanel, check Apache Handlers.

### Database connection errors
Verify your cPanel MySQL user has privileges on the database.
Use the full cPanel username format: `cpanel_username_dbuser`.

### CORS errors
Update `CORS_ORIGIN` in `config.php` with your exact domain.

### File upload issues
Ensure `api/uploads/` directory exists and has chmod 755/775.

## Security Checklist

- [ ] Delete `install.php` after installation
- [ ] Change `APP_SECRET` and `JWT_SECRET` to random strings
- [ ] Set `DEBUG_MODE` to `false`
- [ ] Restrict `CORS_ORIGIN` to your domain
- [ ] Set up SSL certificate (HTTPS)
- [ ] Remove `erp_mysql.sql` from server after import
