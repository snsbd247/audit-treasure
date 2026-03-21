<?php

namespace App\Modules\ISP\Commands;

use App\Modules\ISP\Services\IspSmsService;
use Illuminate\Console\Command;

class SendDueReminders extends Command
{
    protected $signature = 'isp:send-due-reminders';
    protected $description = 'Send SMS reminders for overdue ISP invoices';

    public function handle(IspSmsService $smsService): int
    {
        $this->info('Sending due reminders...');

        $result = $smsService->sendAllDueReminders();

        $this->info("Done: {$result['sent']} sent, {$result['failed']} failed, {$result['total']} total");

        return self::SUCCESS;
    }
}
