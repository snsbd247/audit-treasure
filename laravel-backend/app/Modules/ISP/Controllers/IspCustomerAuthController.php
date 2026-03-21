<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspCustomer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class IspCustomerAuthController extends BaseController
{
    /**
     * Customer login using phone/username + password (pppoe_password)
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Find by phone or pppoe_username
        $customer = IspCustomer::with('package')
            ->where(function ($q) use ($request) {
                $q->where('phone', $request->username)
                  ->orWhere('pppoe_username', $request->username);
            })
            ->first();

        if (!$customer) {
            return $this->error('Invalid credentials', 401);
        }

        // Verify password against pppoe_password (plain text in ISP context)
        if ($customer->pppoe_password !== $request->password) {
            return $this->error('Invalid credentials', 401);
        }

        if ($customer->status === 'terminated') {
            return $this->error('Account has been terminated', 403);
        }

        // Generate a simple token (SHA256 hash)
        $token = hash('sha256', $customer->id . now()->timestamp . rand(1000, 9999));

        // Store token in cache for 24 hours
        cache()->put("isp_customer_token:{$token}", $customer->id, now()->addHours(24));

        return $this->success([
            'token' => $token,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'pppoe_username' => $customer->pppoe_username,
                'status' => $customer->status,
                'package' => $customer->package ? [
                    'name' => $customer->package->name,
                    'speed' => $customer->package->speed,
                    'price' => $customer->package->price,
                ] : null,
            ],
        ]);
    }

    /**
     * Get customer profile
     */
    public function profile(Request $request)
    {
        $customer = $this->resolveCustomer($request);
        if (!$customer) return $this->error('Unauthorized', 401);

        return $this->success($customer->load('package'));
    }

    /**
     * Get customer invoices
     */
    public function invoices(Request $request)
    {
        $customer = $this->resolveCustomer($request);
        if (!$customer) return $this->error('Unauthorized', 401);

        $invoices = $customer->invoices()
            ->with('payments')
            ->orderByDesc('billing_date')
            ->paginate($request->per_page ?? 15);

        return $this->paginated($invoices);
    }

    /**
     * Get customer payments
     */
    public function payments(Request $request)
    {
        $customer = $this->resolveCustomer($request);
        if (!$customer) return $this->error('Unauthorized', 401);

        $invoiceIds = $customer->invoices()->pluck('id');

        $payments = \App\Modules\ISP\Models\IspPayment::whereIn('invoice_id', $invoiceIds)
            ->with('invoice')
            ->orderByDesc('paid_at')
            ->paginate($request->per_page ?? 15);

        return $this->paginated($payments);
    }

    /**
     * Resolve customer from bearer token
     */
    private function resolveCustomer(Request $request): ?IspCustomer
    {
        $token = $request->bearerToken();
        if (!$token) return null;

        $customerId = cache()->get("isp_customer_token:{$token}");
        if (!$customerId) return null;

        return IspCustomer::find($customerId);
    }
}
