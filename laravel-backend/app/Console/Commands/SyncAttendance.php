<?php
namespace App\Console\Commands;

use App\Services\BiometricSyncService;
use Illuminate\Console\Command;

class SyncAttendance extends Command
{
    protected $signature = 'attendance:sync';
    protected $description = 'Sync attendance logs from all active ZKTeco biometric devices';

    public function handle(BiometricSyncService $service): int
    {
        $this->info('Starting biometric attendance sync...');

        $results = $service->syncAll();

        foreach ($results as $device => $result) {
            if (isset($result['error'])) {
                $this->error("  {$device}: {$result['error']}");
            } else {
                $this->info("  {$device}: Synced {$result['synced']} records (total logs: {$result['total_logs']})");
            }
        }

        $this->info('Sync complete.');
        return 0;
    }
}
