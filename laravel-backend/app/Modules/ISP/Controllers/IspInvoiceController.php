<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspInvoice;
use Illuminate\Http\Request;

class IspInvoiceController extends BaseController
{
    public function index(Request $request)
    {
        $query = IspInvoice::with('customer.package');

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->from) {
            $query->where('billing_date', '>=', $request->from);
        }
        if ($request->to) {
            $query->where('billing_date', '<=', $request->to);
        }

        return $this->paginated(
            $query->orderByDesc('billing_date')->paginate($request->per_page ?? 25)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id'  => 'required|exists:isp_customers,id',
            'amount'       => 'required|numeric|min:0',
            'billing_date' => 'required|date',
            'due_date'     => 'required|date|after_or_equal:billing_date',
            'status'       => 'in:paid,unpaid',
        ]);

        return $this->created(IspInvoice::create($data)->load('customer'));
    }

    public function show(string $id)
    {
        return $this->success(
            IspInvoice::with(['customer.package', 'payments'])->findOrFail($id)
        );
    }

    public function update(Request $request, string $id)
    {
        $invoice = IspInvoice::findOrFail($id);

        $data = $request->validate([
            'amount'       => 'sometimes|numeric|min:0',
            'billing_date' => 'sometimes|date',
            'due_date'     => 'sometimes|date',
            'status'       => 'in:paid,unpaid',
        ]);

        $invoice->update($data);
        return $this->success($invoice->fresh()->load('customer'));
    }

    public function destroy(string $id)
    {
        IspInvoice::findOrFail($id)->delete();
        return $this->success(null, 'Invoice deleted');
    }
}
