<?php

use Illuminate\Support\Facades\Route;
use App\Modules\ISP\Controllers\IspPackageController;
use App\Modules\ISP\Controllers\IspCustomerController;
use App\Modules\ISP\Controllers\IspInvoiceController;
use App\Modules\ISP\Controllers\IspPaymentController;
use App\Modules\ISP\Controllers\IspBillingController;
use App\Modules\ISP\Controllers\IspRouterController;
use App\Modules\ISP\Controllers\IspMikrotikActionController;
use App\Modules\ISP\Controllers\IspBkashController;
use App\Modules\ISP\Controllers\IspCustomerAuthController;
use App\Modules\ISP\Controllers\IspResellerController;
use App\Modules\ISP\Controllers\IspUsageController;

/*
|--------------------------------------------------------------------------
| ISP Module Routes
|--------------------------------------------------------------------------
*/

// bKash callback (public — no auth, bKash redirects here)
Route::get('isp/bkash/callback', [IspBkashController::class, 'callback']);

// ─── Customer Self-Service Portal (public auth) ─────────────
Route::prefix('isp/customer-portal')->group(function () {
    Route::post('login', [IspCustomerAuthController::class, 'login']);
    Route::get('profile', [IspCustomerAuthController::class, 'profile']);
    Route::get('invoices', [IspCustomerAuthController::class, 'invoices']);
    Route::get('payments', [IspCustomerAuthController::class, 'payments']);
});

Route::middleware(['auth:sanctum'])->prefix('isp')->group(function () {

    // ─── Core CRUD ──────────────────────────────────────
    Route::apiResource('packages',  IspPackageController::class);
    Route::apiResource('customers', IspCustomerController::class);
    Route::apiResource('invoices',  IspInvoiceController::class);
    Route::apiResource('payments',  IspPaymentController::class)->except(['update']);

    // ─── Billing ────────────────────────────────────────
    Route::post('generate-bills', [IspBillingController::class, 'generate']);

    // ─── bKash Payment ──────────────────────────────────
    Route::post('bkash/create', [IspBkashController::class, 'create']);
    Route::post('bkash/query',  [IspBkashController::class, 'query']);

    // ─── Routers ────────────────────────────────────────
    Route::apiResource('routers', IspRouterController::class);
    Route::post('routers/test',  [IspRouterController::class, 'testConnection']);

    // ─── MikroTik Customer Actions ──────────────────────
    Route::post('customers/{id}/suspend',    [IspMikrotikActionController::class, 'suspend']);
    Route::post('customers/{id}/activate',   [IspMikrotikActionController::class, 'activate']);
    Route::post('customers/{id}/sync-pppoe', [IspMikrotikActionController::class, 'syncPPPoE']);
    Route::post('customers/{id}/disconnect', [IspMikrotikActionController::class, 'disconnectSession']);
});
