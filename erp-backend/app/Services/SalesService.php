<?php

namespace App\Services;

use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\FinancialYear;
use Illuminate\Support\Facades\DB;

class SalesService
{
    public function __construct(
        private NumberSequenceService $seqService,
        private AccountingService $accountingService,
        private StockService $stockService,
    ) {}

    public function createInvoice(array $data, array $items): SalesInvoice
    {
        $this->validateFinancialYear($data['invoice_date']);

        return DB::transaction(function () use ($data, $items) {
            $invoiceNumber = $this->seqService->next('sales_invoice');
            $totalAmount = collect($items)->sum('total');
            $discount = $data['discount'] ?? 0;
            $netAmount = $totalAmount - $discount;

            $invoice = SalesInvoice::create([
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $data['invoice_date'],
                'customer_id' => $data['customer_id'] ?? null,
                'branch_id' => $data['branch_id'] ?? null,
                'total_amount' => $totalAmount,
                'discount' => $discount,
                'net_amount' => $netAmount,
                'notes' => $data['notes'] ?? '',
                'status' => 'approved',
                'created_by' => $data['user_id'] ?? null,
            ]);

            foreach ($items as $item) {
                SalesInvoiceItem::create([
                    'sales_invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'] ?? 0,
                    'total' => $item['total'],
                ]);
            }

            // Stock movements (decrease)
            $stockItems = array_map(fn ($i) => ['product_id' => $i['product_id'], 'quantity' => $i['quantity']], $items);
            $this->stockService->createBulkMovements($stockItems, 'sale', 'sales_invoice', $invoice->id, $data['branch_id'] ?? null, -1);

            // Accounting: DR Accounts Receivable, CR Sales
            $this->accountingService->autoPost('Accounts Receivable', 'Sales', $netAmount, "Sales Invoice {$invoiceNumber}", 'journal', [
                'date' => $data['invoice_date'],
                'branch_id' => $data['branch_id'] ?? null,
                'user_id' => $data['user_id'] ?? null,
            ]);

            return $invoice->load('items');
        });
    }

    private function validateFinancialYear(string $date): void
    {
        $fy = FinancialYear::where('start_date', '<=', $date)->where('end_date', '>=', $date)->where('is_active', 1)->first();
        if (!$fy) throw new \RuntimeException("No active financial year covers date {$date}");
    }
}
