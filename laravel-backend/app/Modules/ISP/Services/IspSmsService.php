<?php

namespace App\Modules\ISP\Services;

use App\Services\SmsService;
use App\Modules\ISP\Models\IspCustomer;
use App\Modules\ISP\Models\IspInvoice;

class IspSmsService
{
    protected SmsService $sms;

    public function __construct(SmsService $sms)
    {
        $this->sms = $sms;
    }

    /**
     * SMS after invoice generated
     */
    public function sendInvoiceGeneratedSms(IspInvoice $invoice): bool
    {
        $customer = $invoice->customer;
        if (!$customer || !$customer->phone) return false;

        $message = "Dear {$customer->name}, your internet bill of ৳" .
            number_format($invoice->amount, 2) .
            " has been generated. Due date: {$invoice->due_date->format('d M Y')}. " .
            "Please pay on time to avoid disconnection.";

        return $this->sms->sendSMS($customer->phone, $message, 'isp_invoice', $invoice->id);
    }

    /**
     * SMS after payment received
     */
    public function sendPaymentReceivedSms(IspInvoice $invoice, float $amount, string $method): bool
    {
        $customer = $invoice->customer;
        if (!$customer || !$customer->phone) return false;

        $message = "Dear {$customer->name}, payment of ৳" .
            number_format($amount, 2) .
            " received via {$method}. Thank you for your payment.";

        return $this->sms->sendSMS($customer->phone, $message, 'isp_payment', $invoice->id);
    }

    /**
     * SMS for due reminder
     */
    public function sendDueReminderSms(IspInvoice $invoice): bool
    {
        $customer = $invoice->customer;
        if (!$customer || !$customer->phone) return false;

        $message = "Reminder: Dear {$customer->name}, your internet bill of ৳" .
            number_format($invoice->amount, 2) .
            " is overdue. Please pay immediately to avoid service suspension.";

        return $this->sms->sendSMS($customer->phone, $message, 'isp_due_reminder', $invoice->id);
    }

    /**
     * Send due reminders for all overdue/unpaid invoices past due date
     */
    public function sendAllDueReminders(): array
    {
        $invoices = IspInvoice::with('customer')
            ->whereIn('status', ['unpaid', 'overdue'])
            ->where('due_date', '<', now())
            ->get();

        $sent = 0;
        $failed = 0;

        foreach ($invoices as $invoice) {
            if ($this->sendDueReminderSms($invoice)) {
                $sent++;
            } else {
                $failed++;
            }
        }

        return ['sent' => $sent, 'failed' => $failed, 'total' => $invoices->count()];
    }
}
