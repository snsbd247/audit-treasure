<?php

namespace App\Modules\ISP\Services;

use App\Modules\ISP\Models\IspCustomer;
use App\Modules\ISP\Models\IspInvoice;
use App\Modules\ISP\Services\IspSmsService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class BillingService
{
    /**
     * Generate monthly invoices for all active ISP customers.
     * Prevents duplicates for the same billing month.
     */
    public function generateMonthlyBills(?string $billingMonth = null): array
    {
        $now = Carbon::now();
        $month = $billingMonth ? Carbon::parse($billingMonth) : $now;
        $monthStart = $month->copy()->startOfMonth();
        $monthEnd = $month->copy()->endOfMonth();

        $customers = IspCustomer::with('package')
            ->where('status', 'active')
            ->whereNotNull('package_id')
            ->get();

        $generated = 0;
        $skipped = 0;
        $errors = [];

        foreach ($customers as $customer) {
            try {
                // Check for duplicate invoice this month
                $exists = IspInvoice::where('customer_id', $customer->id)
                    ->whereBetween('billing_date', [$monthStart, $monthEnd])
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                $amount = $customer->package->price ?? 0;
                if ($amount <= 0) {
                    $skipped++;
                    continue;
                }

                $invoice = IspInvoice::create([
                    'customer_id'  => $customer->id,
                    'amount'       => $amount,
                    'billing_date' => $now->toDateString(),
                    'due_date'     => $now->copy()->addDays(7)->toDateString(),
                    'status'       => 'unpaid',
                ]);

                // Send SMS notification
                try {
                    app(IspSmsService::class)->sendInvoiceGeneratedSms($invoice->load('customer'));
                } catch (\Exception $e) {
                    Log::warning("ISP SMS failed for invoice {$invoice->id}: {$e->getMessage()}");
                }

                $generated++;
            } catch (\Exception $e) {
                $errors[] = "Customer {$customer->id}: {$e->getMessage()}";
                Log::error("ISP Billing error for customer {$customer->id}: {$e->getMessage()}");
            }
        }

        Log::info("ISP Billing complete: {$generated} generated, {$skipped} skipped, " . count($errors) . " errors");

        return [
            'generated' => $generated,
            'skipped'   => $skipped,
            'errors'    => $errors,
            'total_customers' => $customers->count(),
        ];
    }

    /**
     * Mark overdue invoices (past due_date and still unpaid).
     */
    public function markOverdueInvoices(): int
    {
        return IspInvoice::where('status', 'unpaid')
            ->where('due_date', '<', Carbon::today())
            ->update(['status' => 'overdue']);
    }

    /**
     * Suspend customers with unpaid/overdue invoices older than 30 days.
     */
    public function suspendDelinquentCustomers(): int
    {
        $cutoff = Carbon::now()->subDays(30);
        $count = 0;

        $delinquent = IspCustomer::where('status', 'active')
            ->whereHas('invoices', function ($q) use ($cutoff) {
                $q->whereIn('status', ['unpaid', 'overdue'])
                  ->where('due_date', '<', $cutoff);
            })
            ->get();

        foreach ($delinquent as $customer) {
            $customer->update(['status' => 'suspended']);
            $count++;
        }

        Log::info("ISP: Suspended {$count} delinquent customers");
        return $count;
    }

    /**
     * Re-activate a customer if all invoices are paid.
     */
    public function reactivateIfClear(string $customerId): bool
    {
        $customer = IspCustomer::find($customerId);
        if (!$customer || $customer->status !== 'suspended') {
            return false;
        }

        $hasUnpaid = $customer->invoices()
            ->whereIn('status', ['unpaid', 'overdue'])
            ->exists();

        if (!$hasUnpaid) {
            $customer->update(['status' => 'active']);
            Log::info("ISP: Customer {$customerId} reactivated (all invoices paid)");
            return true;
        }

        return false;
    }
}
