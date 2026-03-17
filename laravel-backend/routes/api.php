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

    Route::prefix('v1')->group(function () {

        // ─── Accounting (module: accounts) ──────────────────────
        Route::middleware('permission:accounts,view')->group(function () {
            Route::get('accounts/tree', [\App\Http\Controllers\Accounting\AccountController::class, 'tree']);
            Route::get('accounts/{id}/ledger', [\App\Http\Controllers\Accounting\AccountController::class, 'ledger']);
            Route::get('accounts', [\App\Http\Controllers\Accounting\AccountController::class, 'index']);
            Route::get('accounts/{id}', [\App\Http\Controllers\Accounting\AccountController::class, 'show']);
            Route::get('vouchers', [\App\Http\Controllers\Accounting\VoucherController::class, 'index']);
            Route::get('vouchers/{id}', [\App\Http\Controllers\Accounting\VoucherController::class, 'show']);
        });
        Route::middleware('permission:accounts,add')->group(function () {
            Route::post('accounts', [\App\Http\Controllers\Accounting\AccountController::class, 'store']);
            Route::post('vouchers', [\App\Http\Controllers\Accounting\VoucherController::class, 'store']);
        });
        Route::middleware('permission:accounts,edit')->group(function () {
            Route::put('accounts/{id}', [\App\Http\Controllers\Accounting\AccountController::class, 'update']);
            Route::post('vouchers/{id}/approve', [\App\Http\Controllers\Accounting\VoucherController::class, 'approve']);
            Route::post('vouchers/{id}/reject', [\App\Http\Controllers\Accounting\VoucherController::class, 'reject']);
        });
        Route::middleware('permission:accounts,delete')->group(function () {
            Route::delete('accounts/{id}', [\App\Http\Controllers\Accounting\AccountController::class, 'destroy']);
        });

        // ─── Reports (module: reports) ──────────────────────────
        Route::middleware('permission:reports,view')->prefix('reports')->group(function () {
            Route::get('trial-balance', [\App\Http\Controllers\Accounting\ReportController::class, 'trialBalance']);
            Route::get('profit-loss', [\App\Http\Controllers\Accounting\ReportController::class, 'profitLoss']);
            Route::get('balance-sheet', [\App\Http\Controllers\Accounting\ReportController::class, 'balanceSheet']);
        });

        // ─── Sales (module: sales) ──────────────────────────────
        Route::middleware('permission:sales,view')->group(function () {
            Route::get('sales-invoices', [\App\Http\Controllers\Sales\SalesInvoiceController::class, 'index']);
            Route::get('sales-invoices/{id}', [\App\Http\Controllers\Sales\SalesInvoiceController::class, 'show']);
            Route::get('customers', [\App\Http\Controllers\Sales\CustomerController::class, 'index']);
            Route::get('customers/{id}', [\App\Http\Controllers\Sales\CustomerController::class, 'show']);
        });
        Route::middleware('permission:sales,add')->group(function () {
            Route::post('sales-invoices', [\App\Http\Controllers\Sales\SalesInvoiceController::class, 'store']);
            Route::post('customers', [\App\Http\Controllers\Sales\CustomerController::class, 'store']);
        });
        Route::middleware('permission:sales,edit')->group(function () {
            Route::put('customers/{id}', [\App\Http\Controllers\Sales\CustomerController::class, 'update']);
        });
        Route::middleware('permission:sales,delete')->group(function () {
            Route::delete('customers/{id}', [\App\Http\Controllers\Sales\CustomerController::class, 'destroy']);
        });

        // ─── Purchase (module: purchase) ────────────────────────
        Route::middleware('permission:purchase,view')->group(function () {
            Route::get('purchases', [\App\Http\Controllers\Purchase\PurchaseController::class, 'index']);
            Route::get('purchases/{id}', [\App\Http\Controllers\Purchase\PurchaseController::class, 'show']);
            Route::get('suppliers', [\App\Http\Controllers\Purchase\SupplierController::class, 'index']);
            Route::get('suppliers/{id}', [\App\Http\Controllers\Purchase\SupplierController::class, 'show']);
        });
        Route::middleware('permission:purchase,add')->group(function () {
            Route::post('purchases', [\App\Http\Controllers\Purchase\PurchaseController::class, 'store']);
            Route::post('suppliers', [\App\Http\Controllers\Purchase\SupplierController::class, 'store']);
        });
        Route::middleware('permission:purchase,edit')->group(function () {
            Route::put('suppliers/{id}', [\App\Http\Controllers\Purchase\SupplierController::class, 'update']);
        });
        Route::middleware('permission:purchase,delete')->group(function () {
            Route::delete('suppliers/{id}', [\App\Http\Controllers\Purchase\SupplierController::class, 'destroy']);
        });

        // ─── Inventory (module: inventory) ──────────────────────
        Route::middleware('permission:inventory,view')->group(function () {
            Route::get('items', [\App\Http\Controllers\Inventory\ItemController::class, 'index']);
            Route::get('items/{id}', [\App\Http\Controllers\Inventory\ItemController::class, 'show']);
            Route::get('warehouses', [\App\Http\Controllers\Inventory\WarehouseController::class, 'index']);
            Route::get('warehouses/{id}', [\App\Http\Controllers\Inventory\WarehouseController::class, 'show']);
            Route::get('item-categories', [\App\Http\Controllers\Inventory\ItemCategoryController::class, 'index']);
            Route::get('item-categories/{id}', [\App\Http\Controllers\Inventory\ItemCategoryController::class, 'show']);
            Route::get('units', [\App\Http\Controllers\Inventory\UnitController::class, 'index']);
            Route::get('units/{id}', [\App\Http\Controllers\Inventory\UnitController::class, 'show']);
        });
        Route::middleware('permission:inventory,add')->group(function () {
            Route::post('items', [\App\Http\Controllers\Inventory\ItemController::class, 'store']);
            Route::post('warehouses', [\App\Http\Controllers\Inventory\WarehouseController::class, 'store']);
            Route::post('item-categories', [\App\Http\Controllers\Inventory\ItemCategoryController::class, 'store']);
            Route::post('units', [\App\Http\Controllers\Inventory\UnitController::class, 'store']);
        });
        Route::middleware('permission:inventory,edit')->group(function () {
            Route::put('items/{id}', [\App\Http\Controllers\Inventory\ItemController::class, 'update']);
            Route::put('warehouses/{id}', [\App\Http\Controllers\Inventory\WarehouseController::class, 'update']);
            Route::put('item-categories/{id}', [\App\Http\Controllers\Inventory\ItemCategoryController::class, 'update']);
            Route::put('units/{id}', [\App\Http\Controllers\Inventory\UnitController::class, 'update']);
        });
        Route::middleware('permission:inventory,delete')->group(function () {
            Route::delete('items/{id}', [\App\Http\Controllers\Inventory\ItemController::class, 'destroy']);
            Route::delete('warehouses/{id}', [\App\Http\Controllers\Inventory\WarehouseController::class, 'destroy']);
            Route::delete('item-categories/{id}', [\App\Http\Controllers\Inventory\ItemCategoryController::class, 'destroy']);
            Route::delete('units/{id}', [\App\Http\Controllers\Inventory\UnitController::class, 'destroy']);
        });

        // ─── Manufacturing (module: manufacturing) ──────────────
        Route::middleware('permission:manufacturing,view')->group(function () {
            Route::get('production', [\App\Http\Controllers\Manufacturing\ProductionController::class, 'index']);
            Route::get('production/{id}', [\App\Http\Controllers\Manufacturing\ProductionController::class, 'show']);
            Route::get('bom', [\App\Http\Controllers\Manufacturing\BomController::class, 'index']);
            Route::get('bom/{id}', [\App\Http\Controllers\Manufacturing\BomController::class, 'show']);
        });
        Route::middleware('permission:manufacturing,add')->group(function () {
            Route::post('production', [\App\Http\Controllers\Manufacturing\ProductionController::class, 'store']);
            Route::post('bom', [\App\Http\Controllers\Manufacturing\BomController::class, 'store']);
        });
        Route::middleware('permission:manufacturing,edit')->group(function () {
            Route::put('bom/{id}', [\App\Http\Controllers\Manufacturing\BomController::class, 'update']);
        });
        Route::middleware('permission:manufacturing,delete')->group(function () {
            Route::delete('bom/{id}', [\App\Http\Controllers\Manufacturing\BomController::class, 'destroy']);
        });

        // ─── HRM (module: hrm) ─────────────────────────────────
        Route::middleware('permission:hrm,view')->group(function () {
            // HR Dashboard
            Route::get('hr-dashboard', [\App\Http\Controllers\HRM\HrDashboardController::class, 'index']);

            Route::get('employees', [\App\Http\Controllers\HRM\EmployeeController::class, 'index']);
            Route::get('employees/{id}', [\App\Http\Controllers\HRM\EmployeeController::class, 'show']);
            Route::get('employees/{id}/bank-info', fn($id) => response()->json(['success' => true, 'data' => \App\Models\EmployeeBankInfo::where('employee_id', $id)->first()]));
            Route::get('employees/{id}/education', fn($id) => response()->json(['success' => true, 'data' => \App\Models\EmployeeEducation::where('employee_id', $id)->get()]));
            Route::get('employees/{id}/experience', fn($id) => response()->json(['success' => true, 'data' => \App\Models\EmployeeExperience::where('employee_id', $id)->get()]));
            Route::get('employees/{id}/emergency-contacts', fn($id) => response()->json(['success' => true, 'data' => \App\Models\EmployeeEmergencyContact::where('employee_id', $id)->get()]));
            Route::get('attendance', [\App\Http\Controllers\HRM\AttendanceController::class, 'index']);
            Route::get('departments', [\App\Http\Controllers\HRM\DepartmentController::class, 'index']);
            Route::get('departments/{id}', [\App\Http\Controllers\HRM\DepartmentController::class, 'show']);
            Route::get('designations', [\App\Http\Controllers\HRM\DesignationController::class, 'index']);
            Route::get('designations/{id}', [\App\Http\Controllers\HRM\DesignationController::class, 'show']);
            Route::get('shifts', [\App\Http\Controllers\HRM\ShiftController::class, 'index']);
            Route::get('shifts/{id}', [\App\Http\Controllers\HRM\ShiftController::class, 'show']);
            Route::get('leave-types', [\App\Http\Controllers\HRM\LeaveTypeController::class, 'index']);
            Route::get('leave-types/{id}', [\App\Http\Controllers\HRM\LeaveTypeController::class, 'show']);
            Route::get('leave-requests', [\App\Http\Controllers\HRM\LeaveRequestController::class, 'index']);
            Route::get('leave-requests/{id}', [\App\Http\Controllers\HRM\LeaveRequestController::class, 'show']);
            Route::get('overtime', [\App\Http\Controllers\HRM\OvertimeController::class, 'index']);
            Route::get('payroll', [\App\Http\Controllers\Payroll\PayrollController::class, 'index']);
            Route::get('payroll/{id}', [\App\Http\Controllers\Payroll\PayrollController::class, 'show']);
            Route::get('salary-structures', [\App\Http\Controllers\Payroll\SalaryStructureController::class, 'index']);
            Route::get('salary-structures/{id}', [\App\Http\Controllers\Payroll\SalaryStructureController::class, 'show']);
        });
        Route::middleware('permission:hrm,add')->group(function () {
            Route::post('employees', [\App\Http\Controllers\HRM\EmployeeController::class, 'store']);
            Route::post('attendance', [\App\Http\Controllers\HRM\AttendanceController::class, 'store']);
            Route::post('attendance/bulk', [\App\Http\Controllers\HRM\AttendanceController::class, 'bulkStore']);
            Route::post('departments', [\App\Http\Controllers\HRM\DepartmentController::class, 'store']);
            Route::post('designations', [\App\Http\Controllers\HRM\DesignationController::class, 'store']);
            Route::post('shifts', [\App\Http\Controllers\HRM\ShiftController::class, 'store']);
            Route::post('leave-types', [\App\Http\Controllers\HRM\LeaveTypeController::class, 'store']);
            Route::post('leave-requests', [\App\Http\Controllers\HRM\LeaveRequestController::class, 'store']);
            Route::post('overtime', [\App\Http\Controllers\HRM\OvertimeController::class, 'store']);
            Route::post('payroll/process', [\App\Http\Controllers\Payroll\PayrollController::class, 'process']);
            Route::post('salary-structures', [\App\Http\Controllers\Payroll\SalaryStructureController::class, 'store']);
        });
        Route::middleware('permission:hrm,edit')->group(function () {
            Route::put('employees/{id}', [\App\Http\Controllers\HRM\EmployeeController::class, 'update']);
            Route::put('attendance/{id}', [\App\Http\Controllers\HRM\AttendanceController::class, 'update']);
            Route::put('departments/{id}', [\App\Http\Controllers\HRM\DepartmentController::class, 'update']);
            Route::put('designations/{id}', [\App\Http\Controllers\HRM\DesignationController::class, 'update']);
            Route::put('shifts/{id}', [\App\Http\Controllers\HRM\ShiftController::class, 'update']);
            Route::put('leave-types/{id}', [\App\Http\Controllers\HRM\LeaveTypeController::class, 'update']);
            Route::put('leave-requests/{id}', [\App\Http\Controllers\HRM\LeaveRequestController::class, 'update']);
            Route::put('overtime/{id}', [\App\Http\Controllers\HRM\OvertimeController::class, 'update']);
            Route::post('overtime/{id}/approve', [\App\Http\Controllers\HRM\OvertimeController::class, 'approve']);
            Route::post('payroll/{id}/approve', [\App\Http\Controllers\Payroll\PayrollController::class, 'approve']);
            Route::post('payroll/approve-all', [\App\Http\Controllers\Payroll\PayrollController::class, 'approveAll']);
            Route::put('salary-structures/{id}', [\App\Http\Controllers\Payroll\SalaryStructureController::class, 'update']);
        });
        Route::middleware('permission:hrm,delete')->group(function () {
            Route::delete('employees/{id}', [\App\Http\Controllers\HRM\EmployeeController::class, 'destroy']);
            Route::delete('departments/{id}', [\App\Http\Controllers\HRM\DepartmentController::class, 'destroy']);
            Route::delete('designations/{id}', [\App\Http\Controllers\HRM\DesignationController::class, 'destroy']);
            Route::delete('shifts/{id}', [\App\Http\Controllers\HRM\ShiftController::class, 'destroy']);
            Route::delete('leave-types/{id}', [\App\Http\Controllers\HRM\LeaveTypeController::class, 'destroy']);
            Route::delete('leave-requests/{id}', [\App\Http\Controllers\HRM\LeaveRequestController::class, 'destroy']);
            Route::delete('overtime/{id}', [\App\Http\Controllers\HRM\OvertimeController::class, 'destroy']);
            Route::delete('salary-structures/{id}', [\App\Http\Controllers\Payroll\SalaryStructureController::class, 'destroy']);
        });

        // ─── Administration (module: administration) ────────────
        Route::middleware('permission:administration,view')->group(function () {
            Route::get('users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
            Route::get('users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'show']);
            Route::get('users/{id}/check-related', [\App\Http\Controllers\Admin\UserController::class, 'checkRelated']);
            Route::get('roles', [\App\Http\Controllers\Admin\RoleController::class, 'index']);
            Route::get('roles/{id}', [\App\Http\Controllers\Admin\RoleController::class, 'show']);
            Route::get('branches', [\App\Http\Controllers\Admin\BranchController::class, 'index']);
            Route::get('branches/{id}', [\App\Http\Controllers\Admin\BranchController::class, 'show']);
            Route::get('financial-years', [\App\Http\Controllers\Admin\FinancialYearController::class, 'index']);
            Route::get('financial-years/{id}', [\App\Http\Controllers\Admin\FinancialYearController::class, 'show']);
            Route::get('settings/company', [\App\Http\Controllers\Admin\SettingsController::class, 'show']);
        });
        Route::middleware('permission:administration,add')->group(function () {
            Route::post('users', [\App\Http\Controllers\Admin\UserController::class, 'store']);
            Route::post('roles', [\App\Http\Controllers\Admin\RoleController::class, 'store']);
            Route::post('branches', [\App\Http\Controllers\Admin\BranchController::class, 'store']);
            Route::post('financial-years', [\App\Http\Controllers\Admin\FinancialYearController::class, 'store']);
        });
        Route::middleware('permission:administration,edit')->group(function () {
            Route::put('users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'update']);
            Route::put('roles/{id}', [\App\Http\Controllers\Admin\RoleController::class, 'update']);
            Route::put('branches/{id}', [\App\Http\Controllers\Admin\BranchController::class, 'update']);
            Route::put('financial-years/{id}', [\App\Http\Controllers\Admin\FinancialYearController::class, 'update']);
            Route::put('settings/company', [\App\Http\Controllers\Admin\SettingsController::class, 'update']);
        });
        Route::middleware('permission:administration,delete')->group(function () {
            Route::delete('users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'destroy']);
            Route::post('users/{id}/transfer-delete', [\App\Http\Controllers\Admin\UserController::class, 'transferAndDelete']);
            Route::delete('roles/{id}', [\App\Http\Controllers\Admin\RoleController::class, 'destroy']);
            Route::delete('branches/{id}', [\App\Http\Controllers\Admin\BranchController::class, 'destroy']);
            Route::delete('financial-years/{id}', [\App\Http\Controllers\Admin\FinancialYearController::class, 'destroy']);
        });

        // ─── Audit Log (read-only, admin only) ──────────────────
        Route::middleware('permission:administration,view')->group(function () {
            Route::get('audit-log', function (\Illuminate\Http\Request $request) {
                $query = \App\Models\AuditLog::query();
                if ($request->module) $query->where('module', $request->module);
                if ($request->action) $query->where('action', $request->action);
                if ($request->user_id) $query->where('user_id', $request->user_id);
                if ($request->from) $query->where('created_at', '>=', $request->from);
                if ($request->to) $query->where('created_at', '<=', $request->to);
                return response()->json([
                    'success' => true,
                    'data' => $query->orderByDesc('created_at')->paginate($request->per_page ?? 50)->items(),
                ]);
            });

            Route::get('user-activities', function (\Illuminate\Http\Request $request) {
                $query = \App\Models\UserActivity::query();
                if ($request->user_id) $query->where('user_id', $request->user_id);
                if ($request->activity_type) $query->where('activity_type', $request->activity_type);
                if ($request->from) $query->where('created_at', '>=', $request->from);
                if ($request->to) $query->where('created_at', '<=', $request->to);
                return response()->json([
                    'success' => true,
                    'data' => $query->orderByDesc('created_at')->paginate($request->per_page ?? 50)->items(),
                ]);
            });
        });
    });
});
