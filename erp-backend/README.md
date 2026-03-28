# ERP Laravel Backend

Full-featured ERP backend with modular architecture for cPanel/MySQL deployment.

## Modules
- **Accounting** – Double-entry, Chart of Accounts, Vouchers, GL
- **Sales** – Invoices, Returns, Customer management
- **Purchase** – Orders, Returns, Supplier management
- **Inventory** – Item Master, Warehouses, Stock Ledger, Transfers
- **Manufacturing** – BOM, Production Entries, Material consumption
- **HRM** – Employees, Attendance, Leave, Shifts, Departments
- **Payroll** – Salary Structures, Payroll processing, Payslips

## Architecture
```
Controllers → Services → Repositories → Models
```
- **Controllers**: Request validation, response formatting
- **Services**: Business logic, transaction orchestration
- **Repositories**: Database queries via Eloquent
- **Models**: Eloquent ORM with relationships

## Requirements
- PHP 8.1+
- MySQL 5.7+ / MariaDB 10.3+
- Composer 2.x
- Apache with mod_rewrite

## Installation

```bash
# 1. Clone/upload to server
cd /home/user/erp-backend

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. Setup environment
cp .env.example .env
php artisan key:generate

# 4. Edit .env with your database credentials
nano .env

# 5. Run migrations & seed
php artisan migrate --force
php artisan db:seed --force

# 6. Create symlink for storage
php artisan storage:link

# 7. Set permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

## cPanel Deployment

1. Upload project to a folder outside `public_html` (e.g., `/home/user/erp-backend/`)
2. In cPanel, create a subdomain or subdirectory pointing to `erp-backend/public`
3. Or symlink: `ln -s /home/user/erp-backend/public /home/user/public_html/erp/api`
4. Create MySQL database & user via cPanel
5. Update `.env` with credentials
6. Run `php artisan migrate --seed`

## Default Admin
- **Username**: admin
- **Password**: admin123 (change after first login)

## API Base URL
```
https://yourdomain.com/erp/api/v1
```

All endpoints require `Authorization: Bearer {token}` header except `/auth/login`.
