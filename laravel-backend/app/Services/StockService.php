<?php

namespace App\Services;

use App\Models\StockLedger;
use App\Models\StockMovement;
use App\Models\WarehouseStock;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Create a stock ledger entry and return the new balance.
     */
    public function createLedgerEntry(array $params): float
    {
        $lastEntry = StockLedger::where('item_id', $params['item_id'])
            ->when($params['warehouse_id'] ?? null, fn ($q, $wh) => $q->where('warehouse_id', $wh))
            ->orderByDesc('created_at')
            ->first();

        $prevBalance = $lastEntry ? (float) $lastEntry->balance_quantity : 0;
        $newBalance = $prevBalance + ($params['quantity_in'] ?? 0) - ($params['quantity_out'] ?? 0);
        $unitCost = $params['unit_cost'] ?? 0;

        StockLedger::create([
            'transaction_type' => $params['transaction_type'],
            'transaction_id' => $params['transaction_id'] ?? null,
            'item_id' => $params['item_id'],
            'branch_id' => $params['branch_id'] ?? null,
            'warehouse_id' => $params['warehouse_id'] ?? null,
            'quantity_in' => $params['quantity_in'] ?? 0,
            'quantity_out' => $params['quantity_out'] ?? 0,
            'balance_quantity' => $newBalance,
            'unit_cost' => $unitCost,
            'total_value' => abs(($params['quantity_in'] ?? 0) - ($params['quantity_out'] ?? 0)) * $unitCost,
            'reference_number' => $params['reference_number'] ?? null,
            'transaction_date' => $params['transaction_date'] ?? now()->toDateString(),
        ]);

        return $newBalance;
    }

    /**
     * Update warehouse stock (upsert).
     */
    public function updateWarehouseStock(string $itemId, string $warehouseId, float $quantityChange): void
    {
        $stock = WarehouseStock::where('item_id', $itemId)->where('warehouse_id', $warehouseId)->first();
        if ($stock) {
            $stock->update(['quantity' => $stock->quantity + $quantityChange]);
        } else {
            WarehouseStock::create(['item_id' => $itemId, 'warehouse_id' => $warehouseId, 'quantity' => $quantityChange]);
        }
    }

    /**
     * Bulk create stock movements.
     */
    public function createBulkMovements(array $items, string $movementType, string $refType, string $refId, ?string $branchId, float $multiplier = 1): void
    {
        $movements = array_map(fn ($i) => [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'product_id' => $i['product_id'],
            'branch_id' => $branchId,
            'movement_type' => $movementType,
            'reference_type' => $refType,
            'reference_id' => $refId,
            'quantity' => $i['quantity'] * $multiplier,
            'created_at' => now(),
        ], $items);

        StockMovement::insert($movements);
    }

    public function getBalance(string $itemId, ?string $warehouseId = null): float
    {
        $query = StockLedger::where('item_id', $itemId)->orderByDesc('created_at');
        if ($warehouseId) $query->where('warehouse_id', $warehouseId);
        $entry = $query->first();
        return $entry ? (float) $entry->balance_quantity : 0;
    }
}
