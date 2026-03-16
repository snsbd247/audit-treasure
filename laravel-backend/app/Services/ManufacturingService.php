<?php

namespace App\Services;

use App\Models\ProductionEntry;
use App\Models\ProductionMaterial;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManufacturingService
{
    public function __construct(
        private NumberSequenceService $seqService,
        private AccountingService $accountingService,
    ) {}

    public function createProduction(array $data, array $materials): ProductionEntry
    {
        return DB::transaction(function () use ($data, $materials) {
            $prodNumber = $this->seqService->next('production');
            $rawCost = collect($materials)->sum('cost');
            $totalCost = $rawCost + ($data['labor_cost'] ?? 0) + ($data['electricity_cost'] ?? 0);

            $entry = ProductionEntry::create([
                'production_number' => $prodNumber,
                'production_date' => $data['production_date'],
                'product_id' => $data['product_id'],
                'bom_id' => $data['bom_id'] ?? null,
                'branch_id' => $data['branch_id'] ?? null,
                'quantity' => $data['quantity'],
                'raw_material_cost' => $rawCost,
                'labor_cost' => $data['labor_cost'] ?? 0,
                'electricity_cost' => $data['electricity_cost'] ?? 0,
                'total_cost' => $totalCost,
                'notes' => $data['notes'] ?? '',
                'status' => 'completed',
                'created_by' => $data['user_id'] ?? null,
            ]);

            foreach ($materials as $m) {
                ProductionMaterial::create([
                    'production_id' => $entry->id,
                    'material_id' => $m['material_id'],
                    'quantity' => $m['quantity'],
                    'cost' => $m['cost'],
                ]);
            }

            // Stock movements: consume materials, produce finished goods
            $movements = [];
            foreach ($materials as $m) {
                $movements[] = [
                    'id' => (string) Str::uuid(), 'product_id' => $m['material_id'], 'branch_id' => $data['branch_id'] ?? null,
                    'movement_type' => 'production_out', 'reference_type' => 'production', 'reference_id' => $entry->id,
                    'quantity' => -$m['quantity'], 'created_at' => now(),
                ];
            }
            $movements[] = [
                'id' => (string) Str::uuid(), 'product_id' => $data['product_id'], 'branch_id' => $data['branch_id'] ?? null,
                'movement_type' => 'production_in', 'reference_type' => 'production', 'reference_id' => $entry->id,
                'quantity' => $data['quantity'], 'created_at' => now(),
            ];
            StockMovement::insert($movements);

            // Accounting
            if ($rawCost > 0) {
                $ctx = ['date' => $data['production_date'], 'branch_id' => $data['branch_id'] ?? null, 'user_id' => $data['user_id'] ?? null];
                $this->accountingService->autoPost('Work in Progress', 'Raw Material', $rawCost, "Production {$prodNumber} - Materials", 'journal', $ctx);
                $overhead = ($data['labor_cost'] ?? 0) + ($data['electricity_cost'] ?? 0);
                if ($overhead > 0) {
                    $this->accountingService->autoPost('Work in Progress', 'Manufacturing Overhead', $overhead, "Production {$prodNumber} - Overhead", 'journal', $ctx);
                }
            }

            return $entry->load('materials');
        });
    }
}
