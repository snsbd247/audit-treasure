<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Mark users offline if inactive for >2 minutes
        $schedule->command('users:mark-offline')->everyTwoMinutes();
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
    }
}
