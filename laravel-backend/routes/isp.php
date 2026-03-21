<?php

use Illuminate\Support\Facades\Route;
use App\Modules\ISP\Controllers\IspPackageController;
use App\Modules\ISP\Controllers\IspCustomerController;
use App\Modules\ISP\Controllers\IspInvoiceController;
use App\Modules\ISP\Controllers\IspPaymentController;
use App\Modules\ISP\Controllers\IspBillingController;
use App\Modules\ISP\Controllers\IspRouterController;
use App\Modules\ISP\Controllers\IspMikrotikActionController;

/*
|--------------------------------------------------------------------------
| ISP Module Routes
|--------------------------------------------------------------------------
| Prefix: /api/isp
| Auth:   sanctum
*/

Route::middleware(['auth:sanctum'])->prefix('isp')->group(function () {

    // ─── Core CRUD ──────────────────────────────────────
    Route::apiResource('packages',  IspPackageController::class);
    Route::apiResource('customers', IspCustomerController::class);
    Route::apiResource('invoices',  IspInvoiceController::class);
    Route::apiResource('payments',  IspPaymentController::class)->except(['update']);

    // ─── Billing ────────────────────────────────────────
    Route::post('generate-bills', [IspBillingController::class, 'generate']);

    // ─── Routers ────────────────────────────────────────
    Route::apiResource('routers', IspRouterController::class);
    Route::post('routers/test',  [IspRouterController::class, 'testConnection']);

    // ─── MikroTik Customer Actions ──────────────────────
    Route::post('customers/{id}/suspend',    [IspMikrotikActionController::class, 'suspend']);
    Route::post('customers/{id}/activate',   [IspMikrotikActionController::class, 'activate']);
    Route::post('customers/{id}/sync-pppoe', [IspMikrotikActionController::class, 'syncPPPoE']);
    Route::post('customers/{id}/disconnect', [IspMikrotikActionController::class, 'disconnectSession']);
});
