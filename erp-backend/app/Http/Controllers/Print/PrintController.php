<?php

namespace App\Http\Controllers\Print;

use App\Http\Controllers\BaseController;
use App\Models\SalesInvoice;
use App\Models\Purchase;
use App\Models\PartyPayment;
use App\Models\PaymentAllocation;
use App\Models\CompanySetting;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PrintController extends BaseController
{
    public function __construct(private LedgerService $ledgerService) {}

    // ─── Invoice Print Data ─────────────────────────────────
    public function invoicePrint(string $id)
    {
        $invoice = SalesInvoice::with('items.product', 'customer', 'branch')->findOrFail($id);
        $company = CompanySetting::first();

        $paid = (float) PaymentAllocation::where('invoice_id', $id)
            ->where('invoice_type', 'sales')
            ->sum('allocated_amount');
        $due = round((float) $invoice->net_amount - $paid, 2);

        return $this->success([
            'invoice' => $invoice,
            'company' => $company,
            'paid_amount' => round($paid, 2),
            'due_amount' => max($due, 0),
        ]);
    }

    public function invoicePdf(string $id)
    {
        $invoice = SalesInvoice::with('items.product', 'customer', 'branch')->findOrFail($id);
        $company = CompanySetting::first();

        $paid = (float) PaymentAllocation::where('invoice_id', $id)
            ->where('invoice_type', 'sales')
            ->sum('allocated_amount');
        $due = round((float) $invoice->net_amount - $paid, 2);

        $pdf = Pdf::loadView('prints.invoice', [
            'invoice' => $invoice,
            'company' => $company,
            'paid_amount' => round($paid, 2),
            'due_amount' => max($due, 0),
        ]);

        return $pdf->download("Invoice_{$invoice->invoice_number}.pdf");
    }

    // ─── Purchase Print Data ────────────────────────────────
    public function purchasePrint(string $id)
    {
        $purchase = Purchase::with('items.product', 'supplier', 'branch')->findOrFail($id);
        $company = CompanySetting::first();

        $paid = (float) PaymentAllocation::where('invoice_id', $id)
            ->where('invoice_type', 'purchase')
            ->sum('allocated_amount');
        $due = round((float) $purchase->total_amount - $paid, 2);

        return $this->success([
            'purchase' => $purchase,
            'company' => $company,
            'paid_amount' => round($paid, 2),
            'due_amount' => max($due, 0),
        ]);
    }

    public function purchasePdf(string $id)
    {
        $purchase = Purchase::with('items.product', 'supplier', 'branch')->findOrFail($id);
        $company = CompanySetting::first();

        $paid = (float) PaymentAllocation::where('invoice_id', $id)
            ->where('invoice_type', 'purchase')
            ->sum('allocated_amount');
        $due = round((float) $purchase->total_amount - $paid, 2);

        $pdf = Pdf::loadView('prints.purchase', [
            'purchase' => $purchase,
            'company' => $company,
            'paid_amount' => round($paid, 2),
            'due_amount' => max($due, 0),
        ]);

        return $pdf->download("Purchase_{$purchase->purchase_number}.pdf");
    }

    // ─── Ledger Print Data ──────────────────────────────────
    public function ledgerPrint(Request $request)
    {
        $request->validate([
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
        ]);

        $entries = $this->ledgerService->getPartyLedger(
            $request->party_id,
            $request->party_type,
            $request->from,
            $request->to
        );

        $company = CompanySetting::first();

        // Get party name
        $partyName = '';
        if ($request->party_type === 'customer') {
            $party = \App\Models\Customer::find($request->party_id);
            $partyName = $party?->name ?? '';
        } else {
            $party = \App\Models\Supplier::find($request->party_id);
            $partyName = $party?->name ?? '';
        }

        return $this->success([
            'entries' => $entries,
            'company' => $company,
            'party_name' => $partyName,
            'party_type' => $request->party_type,
            'from' => $request->from,
            'to' => $request->to,
        ]);
    }

    public function ledgerPdf(Request $request)
    {
        $request->validate([
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
        ]);

        $entries = $this->ledgerService->getPartyLedger(
            $request->party_id,
            $request->party_type,
            $request->from,
            $request->to
        );

        $company = CompanySetting::first();
        $partyName = '';
        if ($request->party_type === 'customer') {
            $party = \App\Models\Customer::find($request->party_id);
            $partyName = $party?->name ?? '';
        } else {
            $party = \App\Models\Supplier::find($request->party_id);
            $partyName = $party?->name ?? '';
        }

        $pdf = Pdf::loadView('prints.ledger', [
            'entries' => $entries,
            'company' => $company,
            'party_name' => $partyName,
            'party_type' => $request->party_type,
            'from' => $request->from,
            'to' => $request->to,
        ]);

        return $pdf->download("Ledger_{$partyName}.pdf");
    }

    // ─── Payment Receipt Print Data ─────────────────────────
    public function paymentPrint(string $id)
    {
        $payment = PartyPayment::findOrFail($id);
        $allocations = PaymentAllocation::where('payment_id', $id)->get();
        $company = CompanySetting::first();

        // Enrich allocations with invoice numbers
        $enrichedAllocations = $allocations->map(function ($alloc) use ($payment) {
            $invoiceNumber = '';
            if ($payment->party_type === 'customer') {
                $inv = SalesInvoice::find($alloc->invoice_id);
                $invoiceNumber = $inv?->invoice_number ?? $alloc->invoice_id;
            } else {
                $pur = Purchase::find($alloc->invoice_id);
                $invoiceNumber = $pur?->purchase_number ?? $alloc->invoice_id;
            }
            return [
                'invoice_number' => $invoiceNumber,
                'allocated_amount' => (float) $alloc->allocated_amount,
            ];
        });

        // Get party name
        $partyName = '';
        if ($payment->party_type === 'customer') {
            $party = \App\Models\Customer::find($payment->party_id);
            $partyName = $party?->name ?? '';
        } else {
            $party = \App\Models\Supplier::find($payment->party_id);
            $partyName = $party?->name ?? '';
        }

        return $this->success([
            'payment' => $payment,
            'allocations' => $enrichedAllocations,
            'company' => $company,
            'party_name' => $partyName,
        ]);
    }

    public function paymentPdf(string $id)
    {
        $payment = PartyPayment::findOrFail($id);
        $allocations = PaymentAllocation::where('payment_id', $id)->get();
        $company = CompanySetting::first();

        $enrichedAllocations = $allocations->map(function ($alloc) use ($payment) {
            $invoiceNumber = '';
            if ($payment->party_type === 'customer') {
                $inv = SalesInvoice::find($alloc->invoice_id);
                $invoiceNumber = $inv?->invoice_number ?? $alloc->invoice_id;
            } else {
                $pur = Purchase::find($alloc->invoice_id);
                $invoiceNumber = $pur?->purchase_number ?? $alloc->invoice_id;
            }
            return [
                'invoice_number' => $invoiceNumber,
                'allocated_amount' => (float) $alloc->allocated_amount,
            ];
        });

        $partyName = '';
        if ($payment->party_type === 'customer') {
            $party = \App\Models\Customer::find($payment->party_id);
            $partyName = $party?->name ?? '';
        } else {
            $party = \App\Models\Supplier::find($payment->party_id);
            $partyName = $party?->name ?? '';
        }

        $pdf = Pdf::loadView('prints.payment', [
            'payment' => $payment,
            'allocations' => $enrichedAllocations,
            'company' => $company,
            'party_name' => $partyName,
        ]);

        return $pdf->download("Receipt_{$payment->reference}.pdf");
    }

    // ─── Customer/Supplier Statement ────────────────────────
    public function statementPrint(Request $request)
    {
        $request->validate([
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
        ]);

        $data = $this->buildStatementData($request);
        return $this->success($data);
    }

    public function statementPdf(Request $request)
    {
        $request->validate([
            'party_id' => 'required|uuid',
            'party_type' => 'required|in:customer,supplier',
        ]);

        $data = $this->buildStatementData($request);

        $pdf = Pdf::loadView('prints.statement', array_merge($data, [
            'company' => CompanySetting::first(),
        ]));

        return $pdf->download("Statement_{$data['party_name']}.pdf");
    }

    private function buildStatementData(Request $request): array
    {
        $entries = $this->ledgerService->getPartyLedger(
            $request->party_id,
            $request->party_type,
            $request->from,
            $request->to
        );

        $company = CompanySetting::first();
        $party = null;
        $partyName = '';

        if ($request->party_type === 'customer') {
            $party = \App\Models\Customer::find($request->party_id);
        } else {
            $party = \App\Models\Supplier::find($request->party_id);
        }
        $partyName = $party?->name ?? '';

        return [
            'entries' => $entries,
            'company' => $company,
            'party' => $party,
            'party_name' => $partyName,
            'party_type' => $request->party_type,
            'from' => $request->from,
            'to' => $request->to,
        ];
    }
}
