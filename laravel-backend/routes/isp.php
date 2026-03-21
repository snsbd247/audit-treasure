<?php

use Illuminate\Support\Facades\Route;
use App\Modules\ISP\Controllers\IspPackageController;
use App\Modules\ISP\Controllers\IspCustomerController;
use App\Modules\ISP\Controllers\IspInvoiceController;
use App\Modules\ISP\Controllers\IspPaymentController;

/*
|--------------------------------------------------------------------------
| ISP Module Routes
|--------------------------------------------------------------------------
| Prefix: /api/isp
| Auth:   sanctum
*/

Route::middleware(['auth:sanctum'])->prefix('isp')->group(function () {
    Route::apiResource('packages',  IspPackageController::class);
    Route::apiResource('customers', IspCustomerController::class);
    Route::apiResource('invoices',  IspInvoiceController::class);
    Route::apiResource('payments',  IspPaymentController::class)->except(['update']);
});
