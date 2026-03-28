<?php

namespace App\Services;

use App\Models\PartyPayment;
use App\Models\PaymentAllocation;
use App\Models\SalesInvoice;
use App\Models\Purchase;
use Illuminate\Support\Facades\DB;

class PaymentAllocationService
{
    public function __construct(
        private AccountingService $accountingService,
    ) {}

    /**
     * Record a payment and optionally allocate it to invoices.
     *
     * @param array $data        Payment data (party_id, party_type, amount, payment_date, payment_method, reference, notes)
     * @param array $allocations Array of ['invoice_id' => uuid, 'invoice_type' => 'sales_invoice'|'purchase', 'allocated_amount' => float]
     */
    public function recordPayment(array $data, array $allocations = []): PartyPayment
    {
        $this->validatePaymentData($data);
        $this->validateAllocations($data['amount'], $allocations);

        return DB::transaction(function () use ($data, $allocations) {
            $payment = PartyPayment::create([
                'party_id' => $data['party_id'],
                'party_type' => $data['party_type'],
                'amount' => $data['amount'],
                'payment_date' => $data['payment_date'],
                'payment_method' => $data['payment_method'] ?? 'cash',
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            // Create allocations
            foreach ($allocations as $alloc) {
                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'invoice_id' => $alloc['invoice_id'],
                    'invoice_type' => $alloc['invoice_type'],
                    'allocated_amount' => $alloc['allocated_amount'],
                ]);
            }

            // Post accounting entry
            $this->postPaymentAccounting($payment);

            return $payment->load('allocations');
        });
    }

    /**
     * Auto-allocate a payment to oldest unpaid invoices (FIFO).
     */
    public function autoAllocate(PartyPayment $payment): void
    {
        $remaining = (float) $payment->amount - $this->getAllocatedTotal($payment->id);
        if ($remaining <= 0) return;

        $invoices = $this->getUnpaidInvoices($payment->party_id, $payment->party_type);

        DB::transaction(function () use ($payment, $invoices, &$remaining) {
            foreach ($invoices as $invoice) {
                if ($remaining <= 0) break;

                $due = $this->getInvoiceDue($invoice);
                if ($due <= 0) continue;

                $allocAmount = min($remaining, $due);

                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'invoice_type' => $invoice->getTable() === 'sales_invoices' ? 'sales_invoice' : 'purchase',
                    'allocated_amount' => $allocAmount,
                ]);

                $remaining -= $allocAmount;
            }
        });
    }

    /**
     * Get total allocated amount for a payment.
     */
    public function getAllocatedTotal(string $paymentId): float
    {
        return (float) PaymentAllocation::where('payment_id', $paymentId)->sum('allocated_amount');
    }

    /**
     * Get due amount for a specific invoice.
     */
    public function getInvoiceDue($invoice): float
    {
        $total = $invoice->net_amount ?? $invoice->total_amount;
        $paid = (float) PaymentAllocation::where('invoice_id', $invoice->id)->sum('allocated_amount');
        return max(0, (float) $total - $paid);
    }

    /**
     * Get all unpaid invoices for a party, ordered by date (FIFO).
     */
    public function getUnpaidInvoices(string $partyId, string $partyType): \Illuminate\Support\Collection
    {
        if ($partyType === 'customer') {
            return SalesInvoice::where('customer_id', $partyId)
                ->orderBy('invoice_date')
                ->get()
                ->filter(fn ($inv) => $this->getInvoiceDue($inv) > 0);
        }

        return Purchase::where('supplier_id', $partyId)
            ->orderBy('purchase_date')
            ->get()
            ->filter(fn ($inv) => $this->getInvoiceDue($inv) > 0);
    }

    /**
     * Get payment summary for a party (total invoiced, total paid, balance).
     */
    public function getPartySummary(string $partyId, string $partyType): array
    {
        if ($partyType === 'customer') {
            $totalInvoiced = (float) SalesInvoice::where('customer_id', $partyId)->sum('net_amount');
        } else {
            $totalInvoiced = (float) Purchase::where('supplier_id', $partyId)->sum('total_amount');
        }

        $totalPaid = (float) PartyPayment::where('party_id', $partyId)
            ->where('party_type', $partyType)
            ->sum('amount');

        return [
            'total_invoiced' => round($totalInvoiced, 2),
            'total_paid' => round($totalPaid, 2),
            'balance_due' => round($totalInvoiced - $totalPaid, 2),
        ];
    }

    // ─── Private ──────────────────────────────────────────────

    private function validatePaymentData(array $data): void
    {
        $required = ['party_id', 'party_type', 'amount', 'payment_date'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \InvalidArgumentException("Field '{$field}' is required.");
            }
        }

        if (!in_array($data['party_type'], ['customer', 'supplier'])) {
            throw new \InvalidArgumentException("party_type must be 'customer' or 'supplier'.");
        }

        if ((float) $data['amount'] <= 0) {
            throw new \InvalidArgumentException('Payment amount must be positive.');
        }
    }

    private function validateAllocations(float $paymentAmount, array $allocations): void
    {
        $totalAllocated = array_sum(array_column($allocations, 'allocated_amount'));
        if ($totalAllocated > $paymentAmount + 0.01) {
            throw new \InvalidArgumentException("Allocated total ({$totalAllocated}) exceeds payment amount ({$paymentAmount}).");
        }
    }

    private function postPaymentAccounting(PartyPayment $payment): void
    {
        $isCustomer = $payment->party_type === 'customer';
        $method = strtolower($payment->payment_method);

        $creditAccount = $isCustomer ? 'Accounts Receivable' : 'Cash';
        $debitAccount = $isCustomer ? ($method === 'bank' ? 'Bank' : 'Cash') : 'Accounts Payable';

        $description = ($isCustomer ? 'Customer' : 'Supplier') . " Payment - {$payment->reference}";

        $this->accountingService->autoPost(
            $debitAccount,
            $creditAccount,
            (float) $payment->amount,
            $description,
            $isCustomer ? 'receipt' : 'payment',
            [
                'date' => $payment->payment_date,
                'branch_id' => null,
                'user_id' => $payment->created_by,
            ]
        );
    }
}
