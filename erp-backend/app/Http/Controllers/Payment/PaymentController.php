<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\BaseController;
use App\Models\PartyPayment;
use App\Models\PartyNote;
use App\Services\PaymentAllocationService;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends BaseController
{
    public function __construct(
        private PaymentAllocationService $paymentService,
        private LedgerService $ledgerService,
    ) {}

    /**
     * List payments for a party.
     */
    public function index(Request $request)
    {
        $query = PartyPayment::query();
        if ($request->party_id) $query->where('party_id', $request->party_id);
        if ($request->party_type) $query->where('party_type', $request->party_type);
        if ($request->from) $query->where('payment_date', '>=', $request->from);
        if ($request->to) $query->where('payment_date', '<=', $request->to);

        $payments = $query->with('allocations')->orderByDesc('payment_date')->get();

        return $this->success($payments);
    }

    /**
     * Record a new payment with optional allocations.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'sometimes|string|max:50',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'allocations' => 'sometimes|array',
            'allocations.*.invoice_id' => 'required_with:allocations|uuid',
            'allocations.*.invoice_type' => 'required_with:allocations|in:sales_invoice,purchase',
            'allocations.*.allocated_amount' => 'required_with:allocations|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        try {
            $data = $request->only(['party_id', 'party_type', 'amount', 'payment_date', 'payment_method', 'reference', 'notes']);
            $data['created_by'] = $request->user()?->id;

            $payment = $this->paymentService->recordPayment($data, $request->input('allocations', []));

            return $this->success($payment, 'Payment recorded successfully', 201);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Auto-allocate unallocated payment to oldest invoices.
     */
    public function autoAllocate(Request $request, string $id)
    {
        $payment = PartyPayment::findOrFail($id);
        $this->paymentService->autoAllocate($payment);

        return $this->success($payment->load('allocations'), 'Auto-allocation complete');
    }

    /**
     * Get party ledger (chronological).
     */
    public function ledger(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $ledger = $this->ledgerService->getPartyLedger(
            $request->party_id,
            $request->party_type,
            $request->from,
            $request->to
        );

        return $this->success($ledger);
    }

    /**
     * Get invoice-wise due breakdown.
     */
    public function invoiceDues(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $dues = $this->ledgerService->getInvoiceDues($request->party_id, $request->party_type);

        return $this->success($dues);
    }

    /**
     * Get party summary (total invoiced, paid, balance).
     */
    public function summary(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $summary = $this->paymentService->getPartySummary($request->party_id, $request->party_type);

        return $this->success($summary);
    }

    /**
     * Aging report for a party.
     */
    public function aging(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $aging = $this->ledgerService->getAgingReport($request->party_id, $request->party_type);

        return $this->success($aging);
    }

    /**
     * Delete a payment (only if no allocations or all can be reversed).
     */
    public function destroy(string $id)
    {
        $payment = PartyPayment::with('allocations')->findOrFail($id);
        $payment->allocations()->delete();
        $payment->delete();

        return $this->success(null, 'Payment deleted');
    }

    // ─── Party Notes ──────────────────────────────────────────

    public function notes(Request $request)
    {
        $notes = PartyNote::where('party_id', $request->party_id)
            ->where('party_type', $request->party_type)
            ->orderByDesc('created_at')
            ->get();

        return $this->success($notes);
    }

    public function addNote(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
            'note' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $note = PartyNote::create([
            'party_id' => $request->party_id,
            'party_type' => $request->party_type,
            'note' => $request->note,
            'created_by' => $request->user()?->id,
        ]);

        return $this->success($note, 'Note added', 201);
    }

    public function deleteNote(string $id)
    {
        PartyNote::findOrFail($id)->delete();
        return $this->success(null, 'Note deleted');
    }
}
