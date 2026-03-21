<?php

namespace App\Modules\ISP\Commands;

use App\Modules\ISP\Services\UsageService;
use Illuminate\Console\Command;

class TrackUsage extends Command
{
    protected $signature = 'isp:track-usage';
    protected $description = 'Fetch bandwidth usage from MikroTik routers and store logs';

    public function handle(): int
    {
        $this->info('Fetching bandwidth usage from routers...');

        $result = app(UsageService::class)->fetchAndStoreUsage();

        $this->info("Done: {$result['recorded']} sessions recorded, {$result['errors']} errors");

        return self::SUCCESS;
    }
}
