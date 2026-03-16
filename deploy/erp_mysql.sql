-- ============================================================
-- SmartERP MySQL Database Schema
-- Generated: 2026-03-16
-- Compatible with: MySQL 5.7+ / MariaDB 10.3+
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- DROP EXISTING TABLES (in dependency order)
-- ============================================================
DROP TABLE IF EXISTS `voucher_entries`;
DROP TABLE IF EXISTS `acc_vouchers`;
DROP TABLE IF EXISTS `stock_ledger`;
DROP TABLE IF EXISTS `stock_movements`;
DROP TABLE IF EXISTS `warehouse_stock`;
DROP TABLE IF EXISTS `stock_transfers`;
DROP TABLE IF EXISTS `production_materials`;
DROP TABLE IF EXISTS `production_entries`;
DROP TABLE IF EXISTS `bom_items`;
DROP TABLE IF EXISTS `bill_of_materials`;
DROP TABLE IF EXISTS `sales_return_items`;
DROP TABLE IF EXISTS `sales_returns`;
DROP TABLE IF EXISTS `sales_invoice_items`;
DROP TABLE IF EXISTS `sales_invoices`;
DROP TABLE IF EXISTS `purchase_return_items`;
DROP TABLE IF EXISTS `purchase_returns`;
DROP TABLE IF EXISTS `purchase_items`;
DROP TABLE IF EXISTS `purchases`;
DROP TABLE IF EXISTS `payroll`;
DROP TABLE IF EXISTS `salary_structures`;
DROP TABLE IF EXISTS `overtime_records`;
DROP TABLE IF EXISTS `leave_requests`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `biometric_logs`;
DROP TABLE IF EXISTS `face_data`;
DROP TABLE IF EXISTS `employee_documents`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `item_master`;
DROP TABLE IF EXISTS `raw_materials`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `product_categories`;
DROP TABLE IF EXISTS `item_categories`;
DROP TABLE IF EXISTS `warehouses`;
DROP TABLE IF EXISTS `units`;
DROP TABLE IF EXISTS `leave_types`;
DROP TABLE IF EXISTS `shifts`;
DROP TABLE IF EXISTS `designations`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `chart_of_accounts`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `user_custom_roles`;
DROP TABLE IF EXISTS `custom_roles`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `user_favorite_pages`;
DROP TABLE IF EXISTS `profiles`;
DROP TABLE IF EXISTS `page_shortcuts`;
DROP TABLE IF EXISTS `module_settings`;
DROP TABLE IF EXISTS `number_sequences`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `backup_history`;
DROP TABLE IF EXISTS `backup_settings`;
DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `company_settings`;
DROP TABLE IF EXISTS `financial_years`;
DROP TABLE IF EXISTS `branches`;
DROP TABLE IF EXISTS `users`;

