<?php
namespace App\Http\Controllers\Manufacturing;
use App\Http\Controllers\BaseController;
use App\Services\ManufacturingService;
use App\Models\ProductionEntry;
use Illuminate\Http\Request;

class ProductionController extends BaseController
{
    public function __construct(private ManufacturingService $service) {}

    public function index(Request $request)
    {
        return $this->paginated(ProductionEntry::with('product', 'bom')
            ->orderByDesc('production_date')->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'production_date' => 'required|date',
            'product_id' => 'required|exists:item_master,id',
            'quantity' => 'required|numeric|min:0.01',
            'materials' => 'required|array',
            'materials.*.material_id' => 'required|exists:item_master,id',
            'materials.*.quantity' => 'required|numeric|min:0.01',
            'materials.*.cost' => 'required|numeric|min:0',
        ]);
        $data = array_merge($request->only('production_date', 'product_id', 'bom_id', 'branch_id', 'quantity', 'labor_cost', 'electricity_cost', 'notes'), ['user_id' => $request->user()->id]);
        return $this->created($this->service->createProduction($data, $request->materials));
    }

    public function show(string $id)
    {
        return $this->success(ProductionEntry::with('materials.material', 'product', 'bom')->findOrFail($id));
    }
}
