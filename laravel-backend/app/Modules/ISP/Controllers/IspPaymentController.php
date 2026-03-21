<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspInvoice;
use App\Modules\ISP\Models\IspPayment;
use App\Modules\ISP\Services\BillingService;
use App\Modules\ISP\Services\IspSmsService;
use Illuminate\Http\Request;

class IspPaymentController extends BaseController
{
    public function __construct(private BillingService $billing, private IspSmsService $ispSms) {}

    public function index(Request $request)
    {
        $query = IspPayment::with('invoice.customer');

        if ($request->invoice_id) {
            $query->where('invoice_id', $request->invoice_id);
        }
        if ($request->method) {
            $query->where('method', $request->method);
        }

        return $this->paginated(
            $query->orderByDesc('paid_at')->paginate($request->per_page ?? 25)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_id' => 'required|exists:isp_invoices,id',
            'amount'     => 'required|numeric|min:0.01',
            'method'     => 'required|in:bkash,nagad,manual,bank',
            'paid_at'    => 'nullable|date',
        ]);

        $data['paid_at'] = $data['paid_at'] ?? now();

        $payment = IspPayment::create($data);

        // Auto-mark invoice as paid if fully covered
        $invoice = IspInvoice::find($data['invoice_id']);
        $totalPaid = $invoice->payments()->sum('amount');
        if ($totalPaid >= $invoice->amount) {
            $invoice->update(['status' => 'paid']);

            // Auto re-activate customer if all invoices cleared
            $this->billing->reactivateIfClear($invoice->customer_id);
        }

        return $this->created($payment->load('invoice.customer'));
    }

    public function show(string $id)
    {
        return $this->success(IspPayment::with('invoice.customer')->findOrFail($id));
    }

    public function destroy(string $id)
    {
        IspPayment::findOrFail($id)->delete();
        return $this->success(null, 'Payment deleted');
    }
}
