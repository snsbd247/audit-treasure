<?php

namespace App\Http\Controllers\Manufacturing;

use App\Http\Controllers\BaseController;
use App\Models\BillOfMaterial;
use App\Models\BomItem;
use Illuminate\Http\Request;

class BomController extends BaseController
{
    public function index(Request $request)
    {
        $query = BillOfMaterial::with(['product', 'items.material']);
        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }
        return $this->success($query->orderByDesc('created_at')->paginate($request->per_page ?? 50));
    }

    public function show($id)
    {
        $bom = BillOfMaterial::with(['product', 'items.material'])->findOrFail($id);
        return $this->success($bom);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:200',
            'product_id' => 'required|uuid|exists:item_master,id',
            'items' => 'required|array|min:1',
            'items.*.material_id' => 'required|uuid|exists:item_master,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'nullable|string|max:20',
        ]);

        $bom = BillOfMaterial::create($request->only(['name', 'product_id', 'notes']));

        foreach ($request->items as $item) {
            BomItem::create([
                'bom_id' => $bom->id,
                'material_id' => $item['material_id'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? 'pcs',
            ]);
        }

        return $this->success($bom->load('items.material'), 'BOM created', 201);
    }

    public function update(Request $request, $id)
    {
        $bom = BillOfMaterial::findOrFail($id);
        $bom->update($request->only(['name', 'product_id', 'notes']));

        if ($request->has('items')) {
            $bom->items()->delete();
            foreach ($request->items as $item) {
                BomItem::create([
                    'bom_id' => $bom->id,
                    'material_id' => $item['material_id'],
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'] ?? 'pcs',
                ]);
            }
        }

        return $this->success($bom->load('items.material'), 'BOM updated');
    }

    public function destroy($id)
    {
        BillOfMaterial::findOrFail($id)->delete();
        return $this->success(null, 'BOM deleted');
    }
}
