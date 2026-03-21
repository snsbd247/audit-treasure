<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Services\BillingService;
use Illuminate\Http\Request;

class IspBillingController extends BaseController
{
    public function __construct(private BillingService $billing) {}

    /**
     * POST /api/isp/generate-bills
     * Manually trigger bill generation (admin only).
     */
    public function generate(Request $request)
    {
        $result = $this->billing->generateMonthlyBills($request->month);

        // Also mark overdue + suspend delinquent
        $overdue = $this->billing->markOverdueInvoices();
        $suspended = $this->billing->suspendDelinquentCustomers();

        return $this->success([
            'invoices_generated' => $result['generated'],
            'skipped'            => $result['skipped'],
            'overdue_marked'     => $overdue,
            'customers_suspended'=> $suspended,
            'errors'             => $result['errors'],
        ], 'Billing cycle completed');
    }
}
