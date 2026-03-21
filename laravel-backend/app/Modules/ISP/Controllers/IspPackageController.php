<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspPackage;
use Illuminate\Http\Request;

class IspPackageController extends BaseController
{
    public function index(Request $request)
    {
        $query = IspPackage::query();

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        return $this->paginated(
            $query->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
                  ->paginate($request->per_page ?? 25)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:200',
            'speed'            => 'required|string|max:50',
            'price'            => 'required|numeric|min:0',
            'billing_cycle'    => 'integer|min:1',
            'mikrotik_profile' => 'nullable|string|max:100',
            'status'           => 'in:active,inactive',
        ]);

        return $this->created(IspPackage::create($data));
    }

    public function show(string $id)
    {
        return $this->success(IspPackage::withCount('customers')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $package = IspPackage::findOrFail($id);

        $data = $request->validate([
            'name'             => 'sometimes|string|max:200',
            'speed'            => 'sometimes|string|max:50',
            'price'            => 'sometimes|numeric|min:0',
            'billing_cycle'    => 'sometimes|integer|min:1',
            'mikrotik_profile' => 'nullable|string|max:100',
            'status'           => 'in:active,inactive',
        ]);

        $package->update($data);
        return $this->success($package->fresh());
    }

    public function destroy(string $id)
    {
        IspPackage::findOrFail($id)->delete();
        return $this->success(null, 'Package deleted');
    }
}
