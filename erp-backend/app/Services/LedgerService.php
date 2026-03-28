<?php

namespace App\Services;

use App\Models\SalesInvoice;
use App\Models\SalesReturn;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PartyPayment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Collection;

class LedgerService
{
    /**
     * Generate a chronological ledger for a customer or supplier.
     * Returns entries sorted by date with running balance.
     */
    public function getPartyLedger(string $partyId, string $partyType, ?string $from = null, ?string $to = null): array
    {
        $entries = collect();

        if ($partyType === 'customer') {
            $entries = $entries->merge($this->getCustomerInvoices($partyId, $from, $to));
            $entries = $entries->merge($this->getCustomerReturns($partyId, $from, $to));
        } else {
            $entries = $entries->merge($this->getSupplierPurchases($partyId, $from, $to));
            $entries = $entries->merge($this->getSupplierReturns($partyId, $from, $to));
        }

        $entries = $entries->merge($this->getPartyPayments($partyId, $partyType, $from, $to));

        // Sort by date, then by type (invoices before payments on same date)
        $sorted = $entries->sortBy([['date', 'asc'], ['sort_order', 'asc']])->values();

        // Calculate running balance
        $balance = 0;
        $result = [];
        foreach ($sorted as $entry) {
            $balance += ($entry['debit'] ?? 0) - ($entry['credit'] ?? 0);
            $entry['balance'] = round($balance, 2);
            $result[] = $entry;
        }

        return $result;
    }

    /**
     * Get invoice-wise due breakdown for a party.
     */
    public function getInvoiceDues(string $partyId, string $partyType): array
    {
        if ($partyType === 'customer') {
            $invoices = SalesInvoice::where('customer_id', $partyId)->orderBy('invoice_date')->get();
            return $invoices->map(function ($inv) {
                $paid = (float) PaymentAllocation::where('invoice_id', $inv->id)->sum('allocated_amount');
                return [
                    'invoice_id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'invoice_date' => $inv->invoice_date,
                    'total_amount' => (float) $inv->net_amount,
                    'paid_amount' => round($paid, 2),
                    'due_amount' => round((float) $inv->net_amount - $paid, 2),
                    'status' => $paid >= (float) $inv->net_amount ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid'),
                ];
            })->toArray();
        }

        $purchases = Purchase::where('supplier_id', $partyId)->orderBy('purchase_date')->get();
        return $purchases->map(function ($p) {
            $paid = (float) PaymentAllocation::where('invoice_id', $p->id)->sum('allocated_amount');
            return [
                'invoice_id' => $p->id,
                'invoice_number' => $p->purchase_number,
                'invoice_date' => $p->purchase_date,
                'total_amount' => (float) $p->total_amount,
                'paid_amount' => round($paid, 2),
                'due_amount' => round((float) $p->total_amount - $paid, 2),
                'status' => $paid >= (float) $p->total_amount ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid'),
            ];
        })->toArray();
    }

    /**
     * Aging report: group dues by age brackets (0-30, 31-60, 61-90, 90+).
     */
    public function getAgingReport(string $partyId, string $partyType): array
    {
        $dues = collect($this->getInvoiceDues($partyId, $partyType))
            ->filter(fn ($d) => $d['due_amount'] > 0);

        $today = now();
        $brackets = ['0-30' => 0, '31-60' => 0, '61-90' => 0, '90+' => 0];

        foreach ($dues as $due) {
            $days = $today->diffInDays($due['invoice_date']);
            if ($days <= 30) $brackets['0-30'] += $due['due_amount'];
            elseif ($days <= 60) $brackets['31-60'] += $due['due_amount'];
            elseif ($days <= 90) $brackets['61-90'] += $due['due_amount'];
            else $brackets['90+'] += $due['due_amount'];
        }

        return array_map(fn ($v) => round($v, 2), $brackets);
    }

    // ─── Private Helpers ──────────────────────────────────────

    private function getCustomerInvoices(string $partyId, ?string $from, ?string $to): Collection
    {
        $query = SalesInvoice::where('customer_id', $partyId);
        if ($from) $query->where('invoice_date', '>=', $from);
        if ($to) $query->where('invoice_date', '<=', $to);

        return $query->get()->map(fn ($inv) => [
            'date' => $inv->invoice_date,
            'type' => 'invoice',
            'reference' => $inv->invoice_number,
            'description' => "Sales Invoice {$inv->invoice_number}",
            'debit' => (float) $inv->net_amount,
            'credit' => 0,
            'sort_order' => 1,
        ]);
    }

    private function getCustomerReturns(string $partyId, ?string $from, ?string $to): Collection
    {
        $query = SalesReturn::where('customer_id', $partyId);
        if ($from) $query->where('return_date', '>=', $from);
        if ($to) $query->where('return_date', '<=', $to);

        return $query->get()->map(fn ($r) => [
            'date' => $r->return_date,
            'type' => 'return',
            'reference' => $r->return_number,
            'description' => "Sales Return {$r->return_number}",
            'debit' => 0,
            'credit' => (float) $r->total_amount,
            'sort_order' => 2,
        ]);
    }

    private function getSupplierPurchases(string $partyId, ?string $from, ?string $to): Collection
    {
        $query = Purchase::where('supplier_id', $partyId);
        if ($from) $query->where('purchase_date', '>=', $from);
        if ($to) $query->where('purchase_date', '<=', $to);

        return $query->get()->map(fn ($p) => [
            'date' => $p->purchase_date,
            'type' => 'purchase',
            'reference' => $p->purchase_number,
            'description' => "Purchase {$p->purchase_number}",
            'debit' => 0,
            'credit' => (float) $p->total_amount,
            'sort_order' => 1,
        ]);
    }

    private function getSupplierReturns(string $partyId, ?string $from, ?string $to): Collection
    {
        $query = PurchaseReturn::where('supplier_id', $partyId);
        if ($from) $query->where('return_date', '>=', $from);
        if ($to) $query->where('return_date', '<=', $to);

        return $query->get()->map(fn ($r) => [
            'date' => $r->return_date,
            'type' => 'return',
            'reference' => $r->return_number,
            'description' => "Purchase Return {$r->return_number}",
            'debit' => (float) $r->total_amount,
            'credit' => 0,
            'sort_order' => 2,
        ]);
    }

    private function getPartyPayments(string $partyId, string $partyType, ?string $from, ?string $to): Collection
    {
        $query = PartyPayment::where('party_id', $partyId)->where('party_type', $partyType);
        if ($from) $query->where('payment_date', '>=', $from);
        if ($to) $query->where('payment_date', '<=', $to);

        $isCustomer = $partyType === 'customer';

        return $query->get()->map(fn ($p) => [
            'date' => $p->payment_date,
            'type' => 'payment',
            'reference' => $p->reference ?? $p->id,
            'description' => ucfirst($p->payment_method) . " Payment",
            'debit' => $isCustomer ? 0 : (float) $p->amount,
            'credit' => $isCustomer ? (float) $p->amount : 0,
            'sort_order' => 3,
        ]);
    }
}
