<?php

namespace App\Services;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\FinancialYear;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(
        private NumberSequenceService $seqService,
        private AccountingService $accountingService,
        private StockService $stockService,
    ) {}

    public function createPurchase(array $data, array $items): Purchase
    {
        $fy = FinancialYear::where('start_date', '<=', $data['purchase_date'])
            ->where('end_date', '>=', $data['purchase_date'])->where('is_active', 1)->first();
        if (!$fy) throw new \RuntimeException("No active financial year for date {$data['purchase_date']}");

        return DB::transaction(function () use ($data, $items) {
            $purchaseNumber = $this->seqService->next('purchase');
            $totalAmount = collect($items)->sum('total');

            $purchase = Purchase::create([
                'purchase_number' => $purchaseNumber,
                'purchase_date' => $data['purchase_date'],
                'supplier_id' => $data['supplier_id'] ?? null,
                'branch_id' => $data['branch_id'] ?? null,
                'total_amount' => $totalAmount,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'notes' => $data['notes'] ?? '',
                'status' => 'approved',
                'created_by' => $data['user_id'] ?? null,
            ]);

            foreach ($items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['total'],
                ]);
            }

            // Stock movements (increase)
            $stockItems = array_map(fn ($i) => ['product_id' => $i['product_id'], 'quantity' => $i['quantity']], $items);
            $this->stockService->createBulkMovements($stockItems, 'purchase', 'purchase', $purchase->id, $data['branch_id'] ?? null, 1);

            // Accounting: DR Purchase, CR Accounts Payable
            $this->accountingService->autoPost('Purchase', 'Accounts Payable', $totalAmount, "Purchase {$purchaseNumber}", 'journal', [
                'date' => $data['purchase_date'],
                'branch_id' => $data['branch_id'] ?? null,
                'user_id' => $data['user_id'] ?? null,
            ]);

            return $purchase->load('items');
        });
    }
}
