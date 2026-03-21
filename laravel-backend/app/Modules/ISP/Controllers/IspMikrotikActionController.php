<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspCustomer;
use App\Modules\ISP\Models\IspRouter;
use App\Modules\ISP\Services\MikrotikService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Handles MikroTik-integrated customer actions:
 * suspend, activate, sync PPPoE user.
 */
class IspMikrotikActionController extends BaseController
{
    public function __construct(private MikrotikService $mikrotik) {}

    /**
     * POST /api/isp/customers/{id}/suspend
     * Disable PPPoE user on router + update DB status.
     */
    public function suspend(string $id)
    {
        $customer = IspCustomer::with('package')->findOrFail($id);

        if ($customer->status === 'suspended') {
            return $this->error('Customer is already suspended', 422);
        }

        $routerResult = $this->executeOnRouter($customer, function () use ($customer) {
            $this->mikrotik->disableUser($customer->pppoe_username);
            $this->mikrotik->disconnectUser($customer->pppoe_username);
        });

        $customer->update(['status' => 'suspended']);

        return $this->success([
            'customer'      => $customer->fresh(),
            'router_synced' => $routerResult,
        ], 'Customer suspended');
    }

    /**
     * POST /api/isp/customers/{id}/activate
     * Enable PPPoE user on router + update DB status.
     */
    public function activate(string $id)
    {
        $customer = IspCustomer::with('package')->findOrFail($id);

        if ($customer->status === 'active') {
            return $this->error('Customer is already active', 422);
        }

        $routerResult = $this->executeOnRouter($customer, function () use ($customer) {
            $this->mikrotik->enableUser($customer->pppoe_username);
        });

        $customer->update(['status' => 'active']);

        return $this->success([
            'customer'      => $customer->fresh(),
            'router_synced' => $routerResult,
        ], 'Customer activated');
    }

    /**
     * POST /api/isp/customers/{id}/sync-pppoe
     * Create or update PPPoE secret on the router.
     */
    public function syncPPPoE(string $id)
    {
        $customer = IspCustomer::with('package')->findOrFail($id);
        $profile = $customer->package->mikrotik_profile ?? 'default';

        $routerResult = $this->executeOnRouter($customer, function () use ($customer, $profile) {
            // Try to add; if exists, update profile
            $result = $this->mikrotik->addPPPoEUser(
                $customer->pppoe_username,
                $customer->pppoe_password,
                $profile,
                $customer->ip_address
            );

            // If user already exists, just update the profile
            if (isset($result[0]['!trap'])) {
                $this->mikrotik->updateUserProfile($customer->pppoe_username, $profile);
            }
        });

        return $this->success(['router_synced' => $routerResult], 'PPPoE user synced');
    }

    /**
     * POST /api/isp/customers/{id}/disconnect
     * Disconnect active PPPoE session.
     */
    public function disconnectSession(string $id)
    {
        $customer = IspCustomer::findOrFail($id);

        $routerResult = $this->executeOnRouter($customer, function () use ($customer) {
            $this->mikrotik->disconnectUser($customer->pppoe_username);
        });

        return $this->success(['router_synced' => $routerResult], 'Session disconnected');
    }

    // ──────────────────────────────────────────────

    /**
     * Execute a callback on the customer's assigned router.
     * Returns true if router action succeeded, false if skipped/failed.
     */
    private function executeOnRouter(IspCustomer $customer, \Closure $action): bool
    {
        if (!$customer->router_id) {
            // No router assigned — try first active router
            $router = IspRouter::where('is_active', true)->first();
            if (!$router) {
                Log::warning("ISP: No active router found for customer {$customer->id}");
                return false;
            }
        } else {
            $router = IspRouter::find($customer->router_id);
            if (!$router || !$router->is_active) {
                Log::warning("ISP: Router {$customer->router_id} inactive or missing");
                return false;
            }
        }

        try {
            if (!$this->mikrotik->connect($router)) {
                Log::error("ISP: Could not connect to router {$router->ip_address}");
                return false;
            }

            $action();
            $this->mikrotik->disconnect();
            return true;
        } catch (\Exception $e) {
            Log::error("ISP: Router action failed — {$e->getMessage()}");
            $this->mikrotik->disconnect();
            return false;
        }
    }
}
