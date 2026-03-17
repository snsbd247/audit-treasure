<?php
namespace App\Http\Controllers\Sales;
use App\Http\Controllers\BaseController;
use App\Services\SalesService;
use App\Services\SmsService;
use App\Models\SalesInvoice;
use Illuminate\Http\Request;

class SalesInvoiceController extends BaseController
{
    public function __construct(private SalesService $service) {}

    public function index(Request $request)
    {
        $query = SalesInvoice::with('customer', 'branch');
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        if ($request->from) $query->where('invoice_date', '>=', $request->from);
        if ($request->to) $query->where('invoice_date', '<=', $request->to);
        return $this->paginated($query->orderByDesc('invoice_date')->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'invoice_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:item_master,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric',
        ]);
        $data = array_merge($request->only('invoice_date', 'customer_id', 'branch_id', 'discount', 'notes'), ['user_id' => $request->user()->id]);
        $invoice = $this->service->createInvoice($data, $request->items);

        // Send SMS to customer
        if ($invoice->customer && $invoice->customer->phone) {
            try {
                app(SmsService::class)->sendInvoiceSms($invoice->customer->phone, $invoice->total_amount);
            } catch (\Exception $e) {
                \Log::error('Invoice SMS failed: ' . $e->getMessage());
            }
        }

        return $this->created($invoice);
    }

    public function show(string $id)
    {
        return $this->success(SalesInvoice::with('items.product', 'customer', 'branch')->findOrFail($id));
    }
}
