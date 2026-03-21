<?php

namespace App\Modules\ISP\Commands;

use App\Modules\ISP\Services\BillingService;
use Illuminate\Console\Command;

class GenerateIspBills extends Command
{
    protected $signature = 'isp:generate-bills {--month= : Billing month (YYYY-MM), defaults to current}';
    protected $description = 'Generate monthly ISP invoices for all active customers';

    public function handle(BillingService $service): int
    {
        $this->info('Starting ISP bill generation...');

        // 1. Generate invoices
        $result = $service->generateMonthlyBills($this->option('month'));

        $this->info("Total customers: {$result['total_customers']}");
        $this->info("Invoices generated: {$result['generated']}");
        $this->info("Skipped (duplicate/no price): {$result['skipped']}");

        if (!empty($result['errors'])) {
            $this->warn("Errors: " . count($result['errors']));
            foreach ($result['errors'] as $err) {
                $this->error("  - {$err}");
            }
        }

        // 2. Mark overdue invoices
        $overdue = $service->markOverdueInvoices();
        $this->info("Invoices marked overdue: {$overdue}");

        // 3. Suspend delinquent customers
        $suspended = $service->suspendDelinquentCustomers();
        $this->info("Customers suspended: {$suspended}");

        $this->info('ISP billing complete.');
        return self::SUCCESS;
    }
}
