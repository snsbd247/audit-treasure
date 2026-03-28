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

        // Chart of Accounts - Bangladesh Standard
        $accounts = [
            // [code, name, type, parentCode]
            ['1000', 'Assets', 'asset', null],
            ['1100', 'Current Assets', 'asset', '1000'],
            ['1101', 'Cash in Hand', 'asset', '1100'],
            ['1102', 'Bank Account', 'asset', '1100'],
            ['1103', 'Accounts Receivable', 'asset', '1100'],
            ['1104', 'Advance to Supplier', 'asset', '1100'],
            ['1105', 'Inventory', 'asset', '1100'],
            ['1106', 'Prepaid Expenses', 'asset', '1100'],
            ['1200', 'Fixed Assets', 'asset', '1000'],
            ['1201', 'Furniture & Fixtures', 'asset', '1200'],
            ['1202', 'Office Equipment', 'asset', '1200'],
            ['1203', 'Vehicles', 'asset', '1200'],
            ['1204', 'Building', 'asset', '1200'],
            ['1205', 'Accumulated Depreciation', 'asset', '1200'],
            ['2000', 'Liabilities', 'liability', null],
            ['2100', 'Current Liabilities', 'liability', '2000'],
            ['2101', 'Accounts Payable', 'liability', '2100'],
            ['2102', 'Supplier Payable', 'liability', '2100'],
            ['2103', 'Accrued Expenses', 'liability', '2100'],
            ['2104', 'VAT Payable', 'liability', '2100'],
            ['2105', 'Loan Payable (Short Term)', 'liability', '2100'],
            ['2200', 'Long-Term Liabilities', 'liability', '2000'],
            ['2201', 'Bank Loan', 'liability', '2200'],
            ['2202', 'Directors Loan', 'liability', '2200'],
            ['3000', 'Equity', 'equity', null],
            ['3101', 'Owner Capital', 'equity', '3000'],
            ['3102', 'Retained Earnings', 'equity', '3000'],
            ['3103', 'Drawings', 'equity', '3000'],
            ['4000', 'Income', 'income', null],
            ['4101', 'Sales Revenue', 'income', '4000'],
            ['4102', 'Service Income', 'income', '4000'],
            ['4103', 'Other Income', 'income', '4000'],
            ['4104', 'Discount Received', 'income', '4000'],
            ['5000', 'Expenses', 'expense', null],
            ['5100', 'Direct Expenses', 'expense', '5000'],
            ['5101', 'Purchase', 'expense', '5100'],
            ['5102', 'Cost of Goods Sold', 'expense', '5100'],
            ['5200', 'Operating Expenses', 'expense', '5000'],
            ['5201', 'Salary Expense', 'expense', '5200'],
            ['5202', 'Rent Expense', 'expense', '5200'],
            ['5203', 'Utility Bills', 'expense', '5200'],
            ['5204', 'Office Expense', 'expense', '5200'],
            ['5205', 'Transportation', 'expense', '5200'],
            ['5206', 'Marketing Expense', 'expense', '5200'],
            ['5207', 'Internet Bill', 'expense', '5200'],
            ['5208', 'Maintenance Expense', 'expense', '5200'],
            ['5300', 'Financial Expenses', 'expense', '5000'],
            ['5301', 'Bank Charge', 'expense', '5300'],
            ['5302', 'Interest Expense', 'expense', '5300'],
            ['6000', 'VAT & TAX', 'liability', null],
            ['6101', 'Input VAT', 'asset', '6000'],
            ['6102', 'Output VAT', 'liability', '6000'],
            ['6103', 'VAT Payable', 'liability', '6000'],
        ];
        $parentMap = [];
        foreach ($accounts as [$code, $name, $type, $parentCode]) {
            $acct = ChartOfAccount::create([
                'account_code' => $code,
                'account_name' => $name,
                'account_type' => $type,
                'parent_id' => $parentCode ? ($parentMap[$parentCode] ?? null) : null,
            ]);
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