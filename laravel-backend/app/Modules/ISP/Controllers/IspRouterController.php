<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Models\IspRouter;
use App\Modules\ISP\Services\MikrotikService;
use Illuminate\Http\Request;

class IspRouterController extends BaseController
{
    public function __construct(private MikrotikService $mikrotik) {}

    public function index(Request $request)
    {
        $query = IspRouter::withCount('customers');

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        return $this->paginated(
            $query->orderByDesc('created_at')->paginate($request->per_page ?? 25)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:200',
            'ip_address' => 'required|string|max:45',
            'username'   => 'required|string|max:100',
            'password'   => 'nullable|string|max:200',
            'port'       => 'integer|min:1|max:65535',
            'is_active'  => 'boolean',
            'notes'      => 'nullable|string',
        ]);

        return $this->created(IspRouter::create($data));
    }

    public function show(string $id)
    {
        return $this->success(IspRouter::withCount('customers')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $router = IspRouter::findOrFail($id);

        $data = $request->validate([
            'name'       => 'sometimes|string|max:200',
            'ip_address' => 'sometimes|string|max:45',
            'username'   => 'sometimes|string|max:100',
            'password'   => 'nullable|string|max:200',
            'port'       => 'integer|min:1|max:65535',
            'is_active'  => 'boolean',
            'notes'      => 'nullable|string',
        ]);

        $router->update($data);
        return $this->success($router->fresh());
    }

    public function destroy(string $id)
    {
        IspRouter::findOrFail($id)->delete();
        return $this->success(null, 'Router deleted');
    }

    /**
     * POST /api/isp/routers/test
     * Test connection to a router.
     */
    public function testConnection(Request $request)
    {
        $data = $request->validate([
            'router_id'  => 'required_without_all:ip_address|exists:isp_routers,id',
            'ip_address' => 'required_without_all:router_id|string',
            'username'   => 'required_without_all:router_id|string',
            'password'   => 'nullable|string',
            'port'       => 'integer|min:1|max:65535',
        ]);

        try {
            if (!empty($data['router_id'])) {
                $router = IspRouter::findOrFail($data['router_id']);
                $ok = $this->mikrotik->connect($router);
            } else {
                $ok = $this->mikrotik->connectRaw(
                    $data['ip_address'],
                    $data['username'],
                    $data['password'] ?? '',
                    $data['port'] ?? 8728
                );
            }

            $this->mikrotik->disconnect();

            if ($ok) {
                return $this->success(['reachable' => true], 'Connection successful');
            }

            return $this->error('Connection failed — check credentials or firewall', 422);
        } catch (\Exception $e) {
            return $this->error('Connection error: ' . $e->getMessage(), 500);
        }
    }
}
