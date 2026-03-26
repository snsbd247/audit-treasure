<?php

namespace App\Services;

use App\Models\ProductionEntry;
use App\Models\ProductionMaterial;
use Illuminate\Support\Facades\DB;

class ManufacturingService
{
    protected NumberSequenceService $sequenceService;
    protected StockService $stockService;

    public function __construct(NumberSequenceService $sequenceService, StockService $stockService)
    {
        $this->sequenceService = $sequenceService;
        $this->stockService = $stockService;
    }

    public function createProduction(array $data): ProductionEntry
    {
        return DB::transaction(function () use ($data) {
            $rawCost = collect($data['materials'])->sum('cost');

            $entry = ProductionEntry::create([
                'production_number' => $this->sequenceService->next('production'),
                'production_date' => $data['production_date'],
                'product_id' => $data['product_id'],
                'bom_id' => $data['bom_id'] ?? null,
                'branch_id' => $data['branch_id'] ?? null,
                'quantity' => $data['quantity'],
                'raw_material_cost' => $rawCost,
                'labor_cost' => $data['labor_cost'] ?? 0,
                'electricity_cost' => $data['electricity_cost'] ?? 0,
                'total_cost' => $rawCost + ($data['labor_cost'] ?? 0) + ($data['electricity_cost'] ?? 0),
                'notes' => $data['notes'] ?? null,
                'status' => 'draft',
                'created_by' => auth()->id(),
            ]);

            foreach ($data['materials'] as $mat) {
                ProductionMaterial::create([
                    'production_id' => $entry->id,
                    'material_id' => $mat['material_id'],
                    'quantity' => $mat['quantity'],
                    'cost' => $mat['cost'],
                ]);
            }

            return $entry;
        });
    }

    public function completeProduction(string $id): ProductionEntry
    {
        return DB::transaction(function () use ($id) {
            $entry = ProductionEntry::with('materials')->findOrFail($id);

            if ($entry->status === 'completed') {
                throw new \Exception('Production already completed');
            }

            // Deduct raw materials from stock
            foreach ($entry->materials as $mat) {
                $this->stockService->adjustStock(
                    $mat->material_id,
                    -$mat->quantity,
                    'production_consumed',
                    $entry->id,
                    $entry->branch_id
                );
            }

            // Add finished product to stock
            $this->stockService->adjustStock(
                $entry->product_id,
                $entry->quantity,
                'production_output',
                $entry->id,
                $entry->branch_id
            );

            $entry->update(['status' => 'completed']);

            return $entry->fresh();
        });
    }
}
