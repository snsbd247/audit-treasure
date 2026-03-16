<?php

use Illuminate\Support\Facades\Route;

// Auth (public)
Route::prefix('auth')->group(function () {
    Route::post('login', [\App\Http\Controllers\Auth\AuthController::class, 'login']);
});

// Protected routes
Route::middleware(['auth:sanctum', \App\Http\Middleware\BranchScope::class])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('logout', [\App\Http\Controllers\Auth\AuthController::class, 'logout']);
        Route::get('me', [\App\Http\Controllers\Auth\AuthController::class, 'me']);
        Route::post('change-password', [\App\Http\Controllers\Auth\AuthController::class, 'changePassword']);
    });

    // ─── Accounting ──────────────────────────────────────────
    Route::prefix('v1')->group(function () {

        // Chart of Accounts
        Route::get('accounts/tree', [\App\Http\Controllers\Accounting\AccountController::class, 'tree']);
        Route::get('accounts/{id}/ledger', [\App\Http\Controllers\Accounting\AccountController::class, 'ledger']);
        Route::apiResource('accounts', \App\Http\Controllers\Accounting\AccountController::class);

        // Vouchers
        Route::post('vouchers/{id}/approve', [\App\Http\Controllers\Accounting\VoucherController::class, 'approve']);
        Route::post('vouchers/{id}/reject', [\App\Http\Controllers\Accounting\VoucherController::class, 'reject']);
        Route::apiResource('vouchers', \App\Http\Controllers\Accounting\VoucherController::class)->only(['index', 'store', 'show']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('trial-balance', [\App\Http\Controllers\Accounting\ReportController::class, 'trialBalance']);
            Route::get('profit-loss', [\App\Http\Controllers\Accounting\ReportController::class, 'profitLoss']);
            Route::get('balance-sheet', [\App\Http\Controllers\Accounting\ReportController::class, 'balanceSheet']);
        });

        // ─── Sales ───────────────────────────────────────────────
        Route::apiResource('sales-invoices', \App\Http\Controllers\Sales\SalesInvoiceController::class)->only(['index', 'store', 'show']);

        // ─── Purchase ────────────────────────────────────────────
        Route::apiResource('purchases', \App\Http\Controllers\Purchase\PurchaseController::class)->only(['index', 'store', 'show']);

        // ─── Inventory ───────────────────────────────────────────
        Route::apiResource('items', \App\Http\Controllers\Inventory\ItemController::class);
        Route::apiResource('warehouses', \App\Http\Controllers\Inventory\WarehouseController::class);

        // ─── Manufacturing ───────────────────────────────────────
        Route::apiResource('production', \App\Http\Controllers\Manufacturing\ProductionController::class)->only(['index', 'store', 'show']);

        // ─── HRM ─────────────────────────────────────────────────
        Route::apiResource('employees', \App\Http\Controllers\HRM\EmployeeController::class);
        Route::apiResource('attendance', \App\Http\Controllers\HRM\AttendanceController::class)->only(['index', 'store', 'update']);

        // ─── Payroll ─────────────────────────────────────────────
        Route::post('payroll/process', [\App\Http\Controllers\Payroll\PayrollController::class, 'process']);
        Route::post('payroll/{id}/approve', [\App\Http\Controllers\Payroll\PayrollController::class, 'approve']);
        Route::apiResource('payroll', \App\Http\Controllers\Payroll\PayrollController::class)->only(['index', 'show']);

        // ─── Admin ───────────────────────────────────────────────
        Route::apiResource('users', \App\Http\Controllers\Admin\UserController::class);
        Route::apiResource('roles', \App\Http\Controllers\Admin\RoleController::class);
        Route::get('settings/company', [\App\Http\Controllers\Admin\SettingsController::class, 'show']);
        Route::put('settings/company', [\App\Http\Controllers\Admin\SettingsController::class, 'update']);

        // ─── Simple CRUD resources ──────────────────────────────
        Route::apiResource('branches', \App\Http\Controllers\Admin\BranchController::class);
        Route::apiResource('customers', \App\Http\Controllers\Sales\CustomerController::class);
        Route::apiResource('suppliers', \App\Http\Controllers\Purchase\SupplierController::class);
        Route::apiResource('departments', \App\Http\Controllers\HRM\DepartmentController::class);
        Route::apiResource('designations', \App\Http\Controllers\HRM\DesignationController::class);
        Route::apiResource('shifts', \App\Http\Controllers\HRM\ShiftController::class);
        Route::apiResource('leave-types', \App\Http\Controllers\HRM\LeaveTypeController::class);
        Route::apiResource('leave-requests', \App\Http\Controllers\HRM\LeaveRequestController::class);
        Route::apiResource('item-categories', \App\Http\Controllers\Inventory\ItemCategoryController::class);
        Route::apiResource('units', \App\Http\Controllers\Inventory\UnitController::class);
        Route::apiResource('salary-structures', \App\Http\Controllers\Payroll\SalaryStructureController::class);
        Route::apiResource('financial-years', \App\Http\Controllers\Admin\FinancialYearController::class);
        Route::apiResource('bom', \App\Http\Controllers\Manufacturing\BomController::class);

        // Audit Log (read-only)
        Route::get('audit-log', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\AuditLog::query();
            if ($request->module) $query->where('module', $request->module);
            if ($request->from) $query->where('created_at', '>=', $request->from);
            if ($request->to) $query->where('created_at', '<=', $request->to);
            return response()->json(['success' => true, 'data' => $query->orderByDesc('created_at')->paginate(50)->items()]);
        });
    });
});
