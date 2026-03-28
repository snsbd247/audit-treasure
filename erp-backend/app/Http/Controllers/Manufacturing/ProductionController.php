<?php

namespace App\Http\Controllers\Manufacturing;

use App\Http\Controllers\BaseController;
use App\Models\ProductionEntry;
use App\Models\ProductionMaterial;
use App\Services\ManufacturingService;
use Illuminate\Http\Request;

class ProductionController extends BaseController
{
    public function index(Request $request)
    {
        $query = ProductionEntry::with(['product', 'bom', 'materials.material']);
        if ($request->status) $query->where('status', $request->status);
        if ($request->from) $query->where('production_date', '>=', $request->from);
        if ($request->to) $query->where('production_date', '<=', $request->to);
        return $this->success($query->orderByDesc('production_date')->paginate($request->per_page ?? 50));
    }

    public function show($id)
    {
        $entry = ProductionEntry::with(['product', 'bom.items.material', 'materials.material'])->findOrFail($id);
        return $this->success($entry);
    }

    public function store(Request $request)
    {
        $request->validate([
            'production_date' => 'required|date',
            'product_id' => 'required|uuid|exists:item_master,id',
            'bom_id' => 'nullable|uuid|exists:bill_of_materials,id',
            'quantity' => 'required|numeric|min:0.01',
            'materials' => 'required|array|min:1',
            'materials.*.material_id' => 'required|uuid|exists:item_master,id',
            'materials.*.quantity' => 'required|numeric|min:0',
            'materials.*.cost' => 'required|numeric|min:0',
        ]);

        $service = app(ManufacturingService::class);
        $entry = $service->createProduction($request->all());

        return $this->success($entry->load(['product', 'materials.material']), 'Production entry created', 201);
    }

    public function complete($id)
    {
        $service = app(ManufacturingService::class);
        $entry = $service->completeProduction($id);
        return $this->success($entry, 'Production completed');
    }

    public function destroy($id)
    {
        $entry = ProductionEntry::findOrFail($id);
        if ($entry->status === 'completed') {
            return $this->error('Cannot delete completed production entry', 422);
        }
        $entry->delete();
        return $this->success(null, 'Production entry deleted');
    }
}
