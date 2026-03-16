<?php
/**
 * SmartERP - Database & Application Configuration
 * Update these values for your cPanel hosting environment.
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_DATABASE', 'erp_db');
define('DB_USERNAME', 'erp_user');
define('DB_PASSWORD', 'yourpassword');
define('DB_CHARSET', 'utf8mb4');

// Application Settings
define('APP_NAME', 'SmartERP');
define('APP_VERSION', '1.0');
define('APP_URL', 'https://yourdomain.com/erp');
define('APP_SECRET', 'change-this-to-a-random-64-char-string');

// JWT Settings
define('JWT_SECRET', 'change-this-to-another-random-64-char-string');
define('JWT_EXPIRY', 86400 * 7); // 7 days

// Upload Settings
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024); // 10MB

// CORS - Update with your frontend URL
define('CORS_ORIGIN', '*');

// Error Reporting (set to 0 in production)
define('DEBUG_MODE', false);
