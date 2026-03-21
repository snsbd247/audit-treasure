<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspInvoice;
use App\Modules\ISP\Models\IspPayment;
use App\Modules\ISP\Services\BkashService;
use App\Modules\ISP\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IspBkashController extends BaseController
{
    public function __construct(
        private BkashService $bkash,
        private BillingService $billing
    ) {}

    /**
     * POST /api/isp/bkash/create
     * Initiate a bKash payment for an invoice.
     */
    public function create(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:isp_invoices,id',
        ]);

        $invoice = IspInvoice::findOrFail($request->invoice_id);

        if ($invoice->status === 'paid') {
            return $this->error('Invoice is already paid', 422);
        }

        // Calculate remaining amount
        $paid = $invoice->payments()->sum('amount');
        $remaining = max(0, $invoice->amount - $paid);

        if ($remaining <= 0) {
            return $this->error('Invoice is fully paid', 422);
        }

        $result = $this->bkash->createPayment($remaining, $invoice->id);

        if (!$result['success']) {
            return $this->error($result['message'] ?? 'bKash payment creation failed', 502);
        }

        return $this->success([
            'bkashURL'  => $result['bkashURL'],
            'paymentID' => $result['paymentID'],
            'amount'    => $remaining,
        ], 'Redirect user to bKash');
    }

    /**
     * GET /api/isp/bkash/callback
     * bKash redirects here after payment completion.
     */
    public function callback(Request $request)
    {
        $paymentID = $request->query('paymentID');
        $status    = $request->query('status');
        $invoiceId = $request->query('invoice_id');

        // Determine frontend redirect base
        $frontendUrl = env('APP_FRONTEND_URL', env('APP_URL', ''));

        if ($status !== 'success' || !$paymentID) {
            Log::warning("bKash: Callback received non-success", $request->all());
            return redirect("{$frontendUrl}/isp/invoices?bkash=failed");
        }

        // Execute the payment
        $result = $this->bkash->executePayment($paymentID);

        if (!$result['success']) {
            Log::error("bKash: Execute failed on callback", ['result' => $result]);
            return redirect("{$frontendUrl}/isp/invoices?bkash=failed");
        }

        // Record payment in DB
        $payment = IspPayment::create([
            'invoice_id'       => $invoiceId,
            'amount'           => $result['amount'],
            'method'           => 'bkash',
            'transaction_id'   => $result['transactionId'],
            'gateway'          => 'bkash',
            'gateway_status'   => 'completed',
            'gateway_response' => $result['raw'],
            'paid_at'          => now(),
        ]);

        // Auto-mark invoice as paid if fully covered
        $invoice = IspInvoice::find($invoiceId);
        if ($invoice) {
            $totalPaid = $invoice->payments()->sum('amount');
            if ($totalPaid >= $invoice->amount) {
                $invoice->update(['status' => 'paid']);
                $this->billing->reactivateIfClear($invoice->customer_id);
            }
        }

        Log::info("bKash: Payment successful", [
            'trxID' => $result['transactionId'],
            'invoice' => $invoiceId,
        ]);

        return redirect("{$frontendUrl}/isp/invoices?bkash=success&trx={$result['transactionId']}");
    }

    /**
     * POST /api/isp/bkash/query
     * Check payment status manually.
     */
    public function query(Request $request)
    {
        $request->validate(['payment_id' => 'required|string']);
        $result = $this->bkash->queryPayment($request->payment_id);

        if (!$result['success']) {
            return $this->error($result['message'] ?? 'Query failed', 502);
        }

        return $this->success($result['data']);
    }
}