-- ============================================================
-- USERS TABLE (replaces Supabase auth.users)
-- ============================================================
CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_sign_in` DATETIME NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BRANCHES
-- ============================================================
CREATE TABLE `branches` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_branches_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FINANCIAL YEARS
-- ============================================================
CREATE TABLE `financial_years` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COMPANY SETTINGS
-- ============================================================
CREATE TABLE `company_settings` (
  `id` VARCHAR(50) NOT NULL DEFAULT 'default',
  `company_name` VARCHAR(255) NOT NULL DEFAULT '',
  `company_logo_url` TEXT NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `website` VARCHAR(255) NULL,
  `currency_name` VARCHAR(50) NOT NULL DEFAULT 'US Dollar',
  `currency_code` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `currency_symbol` VARCHAR(10) NOT NULL DEFAULT '$',
  `currency_position` VARCHAR(10) NOT NULL DEFAULT 'before',
  `default_branch_id` CHAR(36) NULL,
  `default_financial_year_id` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cs_branch` (`default_branch_id`),
  KEY `fk_cs_fy` (`default_financial_year_id`),
  CONSTRAINT `fk_cs_branch` FOREIGN KEY (`default_branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cs_fy` FOREIGN KEY (`default_financial_year_id`) REFERENCES `financial_years`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE `profiles` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `username` VARCHAR(100) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `branch_id` CHAR(36) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_profiles_username` (`username`),
  KEY `fk_profiles_branch` (`branch_id`),
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_profiles_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE `user_roles` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('super_admin','admin','staff') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_roles` (`user_id`, `role`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CUSTOM ROLES & PERMISSIONS
-- ============================================================
CREATE TABLE `custom_roles` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_custom_roles` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `custom_role_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ucr_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ucr_role` FOREIGN KEY (`custom_role_id`) REFERENCES `custom_roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
  `id` CHAR(36) NOT NULL,
  `custom_role_id` CHAR(36) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `can_view` TINYINT(1) NOT NULL DEFAULT 0,
  `can_add` TINYINT(1) NOT NULL DEFAULT 0,
  `can_edit` TINYINT(1) NOT NULL DEFAULT 0,
  `can_delete` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_rp_role` (`custom_role_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`custom_role_id`) REFERENCES `custom_roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER FAVORITES
-- ============================================================
CREATE TABLE `user_favorite_pages` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `page_url` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ufp_user` (`user_id`),
  CONSTRAINT `fk_ufp_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CHART OF ACCOUNTS
-- ============================================================
CREATE TABLE `chart_of_accounts` (
  `id` CHAR(36) NOT NULL,
  `account_code` VARCHAR(20) NOT NULL,
  `account_name` VARCHAR(255) NOT NULL,
  `account_type` VARCHAR(50) NOT NULL,
  `parent_id` CHAR(36) NULL,
  `opening_balance` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `opening_balance_type` VARCHAR(10) NOT NULL DEFAULT 'debit',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coa_code` (`account_code`),
  KEY `fk_coa_parent` (`parent_id`),
  CONSTRAINT `fk_coa_parent` FOREIGN KEY (`parent_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEPARTMENTS & DESIGNATIONS
-- ============================================================
CREATE TABLE `departments` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `designations` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SHIFTS
-- ============================================================
CREATE TABLE `shifts` (
  `id` CHAR(36) NOT NULL,
  `shift_name` VARCHAR(100) NOT NULL,
  `start_time` TIME NOT NULL DEFAULT '09:00:00',
  `end_time` TIME NOT NULL DEFAULT '17:00:00',
  `late_after_minutes` INT NOT NULL DEFAULT 15,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LEAVE TYPES
-- ============================================================
CREATE TABLE `leave_types` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `days_per_year` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- UNITS
-- ============================================================
CREATE TABLE `units` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `abbreviation` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ITEM CATEGORIES
-- ============================================================
CREATE TABLE `item_categories` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `parent_id` CHAR(36) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ic_parent` (`parent_id`),
  CONSTRAINT `fk_ic_parent` FOREIGN KEY (`parent_id`) REFERENCES `item_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WAREHOUSES
-- ============================================================
CREATE TABLE `warehouses` (
  `id` CHAR(36) NOT NULL,
  `warehouse_name` VARCHAR(100) NOT NULL,
  `warehouse_code` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `branch_id` CHAR(36) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wh_code` (`warehouse_code`),
  KEY `fk_wh_branch` (`branch_id`),
  CONSTRAINT `fk_wh_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CUSTOMERS & SUPPLIERS
-- ============================================================
CREATE TABLE `customers` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `suppliers` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCT CATEGORIES (legacy)
-- ============================================================
CREATE TABLE `product_categories` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCTS (legacy)
-- ============================================================
CREATE TABLE `products` (
  `id` CHAR(36) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_code` VARCHAR(50) NOT NULL,
  `category_id` CHAR(36) NULL,
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `selling_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'pcs',
  `low_stock_threshold` INT NOT NULL DEFAULT 10,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_prod_cat` (`category_id`),
  CONSTRAINT `fk_prod_cat` FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RAW MATERIALS
-- ============================================================
CREATE TABLE `raw_materials` (
  `id` CHAR(36) NOT NULL,
  `material_code` VARCHAR(50) NOT NULL,
  `material_name` VARCHAR(255) NOT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'pcs',
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `supplier_id` CHAR(36) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rm_supplier` (`supplier_id`),
  CONSTRAINT `fk_rm_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ITEM MASTER
-- ============================================================
CREATE TABLE `item_master` (
  `id` CHAR(36) NOT NULL,
  `item_code` VARCHAR(50) NOT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `item_type` VARCHAR(50) NOT NULL DEFAULT 'product',
  `description` TEXT NULL,
  `category_id` CHAR(36) NULL,
  `unit_id` CHAR(36) NULL,
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `selling_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `opening_stock` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `min_stock_level` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `is_stock_item` TINYINT(1) NOT NULL DEFAULT 1,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_im_code` (`item_code`),
  KEY `fk_im_cat` (`category_id`),
  KEY `fk_im_unit` (`unit_id`),
  CONSTRAINT `fk_im_cat` FOREIGN KEY (`category_id`) REFERENCES `item_categories`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_im_unit` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE `employees` (
  `id` CHAR(36) NOT NULL,
  `employee_code` VARCHAR(50) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NULL,
  `mobile` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `national_id` VARCHAR(50) NULL,
  `photo_url` TEXT NULL,
  `department_id` CHAR(36) NULL,
  `designation_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `shift_id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `joining_date` DATE NOT NULL,
  `salary` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `employment_type` VARCHAR(30) NOT NULL DEFAULT 'permanent',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_code` (`employee_code`),
  KEY `fk_emp_dept` (`department_id`),
  KEY `fk_emp_desg` (`designation_id`),
  KEY `fk_emp_branch` (`branch_id`),
  KEY `fk_emp_shift` (`shift_id`),
  CONSTRAINT `fk_emp_dept` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_emp_desg` FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_emp_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_emp_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EMPLOYEE DOCUMENTS
-- ============================================================
CREATE TABLE `employee_documents` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `document_type` VARCHAR(100) NOT NULL,
  `document_title` VARCHAR(255) NOT NULL,
  `document_html` LONGTEXT NULL,
  `generated_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ed_emp` (`employee_id`),
  CONSTRAINT `fk_ed_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FACE DATA
-- ============================================================
CREATE TABLE `face_data` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `photo_url` TEXT NULL,
  `face_encoding` LONGTEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_fd_emp` (`employee_id`),
  CONSTRAINT `fk_fd_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BIOMETRIC LOGS
-- ============================================================
CREATE TABLE `biometric_logs` (
  `id` CHAR(36) NOT NULL,
  `employee_code` VARCHAR(50) NOT NULL,
  `device_id` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `check_in_time` TIME NULL,
  `check_out_time` TIME NULL,
  `processed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE `attendance` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `check_in` TIME NULL,
  `check_out` TIME NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'present',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_att_emp` (`employee_id`),
  CONSTRAINT `fk_att_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE `leave_requests` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `leave_type_id` CHAR(36) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `reason` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `approved_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_lr_emp` (`employee_id`),
  KEY `fk_lr_lt` (`leave_type_id`),
  CONSTRAINT `fk_lr_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lr_lt` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- OVERTIME RECORDS
-- ============================================================
CREATE TABLE `overtime_records` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `hours` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `approved_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ot_emp` (`employee_id`),
  CONSTRAINT `fk_ot_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SALARY STRUCTURES
-- ============================================================
CREATE TABLE `salary_structures` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `basic_salary` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `allowances` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `deductions` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `effective_from` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ss_emp` (`employee_id`),
  CONSTRAINT `fk_ss_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ACC VOUCHERS
-- ============================================================
CREATE TABLE `acc_vouchers` (
  `id` CHAR(36) NOT NULL,
  `voucher_number` VARCHAR(50) NOT NULL,
  `voucher_type` VARCHAR(30) NOT NULL,
  `voucher_date` DATE NOT NULL,
  `description` TEXT NULL,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `branch_id` CHAR(36) NULL,
  `financial_year_id` CHAR(36) NULL,
  `created_by` CHAR(36) NULL,
  `approved_by` CHAR(36) NULL,
  `approved_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_av_number` (`voucher_number`),
  KEY `fk_av_branch` (`branch_id`),
  KEY `fk_av_fy` (`financial_year_id`),
  CONSTRAINT `fk_av_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_av_fy` FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VOUCHER ENTRIES
-- ============================================================
CREATE TABLE `voucher_entries` (
  `id` CHAR(36) NOT NULL,
  `voucher_id` CHAR(36) NOT NULL,
  `account_id` CHAR(36) NOT NULL,
  `debit` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `credit` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `narration` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_ve_voucher` (`voucher_id`),
  KEY `fk_ve_account` (`account_id`),
  CONSTRAINT `fk_ve_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `acc_vouchers`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ve_account` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAYROLL
-- ============================================================
CREATE TABLE `payroll` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `month` INT NOT NULL,
  `year` INT NOT NULL,
  `basic_salary` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `allowances` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `deductions` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `net_salary` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `voucher_id` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pay_emp` (`employee_id`),
  KEY `fk_pay_voucher` (`voucher_id`),
  CONSTRAINT `fk_pay_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pay_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `acc_vouchers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PURCHASES
-- ============================================================
CREATE TABLE `purchases` (
  `id` CHAR(36) NOT NULL,
  `purchase_number` VARCHAR(50) NOT NULL,
  `purchase_date` DATE NOT NULL,
  `supplier_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(30) NULL DEFAULT 'cash',
  `notes` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'completed',
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pur_number` (`purchase_number`),
  KEY `fk_pur_supplier` (`supplier_id`),
  KEY `fk_pur_branch` (`branch_id`),
  CONSTRAINT `fk_pur_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pur_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_items` (
  `id` CHAR(36) NOT NULL,
  `purchase_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_pi_purchase` (`purchase_id`),
  KEY `fk_pi_product` (`product_id`),
  CONSTRAINT `fk_pi_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pi_product` FOREIGN KEY (`product_id`) REFERENCES `item_master`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PURCHASE RETURNS
-- ============================================================
CREATE TABLE `purchase_returns` (
  `id` CHAR(36) NOT NULL,
  `return_number` VARCHAR(50) NOT NULL,
  `return_date` DATE NOT NULL,
  `purchase_id` CHAR(36) NULL,
  `supplier_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `reason` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pret_purchase` (`purchase_id`),
  KEY `fk_pret_supplier` (`supplier_id`),
  KEY `fk_pret_branch` (`branch_id`),
  CONSTRAINT `fk_pret_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pret_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pret_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_return_items` (
  `id` CHAR(36) NOT NULL,
  `purchase_return_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_pri_return` (`purchase_return_id`),
  KEY `fk_pri_product` (`product_id`),
  CONSTRAINT `fk_pri_return` FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pri_product` FOREIGN KEY (`product_id`) REFERENCES `item_master`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SALES INVOICES
-- ============================================================
CREATE TABLE `sales_invoices` (
  `id` CHAR(36) NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `invoice_date` DATE NOT NULL,
  `customer_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `net_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'completed',
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_si_number` (`invoice_number`),
  KEY `fk_si_customer` (`customer_id`),
  KEY `fk_si_branch` (`branch_id`),
  CONSTRAINT `fk_si_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_si_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_invoice_items` (
  `id` CHAR(36) NOT NULL,
  `sales_invoice_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_sii_invoice` (`sales_invoice_id`),
  KEY `fk_sii_product` (`product_id`),
  CONSTRAINT `fk_sii_invoice` FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sii_product` FOREIGN KEY (`product_id`) REFERENCES `item_master`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SALES RETURNS
-- ============================================================
CREATE TABLE `sales_returns` (
  `id` CHAR(36) NOT NULL,
  `return_number` VARCHAR(50) NOT NULL,
  `return_date` DATE NOT NULL,
  `sales_invoice_id` CHAR(36) NULL,
  `customer_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `reason` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sret_invoice` (`sales_invoice_id`),
  KEY `fk_sret_customer` (`customer_id`),
  KEY `fk_sret_branch` (`branch_id`),
  CONSTRAINT `fk_sret_invoice` FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sret_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sret_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_return_items` (
  `id` CHAR(36) NOT NULL,
  `sales_return_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_sri_return` (`sales_return_id`),
  KEY `fk_sri_product` (`product_id`),
  CONSTRAINT `fk_sri_return` FOREIGN KEY (`sales_return_id`) REFERENCES `sales_returns`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sri_product` FOREIGN KEY (`product_id`) REFERENCES `item_master`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BILL OF MATERIALS
-- ============================================================
CREATE TABLE `bill_of_materials` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_bom_product` (`product_id`),
  CONSTRAINT `fk_bom_product` FOREIGN KEY (`product_id`) REFERENCES `item_master`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bom_items` (
  `id` CHAR(36) NOT NULL,
  `bom_id` CHAR(36) NOT NULL,
  `material_id` CHAR(36) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 1,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'pcs',
  PRIMARY KEY (`id`),
  KEY `fk_bi_bom` (`bom_id`),
  KEY `fk_bi_material` (`material_id`),
  CONSTRAINT `fk_bi_bom` FOREIGN KEY (`bom_id`) REFERENCES `bill_of_materials`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bi_material` FOREIGN KEY (`material_id`) REFERENCES `item_master`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCTION ENTRIES
-- ============================================================
CREATE TABLE `production_entries` (
  `id` CHAR(36) NOT NULL,
  `production_number` VARCHAR(50) NOT NULL,
  `production_date` DATE NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `bom_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 1,
  `raw_material_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `labor_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `electricity_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `total_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'completed',
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pe_product` (`product_id`),
  KEY `fk_pe_bom` (`bom_id`),
  KEY `fk_pe_branch` (`branch_id`),
  CONSTRAINT `fk_pe_product` FOREIGN KEY (`product_id`) REFERENCES `item_master`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pe_bom` FOREIGN KEY (`bom_id`) REFERENCES `bill_of_materials`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pe_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `production_materials` (
  `id` CHAR(36) NOT NULL,
  `production_id` CHAR(36) NOT NULL,
  `material_id` CHAR(36) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_pm_production` (`production_id`),
  KEY `fk_pm_material` (`material_id`),
  CONSTRAINT `fk_pm_production` FOREIGN KEY (`production_id`) REFERENCES `production_entries`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pm_material` FOREIGN KEY (`material_id`) REFERENCES `item_master`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STOCK TRANSFERS
-- ============================================================
CREATE TABLE `stock_transfers` (
  `id` CHAR(36) NOT NULL,
  `transfer_number` VARCHAR(50) NOT NULL,
  `transfer_date` DATE NOT NULL,
  `item_id` CHAR(36) NOT NULL,
  `from_warehouse_id` CHAR(36) NOT NULL,
  `to_warehouse_id` CHAR(36) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL,
  `notes` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'completed',
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_st_item` (`item_id`),
  KEY `fk_st_from` (`from_warehouse_id`),
  KEY `fk_st_to` (`to_warehouse_id`),
  CONSTRAINT `fk_st_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_st_from` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_st_to` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WAREHOUSE STOCK
-- ============================================================
CREATE TABLE `warehouse_stock` (
  `id` CHAR(36) NOT NULL,
  `item_id` CHAR(36) NOT NULL,
  `warehouse_id` CHAR(36) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ws_item_wh` (`item_id`, `warehouse_id`),
  KEY `fk_ws_item` (`item_id`),
  KEY `fk_ws_wh` (`warehouse_id`),
  CONSTRAINT `fk_ws_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ws_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
CREATE TABLE `stock_movements` (
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `item_id` CHAR(36) NULL,
  `warehouse_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `movement_type` VARCHAR(50) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sm_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STOCK LEDGER
-- ============================================================
CREATE TABLE `stock_ledger` (
  `id` CHAR(36) NOT NULL,
  `item_id` CHAR(36) NOT NULL,
  `warehouse_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `transaction_type` VARCHAR(50) NOT NULL,
  `transaction_id` CHAR(36) NULL,
  `reference_number` VARCHAR(50) NULL,
  `transaction_date` DATE NOT NULL,
  `quantity_in` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `quantity_out` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `balance_quantity` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `unit_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `total_value` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sl_item` (`item_id`),
  KEY `idx_sl_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE `system_settings` (
  `id` CHAR(36) NOT NULL,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL DEFAULT '',
  `is_encrypted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ss_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NUMBER SEQUENCES
-- ============================================================
CREATE TABLE `number_sequences` (
  `id` VARCHAR(50) NOT NULL,
  `prefix` VARCHAR(20) NOT NULL,
  `current_number` INT NOT NULL DEFAULT 0,
  `year` INT NOT NULL,
  `description` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MODULE SETTINGS
-- ============================================================
CREATE TABLE `module_settings` (
  `id` CHAR(36) NOT NULL,
  `module_key` VARCHAR(50) NOT NULL,
  `module_name` VARCHAR(100) NOT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_by` CHAR(36) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ms_key` (`module_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAGE SHORTCUTS
-- ============================================================
CREATE TABLE `page_shortcuts` (
  `id` CHAR(36) NOT NULL,
  `module_name` VARCHAR(100) NOT NULL,
  `page_name` VARCHAR(255) NOT NULL,
  `page_url` VARCHAR(255) NOT NULL,
  `shortcut_code` VARCHAR(20) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ps_code` (`shortcut_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE `audit_log` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `user_name` VARCHAR(255) NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `record_id` VARCHAR(100) NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_al_module` (`module`),
  KEY `idx_al_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BACKUP SETTINGS & HISTORY
-- ============================================================
CREATE TABLE `backup_settings` (
  `id` VARCHAR(50) NOT NULL DEFAULT 'default',
  `auto_backup_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `schedule_interval` VARCHAR(20) NOT NULL DEFAULT 'daily',
  `retention_days` INT NOT NULL DEFAULT 30,
  `last_auto_backup_at` DATETIME NULL,
  `updated_by` CHAR(36) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `backup_history` (
  `id` CHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `backup_type` VARCHAR(20) NOT NULL DEFAULT 'manual',
  `format` VARCHAR(20) NOT NULL DEFAULT 'json',
  `status` VARCHAR(20) NOT NULL DEFAULT 'completed',
  `file_size` BIGINT NOT NULL DEFAULT 0,
  `tables_count` INT NOT NULL DEFAULT 0,
  `records_count` INT NOT NULL DEFAULT 0,
  `storage_path` TEXT NULL,
  `error_message` TEXT NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DEMO DATA
-- ============================================================

-- Branches
INSERT INTO `branches` (`id`, `name`, `code`, `address`, `phone`, `status`) VALUES
('b0000000-0000-0000-0000-000000000001', 'Dhaka Head Office', 'DHK', '123 Motijheel, Dhaka-1000', '+880-2-1234567', 'active'),
('b0000000-0000-0000-0000-000000000002', 'Chittagong Branch', 'CTG', '45 Agrabad, Chittagong-4100', '+880-31-7654321', 'active');

-- Financial Years
INSERT INTO `financial_years` (`id`, `name`, `start_date`, `end_date`, `is_active`) VALUES
('f1000000-0000-0000-0000-000000000001', '2025-2026', '2025-07-01', '2026-06-30', 1),
('f1000000-0000-0000-0000-000000000002', '2024-2025', '2024-07-01', '2025-06-30', 0);

-- Company Settings
INSERT INTO `company_settings` (`id`, `company_name`, `address`, `phone`, `email`, `website`, `currency_name`, `currency_code`, `currency_symbol`, `currency_position`, `default_branch_id`, `default_financial_year_id`) VALUES
('default', 'Demo Trading & Manufacturing Ltd', '123 Motijheel, Dhaka-1000, Bangladesh', '+880-2-1234567', 'info@demotrading.com', 'www.demotrading.com', 'Bangladeshi Taka', 'BDT', '৳', 'before', 'b0000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001');

-- System Settings (Branding)
INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`) VALUES
(UUID(), 'software_name', 'SmartERP'),
(UUID(), 'software_version', '1.0'),
(UUID(), 'footer_text', '© 2026 SmartERP. All Rights Reserved.'),
(UUID(), 'developer_name', 'Sync & Solutions IT'),
(UUID(), 'white_label_mode', 'false'),
(UUID(), 'primary_color', '143 87% 37%'),
(UUID(), 'secondary_color', '220 14% 96%');

-- Number Sequences
INSERT INTO `number_sequences` (`id`, `prefix`, `current_number`, `year`, `description`) VALUES
('journal_voucher', 'JV', 7, 2026, 'Journal Voucher'),
('payment_voucher', 'PV', 2, 2026, 'Payment Voucher'),
('receipt_voucher', 'RV', 1, 2026, 'Receipt Voucher'),
('contra_voucher', 'CV', 1, 2026, 'Contra Voucher'),
('sales_invoice', 'SI', 3, 2026, 'Sales Invoice'),
('purchase_entry', 'PI', 4, 2026, 'Purchase Entry'),
('sales_return', 'SR', 0, 2026, 'Sales Return'),
('purchase_return', 'PR', 0, 2026, 'Purchase Return'),
('production_entry', 'PRD', 1, 2026, 'Production Entry'),
('stock_transfer', 'ST', 0, 2026, 'Stock Transfer');

-- Module Settings
INSERT INTO `module_settings` (`id`, `module_key`, `module_name`, `is_enabled`) VALUES
(UUID(), 'accounts', 'Accounting', 1),
(UUID(), 'bank', 'Banking', 1),
(UUID(), 'hrm', 'HRM', 1),
(UUID(), 'inventory', 'Inventory', 1),
(UUID(), 'manufacturing', 'Manufacturing', 1),
(UUID(), 'multi_branch', 'Multi Branch', 1),
(UUID(), 'multi_warehouse', 'Multi Warehouse', 1),
(UUID(), 'purchase', 'Purchase', 1),
(UUID(), 'reports', 'Reports', 1),
(UUID(), 'sales', 'Sales', 1);

-- Departments
INSERT INTO `departments` (`id`, `name`, `status`) VALUES
('d0000000-0000-0000-0000-000000000001', 'Administration', 'active'),
('d0000000-0000-0000-0000-000000000002', 'Sales', 'active'),
('d0000000-0000-0000-0000-000000000003', 'Production', 'active'),
('d0000000-0000-0000-0000-000000000004', 'Accounts', 'active');

-- Designations
INSERT INTO `designations` (`id`, `name`, `status`) VALUES
('de000000-0000-0000-0000-000000000001', 'Manager', 'active'),
('de000000-0000-0000-0000-000000000002', 'Senior Executive', 'active'),
('de000000-0000-0000-0000-000000000003', 'Executive', 'active'),
('de000000-0000-0000-0000-000000000004', 'Operator', 'active');

-- Shifts
INSERT INTO `shifts` (`id`, `shift_name`, `start_time`, `end_time`, `late_after_minutes`) VALUES
('00000000-0000-0000-0005-000000000001', 'Morning Shift', '09:00:00', '17:00:00', 15),
('00000000-0000-0000-0005-000000000002', 'Evening Shift', '14:00:00', '22:00:00', 15);

-- Leave Types
INSERT INTO `leave_types` (`id`, `name`, `days_per_year`) VALUES
('00000000-0000-0000-0006-000000000001', 'Annual Leave', 14),
('00000000-0000-0000-0006-000000000002', 'Sick Leave', 10),
('00000000-0000-0000-0006-000000000003', 'Casual Leave', 7);

-- Units
INSERT INTO `units` (`id`, `name`, `abbreviation`) VALUES
('00000000-0000-0000-0001-000000000001', 'Piece', 'pcs'),
('00000000-0000-0000-0001-000000000002', 'Kilogram', 'kg'),
('00000000-0000-0000-0001-000000000003', 'Box', 'box'),
('00000000-0000-0000-0001-000000000004', 'Meter', 'm'),
('00000000-0000-0000-0001-000000000005', 'Liter', 'ltr');

-- Item Categories
INSERT INTO `item_categories` (`id`, `name`, `description`, `is_active`) VALUES
('00000000-0000-0000-0002-000000000001', 'Electronics', 'Electronic products and devices', 1),
('00000000-0000-0000-0002-000000000002', 'Raw Materials', 'Manufacturing raw materials', 1),
('00000000-0000-0000-0002-000000000003', 'Packaging', 'Packaging materials', 1),
('00000000-0000-0000-0002-000000000004', 'Services', 'Service items', 1);

-- Warehouses
INSERT INTO `warehouses` (`id`, `warehouse_name`, `warehouse_code`, `branch_id`, `status`) VALUES
('00000000-0000-0000-0003-000000000001', 'Main Warehouse', 'WH-MAIN', 'b0000000-0000-0000-0000-000000000001', 'active'),
('00000000-0000-0000-0003-000000000002', 'Raw Material Warehouse', 'WH-RAW', 'b0000000-0000-0000-0000-000000000001', 'active'),
('00000000-0000-0000-0003-000000000003', 'Finished Goods Warehouse', 'WH-FG', 'b0000000-0000-0000-0000-000000000001', 'active');

-- Customers
INSERT INTO `customers` (`id`, `name`, `email`, `phone`, `address`, `status`) VALUES
('c0000000-0000-0000-0000-000000000001', 'ABC Traders', 'abc@traders.com', '01711-111111', '10 Banani, Dhaka', 'active'),
('c0000000-0000-0000-0000-000000000002', 'XYZ Corporation', 'info@xyz.com', '01722-222222', '25 Gulshan, Dhaka', 'active'),
('c0000000-0000-0000-0000-000000000003', 'Rahim Enterprise', 'rahim@enterprise.com', '01733-333333', '8 Dhanmondi, Dhaka', 'active');

-- Suppliers
INSERT INTO `suppliers` (`id`, `name`, `email`, `phone`, `address`, `status`) VALUES
('50000000-0000-0000-0000-000000000001', 'Tech Supply Ltd', 'sales@techsupply.com', '01811-111111', '15 Tejgaon, Dhaka', 'active'),
('50000000-0000-0000-0000-000000000002', 'Raw Material Supplier', 'info@rawmat.com', '01822-222222', '32 Tongi, Gazipur', 'active'),
('50000000-0000-0000-0000-000000000003', 'Packaging Supplier', 'order@packco.com', '01833-333333', '7 Savar, Dhaka', 'active');

-- Item Master
INSERT INTO `item_master` (`id`, `item_code`, `item_name`, `item_type`, `category_id`, `unit_id`, `cost_price`, `selling_price`, `min_stock_level`, `is_stock_item`, `status`) VALUES
('00000000-0000-0000-0004-000000000001', 'PROD-001', 'Router', 'product', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 2500, 3500, 10, 1, 'active'),
('00000000-0000-0000-0004-000000000002', 'PROD-002', 'ONU Device', 'product', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 1800, 2800, 5, 1, 'active'),
('00000000-0000-0000-0004-000000000003', 'PROD-003', 'Network Cable (Cat6)', 'product', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000004', 15, 25, 100, 1, 'active'),
('00000000-0000-0000-0004-000000000004', 'RAW-001', 'Plastic Granules', 'raw_material', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', 80, 0, 50, 1, 'active'),
('00000000-0000-0000-0004-000000000005', 'RAW-002', 'Copper Wire', 'raw_material', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', 600, 0, 20, 1, 'active'),
('00000000-0000-0000-0004-000000000006', 'PKG-001', 'Packaging Box (Small)', 'product', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 10, 0, 100, 1, 'active'),
('00000000-0000-0000-0004-000000000007', 'SRV-001', 'Installation Service', 'service', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000001', 0, 2000, 0, 0, 'active'),
('00000000-0000-0000-0004-000000000008', 'PROD-004', 'Plastic Bottle', 'product', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 50, 120, 50, 1, 'active');

-- Employees
INSERT INTO `employees` (`id`, `employee_code`, `first_name`, `last_name`, `email`, `mobile`, `department_id`, `designation_id`, `branch_id`, `shift_id`, `joining_date`, `salary`, `employment_type`, `status`) VALUES
('e0000000-0000-0000-0000-000000000001', 'EMP-001', 'Kamal', 'Hossain', 'kamal@demo.com', '01911-111111', 'd0000000-0000-0000-0000-000000000001', 'de000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000001', '2023-01-15', 45000, 'permanent', 'active'),
('e0000000-0000-0000-0000-000000000002', 'EMP-002', 'Fatema', 'Begum', 'fatema@demo.com', '01922-222222', 'd0000000-0000-0000-0000-000000000002', 'de000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000001', '2023-06-01', 28000, 'permanent', 'active'),
('e0000000-0000-0000-0000-000000000003', 'EMP-003', 'Raju', 'Ahmed', 'raju@demo.com', '01933-333333', 'd0000000-0000-0000-0000-000000000003', 'de000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000001', '2024-01-10', 22000, 'permanent', 'active'),
('e0000000-0000-0000-0000-000000000004', 'EMP-004', 'Nasreen', 'Akter', 'nasreen@demo.com', '01944-444444', 'd0000000-0000-0000-0000-000000000004', 'de000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000001', '2023-03-20', 35000, 'permanent', 'active');

-- Chart of Accounts
INSERT INTO `chart_of_accounts` (`id`, `account_code`, `account_name`, `account_type`, `parent_id`, `opening_balance`, `opening_balance_type`, `is_active`) VALUES
('a0000000-0000-0000-0000-000000000001', '1000', 'Assets', 'asset', NULL, 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000002', '1100', 'Cash', 'asset', 'a0000000-0000-0000-0000-000000000001', 500000, 'debit', 1),
('a0000000-0000-0000-0000-000000000003', '1200', 'Bank - Sonali Bank', 'asset', 'a0000000-0000-0000-0000-000000000001', 1000000, 'debit', 1),
('a0000000-0000-0000-0000-000000000004', '1300', 'Accounts Receivable', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000005', '1400', 'Inventory', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000006', '1500', 'Fixed Assets', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000007', '1510', 'Office Equipment', 'asset', 'a0000000-0000-0000-0000-000000000006', 200000, 'debit', 1),
('a0000000-0000-0000-0000-000000000008', '1600', 'Raw Material Stock', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000009', '1700', 'Work in Progress', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000010', '2000', 'Liabilities', 'liability', NULL, 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000011', '2100', 'Accounts Payable', 'liability', 'a0000000-0000-0000-0000-000000000010', 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000012', '2200', 'Salary Payable', 'liability', 'a0000000-0000-0000-0000-000000000010', 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000013', '2300', 'Tax Payable', 'liability', 'a0000000-0000-0000-0000-000000000010', 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000014', '3000', 'Equity', 'equity', NULL, 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000015', '3100', 'Owner Capital', 'equity', 'a0000000-0000-0000-0000-000000000014', 1700000, 'credit', 1),
('a0000000-0000-0000-0000-000000000016', '3200', 'Retained Earnings', 'equity', 'a0000000-0000-0000-0000-000000000014', 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000017', '4000', 'Income', 'income', NULL, 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000018', '4100', 'Sales Revenue', 'income', 'a0000000-0000-0000-0000-000000000017', 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000019', '4200', 'Service Revenue', 'income', 'a0000000-0000-0000-0000-000000000017', 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000020', '4300', 'Other Income', 'income', 'a0000000-0000-0000-0000-000000000017', 0, 'credit', 1),
('a0000000-0000-0000-0000-000000000021', '5000', 'Expenses', 'expense', NULL, 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000022', '5100', 'Cost of Goods Sold', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000023', '5200', 'Salary Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000024', '5300', 'Rent Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000025', '5400', 'Utilities Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000026', '5500', 'Office Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000027', '5600', 'Transport Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000028', '5700', 'Marketing Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000029', '5800', 'Manufacturing Overhead', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1),
('a0000000-0000-0000-0000-000000000030', '5900', 'Depreciation Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit', 1);

-- Backup Settings
INSERT INTO `backup_settings` (`id`, `auto_backup_enabled`, `schedule_interval`, `retention_days`) VALUES
('default', 0, 'daily', 30);

-- Page Shortcuts
INSERT INTO `page_shortcuts` (`id`, `module_name`, `page_name`, `page_url`, `shortcut_code`, `is_active`) VALUES
(UUID(), 'Dashboard', 'Dashboard', '/', 'D1', 1),
(UUID(), 'Accounts', 'Chart of Accounts', '/accounts/chart', 'A10', 1),
(UUID(), 'Accounts', 'Accounting Vouchers', '/accounts/vouchers', 'A20', 1),
(UUID(), 'Accounts', 'Journal Voucher', '/accounts/vouchers?type=journal', 'A30', 1),
(UUID(), 'Accounts', 'Payment Voucher', '/accounts/vouchers?type=payment', 'A40', 1),
(UUID(), 'Accounts', 'Receipt Voucher', '/accounts/vouchers?type=receipt', 'A50', 1),
(UUID(), 'Accounts', 'Contra Voucher', '/accounts/vouchers?type=contra', 'A60', 1),
(UUID(), 'Sales', 'Sales Invoices', '/sales', 'S10', 1),
(UUID(), 'Sales', 'Customers', '/customers', 'S20', 1),
(UUID(), 'Purchase', 'Purchases', '/purchases', 'P10', 1),
(UUID(), 'Purchase', 'Suppliers', '/suppliers', 'P20', 1),
(UUID(), 'Inventory', 'Item Master', '/inventory/items', 'I10', 1),
(UUID(), 'Inventory', 'Item Categories', '/inventory/categories', 'I20', 1),
(UUID(), 'Inventory', 'Units', '/inventory/units', 'I30', 1),
(UUID(), 'Inventory', 'Warehouses', '/inventory/warehouses', 'I40', 1),
(UUID(), 'Inventory', 'Stock Ledger', '/inventory/stock-ledger', 'I50', 1),
(UUID(), 'Inventory', 'Stock Transfer', '/inventory/stock-transfer', 'I60', 1),
(UUID(), 'Inventory', 'Stock Adjustment', '/inventory/stock-adjustment', 'I70', 1),
(UUID(), 'Inventory', 'Inventory Overview', '/inventory', 'I80', 1),
(UUID(), 'Manufacturing', 'Bill of Materials', '/manufacturing/bom', 'M10', 1),
(UUID(), 'Manufacturing', 'Production Entries', '/manufacturing/production', 'M20', 1),
(UUID(), 'Manufacturing', 'Raw Materials', '/manufacturing/raw-materials', 'M30', 1),
(UUID(), 'Manufacturing', 'Manufacturing Reports', '/manufacturing/reports', 'M40', 1),
(UUID(), 'HRM', 'Employees', '/hrm/employees', 'H10', 1),
(UUID(), 'HRM', 'Departments', '/hrm/departments', 'H20', 1),
(UUID(), 'HRM', 'Designations', '/hrm/designations', 'H30', 1),
(UUID(), 'HRM', 'Attendance', '/hrm/attendance', 'H40', 1),
(UUID(), 'HRM', 'Leave Management', '/hrm/leave', 'H50', 1),
(UUID(), 'HRM', 'Payroll', '/hrm/payroll', 'H60', 1),
(UUID(), 'HRM', 'Shifts', '/hrm/shifts', 'H70', 1),
(UUID(), 'HRM', 'Overtime', '/hrm/overtime', 'H80', 1),
(UUID(), 'HRM', 'HR Dashboard', '/hrm/dashboard', 'H90', 1),
(UUID(), 'HRM', 'HR Reports', '/hrm/reports', 'H95', 1),
(UUID(), 'Bank', 'Bank Accounts', '/bank/accounts', 'B10', 1),
(UUID(), 'Bank', 'Cash Book', '/bank/cashbook', 'B20', 1),
(UUID(), 'Reports', 'Financial Reports', '/reports/financial', 'R10', 1),
(UUID(), 'Reports', 'Trial Balance', '/reports/trial-balance', 'R20', 1),
(UUID(), 'Reports', 'Balance Sheet', '/reports/balance-sheet', 'R30', 1),
(UUID(), 'Reports', 'Profit & Loss', '/reports/profit-loss', 'R40', 1),
(UUID(), 'Reports', 'Account Ledger', '/reports/account-ledger', 'R50', 1),
(UUID(), 'Reports', 'General Ledger', '/reports/general-ledger', 'R60', 1),
(UUID(), 'Reports', 'Cash Book Report', '/reports/cashbook', 'R70', 1),
(UUID(), 'Reports', 'Bank Book Report', '/reports/bankbook', 'R80', 1),
(UUID(), 'Reports', 'Stock Reports', '/reports/stock', 'R90', 1),
(UUID(), 'Reports', 'Stock Ledger Report', '/reports/stock-ledger', 'R95', 1),
(UUID(), 'Admin', 'General Settings', '/admin/settings', 'X10', 1),
(UUID(), 'Admin', 'User Management', '/admin/users', 'X20', 1),
(UUID(), 'Admin', 'Roles & Permissions', '/admin/roles', 'X30', 1),
(UUID(), 'Admin', 'Branches', '/admin/branches', 'X40', 1),
(UUID(), 'Admin', 'Financial Years', '/financial-years', 'X50', 1),
(UUID(), 'Admin', 'Document Numbering', '/admin/document-numbering', 'X60', 1),
(UUID(), 'Admin', 'Branding', '/admin/branding', 'X70', 1),
(UUID(), 'Admin', 'Audit Log', '/admin/audit-log', 'X80', 1),
(UUID(), 'Admin', 'Backup & Restore', '/admin/backup', 'X90', 1),
(UUID(), 'Admin', 'Page Shortcuts', '/admin/shortcuts', 'X95', 1),
(UUID(), 'Employee Portal', 'My Profile', '/portal/profile', 'EP10', 1),
(UUID(), 'Employee Portal', 'My Attendance', '/portal/attendance', 'EP20', 1),
(UUID(), 'Employee Portal', 'My Leave', '/portal/leave', 'EP30', 1),
(UUID(), 'Employee Portal', 'My Payslips', '/portal/payslips', 'EP40', 1),
(UUID(), 'Employee Portal', 'My Documents', '/portal/documents', 'EP50', 1),
(UUID(), 'Transactions', 'Expense Entry', '/transactions/expense', 'T10', 1),
(UUID(), 'Transactions', 'Income Entry', '/transactions/income', 'T20', 1);

-- ============================================================
-- END OF SCHEMA + DATA
-- ============================================================
