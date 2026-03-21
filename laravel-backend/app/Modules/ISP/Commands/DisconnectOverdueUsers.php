<?php

namespace App\Modules\ISP\Commands;

use App\Modules\ISP\Models\IspCustomer;
use App\Modules\ISP\Models\IspInvoice;
use App\Modules\ISP\Services\MikrotikService;
use App\Modules\ISP\Services\IspSmsService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DisconnectOverdueUsers extends Command
{
    protected $signature = 'isp:disconnect-overdue {--grace=3 : Grace period in days after due date}';
    protected $description = 'Disconnect PPPoE users with overdue invoices past grace period';

    public function handle(): int
    {
        $graceDays = (int) $this->option('grace');
        $cutoff = Carbon::today()->subDays($graceDays);

        $this->info("Checking for overdue invoices (due before {$cutoff->toDateString()}, grace: {$graceDays} days)...");

        $customers = IspCustomer::with(['router'])
            ->where('status', 'active')
            ->whereHas('invoices', function ($q) use ($cutoff) {
                $q->whereIn('status', ['unpaid', 'overdue'])
                  ->where('due_date', '<', $cutoff);
            })
            ->get();

        if ($customers->isEmpty()) {
            $this->info('No overdue customers found.');
            return self::SUCCESS;
        }

        $mikrotik = new MikrotikService();
        $disconnected = 0;
        $errors = 0;

        foreach ($customers as $customer) {
            try {
                $this->line("Processing: {$customer->name} ({$customer->pppoe_username})");

                // Connect to customer's router
                if ($customer->router && $mikrotik->connect($customer->router)) {
                    $mikrotik->disableUser($customer->pppoe_username);
                    $mikrotik->disconnectUser($customer->pppoe_username);
                    $mikrotik->disconnect();
                }

                // Update status
                $customer->update(['status' => 'suspended']);

                // Mark invoices as overdue
                IspInvoice::where('customer_id', $customer->id)
                    ->where('status', 'unpaid')
                    ->where('due_date', '<', Carbon::today())
                    ->update(['status' => 'overdue']);

                // Send SMS notification
                try {
                    app(IspSmsService::class)->send(
                        $customer->phone,
                        "Dear {$customer->name}, your internet has been suspended due to unpaid bills. Please pay to restore service."
                    );
                } catch (\Exception $e) {
                    Log::warning("SMS failed for {$customer->id}: {$e->getMessage()}");
                }

                $disconnected++;
                $this->info("  ✓ Suspended & disconnected");
            } catch (\Exception $e) {
                $errors++;
                $this->error("  ✗ Error: {$e->getMessage()}");
                Log::error("ISP disconnect error for {$customer->id}: {$e->getMessage()}");
            }
        }

        $this->info("Done: {$disconnected} disconnected, {$errors} errors");
        Log::info("ISP auto-disconnect: {$disconnected} suspended, {$errors} errors");

        return self::SUCCESS;
    }
}
