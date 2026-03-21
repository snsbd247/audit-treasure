<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspReseller;
use App\Modules\ISP\Models\IspCustomer;
use App\Modules\ISP\Models\IspInvoice;
use Illuminate\Http\Request;

class IspResellerController extends BaseController
{
    public function index(Request $request)
    {
        $query = IspReseller::withCount('customers');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
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
            'name'            => 'required|string|max:200',
            'phone'           => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:100',
            'address'         => 'nullable|string',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'status'          => 'in:active,inactive',
        ]);

        $data['balance'] = 0;

        return $this->created(IspReseller::create($data));
    }

    public function show(string $id)
    {
        return $this->success(
            IspReseller::withCount('customers')->findOrFail($id)
        );
    }

    public function update(Request $request, string $id)
    {
        $reseller = IspReseller::findOrFail($id);

        $data = $request->validate([
            'name'            => 'sometimes|string|max:200',
            'phone'           => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:100',
            'address'         => 'nullable|string',
            'commission_rate' => 'sometimes|numeric|min:0|max:100',
            'status'          => 'in:active,inactive',
        ]);

        $reseller->update($data);
        return $this->success($reseller->fresh()->loadCount('customers'));
    }

    public function destroy(string $id)
    {
        $reseller = IspReseller::findOrFail($id);

        // Check for active customers
        if ($reseller->customers()->where('status', 'active')->exists()) {
            return $this->error('Cannot delete reseller with active customers', 422);
        }

        $reseller->delete();
        return $this->success(null, 'Reseller deleted');
    }

    /**
     * Get reseller's customers.
     */
    public function customers(string $id)
    {
        $reseller = IspReseller::findOrFail($id);

        return $this->success(
            IspCustomer::with('package')
                ->where('reseller_id', $id)
                ->orderBy('name')
                ->get()
        );
    }

    /**
     * Get reseller earnings report.
     */
    public function earnings(Request $request, string $id)
    {
        $reseller = IspReseller::findOrFail($id);
        $customerIds = $reseller->customers()->pluck('id');

        $query = IspInvoice::whereIn('customer_id', $customerIds)
            ->where('status', 'paid');

        if ($request->from) $query->where('billing_date', '>=', $request->from);
        if ($request->to) $query->where('billing_date', '<=', $request->to);

        $totalPaid = $query->sum('amount');
        $commission = round($totalPaid * ($reseller->commission_rate / 100), 2);

        return $this->success([
            'reseller'        => $reseller,
            'total_collected'  => $totalPaid,
            'commission_rate'  => $reseller->commission_rate,
            'commission_amount' => $commission,
            'customer_count'   => $customerIds->count(),
        ]);
    }
}
