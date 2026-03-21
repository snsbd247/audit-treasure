<?php

namespace App\Modules\ISP\Services;

use App\Modules\ISP\Models\IspCustomer;
use App\Modules\ISP\Models\IspRouter;
use App\Modules\ISP\Models\IspUsageLog;
use Illuminate\Support\Facades\Log;

class UsageService
{
    /**
     * Fetch active session data from all routers and store usage logs.
     */
    public function fetchAndStoreUsage(): array
    {
        $routers = IspRouter::where('is_active', true)->get();
        $mikrotik = new MikrotikService();
        $recorded = 0;
        $errors = 0;

        foreach ($routers as $router) {
            try {
                if (!$mikrotik->connect($router)) {
                    Log::warning("UsageService: Cannot connect to router {$router->name}");
                    $errors++;
                    continue;
                }

                $sessions = $mikrotik->getActiveSessions();
                $mikrotik->disconnect();

                if (empty($sessions) || isset($sessions['!trap'])) {
                    continue;
                }

                foreach ($sessions as $session) {
                    $username = $session['name'] ?? null;
                    if (!$username) continue;

                    $customer = IspCustomer::where('pppoe_username', $username)->first();
                    if (!$customer) continue;

                    $uploadBytes = $this->parseBytes($session['bytes-in'] ?? '0');
                    $downloadBytes = $this->parseBytes($session['bytes-out'] ?? '0');

                    IspUsageLog::create([
                        'customer_id'    => $customer->id,
                        'upload_bytes'   => $uploadBytes,
                        'download_bytes' => $downloadBytes,
                        'recorded_at'    => now(),
                    ]);

                    $recorded++;
                }
            } catch (\Exception $e) {
                $errors++;
                Log::error("UsageService error for router {$router->id}: {$e->getMessage()}");
            }
        }

        Log::info("ISP Usage tracking: {$recorded} recorded, {$errors} errors");

        return ['recorded' => $recorded, 'errors' => $errors];
    }

    /**
     * Get usage summary for a customer within a date range.
     */
    public function getCustomerUsage(string $customerId, ?string $from = null, ?string $to = null): array
    {
        $query = IspUsageLog::where('customer_id', $customerId);

        if ($from) $query->where('recorded_at', '>=', $from);
        if ($to) $query->where('recorded_at', '<=', $to . ' 23:59:59');

        $logs = $query->orderBy('recorded_at', 'desc')->get();

        return [
            'total_upload'   => $logs->sum('upload_bytes'),
            'total_download' => $logs->sum('download_bytes'),
            'total_usage'    => $logs->sum('upload_bytes') + $logs->sum('download_bytes'),
            'records'        => $logs,
        ];
    }

    /**
     * Get daily aggregated usage for charts.
     */
    public function getDailyUsage(string $customerId, int $days = 30): array
    {
        $from = now()->subDays($days)->startOfDay();

        return IspUsageLog::where('customer_id', $customerId)
            ->where('recorded_at', '>=', $from)
            ->selectRaw('DATE(recorded_at) as date, SUM(upload_bytes) as upload, SUM(download_bytes) as download')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    private function parseBytes(string $value): int
    {
        return (int) $value;
    }
}
