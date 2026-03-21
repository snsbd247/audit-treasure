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

        // Automated SQL backup (daily at 2 AM)
        $schedule->command('backup:database --type=auto')->dailyAt('02:00');

        // ISP: Generate monthly bills on 1st of each month at 6 AM
        $schedule->command('isp:generate-bills')->monthlyOn(1, '06:00');

        // ISP: Send due reminders daily at 9 AM
        $schedule->command('isp:send-due-reminders')->dailyAt('09:00');

        // ISP: Auto-disconnect overdue users daily at 10 AM
        $schedule->command('isp:disconnect-overdue')->dailyAt('10:00');

        // ISP: Track bandwidth usage every 10 minutes
        $schedule->command('isp:track-usage')->everyTenMinutes();
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        $this->load(app_path('Modules/ISP/Commands'));
    }
}
