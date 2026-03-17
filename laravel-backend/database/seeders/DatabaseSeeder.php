<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\{Branch, User, CustomRole, RolePermission, FinancialYear, CompanySetting, NumberSequence, ChartOfAccount, Unit, ItemCategory, Department, Designation, Shift, LeaveType};

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Branch
        $branch = Branch::create(['code' => 'HQ', 'name' => 'Head Office', 'phone' => '+1234567890', 'address' => '123 Main St']);

        // All permission modules (must match frontend MODULES list & route middleware)
        $allModules = [
            // Core
            'dashboard',
            // Accounting
            'accounts', 'journal', 'payment', 'receipt', 'contra',
            // Business
            'sales', 'purchase', 'inventory', 'manufacturing', 'bank',
            // HRM
            'hrm',
            // Reports
            'reports',
            // Administration
            'branches', 'users', 'roles', 'financial_years',
            'settings', 'audit_log', 'backup',
        ];

        // Super Admin Role (all permissions)
        $superAdmin = CustomRole::create(['name' => 'Super Admin', 'description' => 'Full system access']);
        foreach ($allModules as $mod) {
            RolePermission::create(['custom_role_id' => $superAdmin->id, 'module' => $mod, 'can_view' => 1, 'can_add' => 1, 'can_edit' => 1, 'can_delete' => 1]);
        }

        // Staff role (limited — business modules only, no delete)
        $staff = CustomRole::create(['name' => 'Staff', 'description' => 'Standard staff access']);
        foreach (['dashboard', 'accounts', 'journal', 'payment', 'receipt', 'contra', 'sales', 'purchase', 'inventory', 'reports'] as $mod) {
            RolePermission::create(['custom_role_id' => $staff->id, 'module' => $mod, 'can_view' => 1, 'can_add' => 1, 'can_edit' => 1, 'can_delete' => 0]);
        }

        // Admin User (employee_id = NULL → Super Admin)
        $admin = User::create([
            'username' => 'admin',
            'name' => 'System Administrator',
            'email' => 'admin@erp.com',
            'password' => Hash::make('admin123'),
            'branch_id' => $branch->id,
            'employee_id' => null, // NULL = Super Admin
        ]);
        $admin->roles()->attach($superAdmin->id);

        // Financial Year
        $fy = FinancialYear::create(['name' => 'FY 2025-2026', 'start_date' => '2025-07-01', 'end_date' => '2026-06-30', 'is_active' => 1]);

        // Company Settings
        CompanySetting::create(['company_name' => 'My ERP Company', 'currency_code' => 'USD', 'currency_symbol' => '$', 'currency_name' => 'US Dollar', 'default_branch_id' => $branch->id, 'default_financial_year_id' => $fy->id]);

        // Number Sequences
        $sequences = [
            ['id' => 'sales_invoice', 'prefix' => 'INV', 'description' => 'Sales Invoice'],
            ['id' => 'purchase', 'prefix' => 'PUR', 'description' => 'Purchase'],
            ['id' => 'sales_return', 'prefix' => 'SRN', 'description' => 'Sales Return'],
            ['id' => 'purchase_return', 'prefix' => 'PRN', 'description' => 'Purchase Return'],
            ['id' => 'production', 'prefix' => 'PRD', 'description' => 'Production'],
            ['id' => 'stock_transfer', 'prefix' => 'STR', 'description' => 'Stock Transfer'],
            ['id' => 'journal_voucher', 'prefix' => 'JV', 'description' => 'Journal Voucher'],
            ['id' => 'payment_voucher', 'prefix' => 'PV', 'description' => 'Payment Voucher'],
            ['id' => 'receipt_voucher', 'prefix' => 'RV', 'description' => 'Receipt Voucher'],
            ['id' => 'contra_voucher', 'prefix' => 'CV', 'description' => 'Contra Voucher'],
        ];
        foreach ($sequences as $s) NumberSequence::create(array_merge($s, ['current_number' => 0, 'year' => 2026]));

        // Chart of Accounts
        $accounts = [
            ['1000', 'Assets', 'asset'], ['1100', 'Cash', 'asset'], ['1200', 'Bank', 'asset'],
            ['1300', 'Accounts Receivable', 'asset'], ['1400', 'Inventory', 'asset'],
            ['2000', 'Liabilities', 'liability'], ['2100', 'Accounts Payable', 'liability'],
            ['3000', 'Equity', 'equity'], ['3100', 'Capital', 'equity'], ['3200', 'Retained Earnings', 'equity'],
            ['4000', 'Income', 'income'], ['4100', 'Sales', 'income'], ['4200', 'Sales Return', 'income'],
            ['5000', 'Expenses', 'expense'], ['5100', 'Purchase', 'expense'], ['5200', 'Purchase Return', 'expense'],
            ['5300', 'Salary Expense', 'expense'], ['5400', 'Raw Material', 'expense'],
            ['5500', 'Manufacturing Overhead', 'expense'], ['5600', 'Work in Progress', 'expense'],
        ];
        $parentMap = [];
        foreach ($accounts as [$code, $name, $type]) {
            $parentCode = strlen($code) > 4 ? substr($code, 0, 1) . '000' : null;
            $acct = ChartOfAccount::create(['account_code' => $code, 'account_name' => $name, 'account_type' => $type, 'parent_id' => $parentMap[$parentCode] ?? null]);
            $parentMap[$code] = $acct->id;
        }

        // Units
        foreach ([['Pieces', 'pcs'], ['Kilograms', 'kg'], ['Liters', 'ltr'], ['Meters', 'm']] as [$n, $a]) Unit::create(['name' => $n, 'abbreviation' => $a]);

        // Item Categories
        foreach (['Raw Materials', 'Finished Goods', 'Trading Goods', 'Services'] as $c) ItemCategory::create(['name' => $c]);

        // HRM basics
        foreach (['Administration', 'Production', 'Sales', 'Finance'] as $d) Department::create(['name' => $d]);
        foreach (['Manager', 'Supervisor', 'Officer', 'Worker'] as $d) Designation::create(['name' => $d]);
        Shift::create(['shift_name' => 'Day Shift', 'start_time' => '09:00', 'end_time' => '17:00', 'late_after_minutes' => 15]);
        Shift::create(['shift_name' => 'Night Shift', 'start_time' => '21:00', 'end_time' => '05:00', 'late_after_minutes' => 15]);
        foreach (['Annual Leave' => 14, 'Sick Leave' => 10, 'Casual Leave' => 7] as $n => $d) LeaveType::create(['name' => $n, 'days_per_year' => $d]);
    }
}