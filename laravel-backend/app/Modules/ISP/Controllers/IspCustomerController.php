<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspCustomer;
use Illuminate\Http\Request;

class IspCustomerController extends BaseController
{
    public function index(Request $request)
    {
        $query = IspCustomer::with('package');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('pppoe_username', 'like', "%{$request->search}%");
            });
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->package_id) {
            $query->where('package_id', $request->package_id);
        }

        return $this->paginated(
            $query->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
                  ->paginate($request->per_page ?? 25)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:200',
            'phone'          => 'nullable|string|max:20',
            'address'        => 'nullable|string',
            'package_id'     => 'required|exists:isp_packages,id',
            'pppoe_username' => 'required|string|unique:isp_customers,pppoe_username',
            'pppoe_password' => 'required|string|min:4',
            'ip_address'     => 'nullable|string|max:45',
            'mac_address'    => 'nullable|string|max:17',
            'status'         => 'in:active,suspended,terminated',
        ]);

        return $this->created(IspCustomer::create($data)->load('package'));
    }

    public function show(string $id)
    {
        return $this->success(
            IspCustomer::with(['package', 'invoices' => fn($q) => $q->latest()->limit(10)])
                ->findOrFail($id)
        );
    }

    public function update(Request $request, string $id)
    {
        $customer = IspCustomer::findOrFail($id);

        $data = $request->validate([
            'name'           => 'sometimes|string|max:200',
            'phone'          => 'nullable|string|max:20',
            'address'        => 'nullable|string',
            'package_id'     => 'sometimes|exists:isp_packages,id',
            'pppoe_username' => "sometimes|string|unique:isp_customers,pppoe_username,{$id}",
            'pppoe_password' => 'sometimes|string|min:4',
            'ip_address'     => 'nullable|string|max:45',
            'mac_address'    => 'nullable|string|max:17',
            'status'         => 'in:active,suspended,terminated',
        ]);

        $customer->update($data);
        return $this->success($customer->fresh()->load('package'));
    }

    public function destroy(string $id)
    {
        IspCustomer::findOrFail($id)->delete();
        return $this->success(null, 'Customer deleted');
    }
}
