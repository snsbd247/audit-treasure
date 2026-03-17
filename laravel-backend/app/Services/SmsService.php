<?php
namespace App\Services;

use App\Models\SmsLog;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected string $apiKey;
    protected string $senderId;
    protected bool $enabled;

    public function __construct()
    {
        $this->apiKey = SystemSetting::getValue('sms_api_key', '');
        $this->senderId = SystemSetting::getValue('sms_sender_id', '');
        $this->enabled = SystemSetting::getValue('sms_enabled', 'false') === 'true';
    }

    /**
     * Send SMS via Greenweb API
     */
    public function sendSMS(string $phone, string $message, ?string $eventType = null, ?string $referenceId = null): bool
    {
        if (!$this->enabled) {
            Log::info('SMS disabled, skipping: ' . $phone);
            return false;
        }

        if (empty($this->apiKey)) {
            Log::warning('SMS API key not configured');
            return false;
        }

        $status = 'sent';
        $response = '';

        try {
            $params = [
                'token' => $this->apiKey,
                'to' => $phone,
                'message' => $message,
            ];
            if ($this->senderId) {
                $params['from'] = $this->senderId;
            }

            $result = Http::get('http://api.greenweb.com.bd/api.php', $params);
            $response = $result->body();

            if (!$result->successful() || str_contains(strtolower($response), 'error')) {
                $status = 'failed';
            }
        } catch (\Exception $e) {
            $status = 'failed';
            $response = $e->getMessage();
            Log::error('SMS send error: ' . $e->getMessage());
        }

        // Log the SMS
        SmsLog::create([
            'phone' => $phone,
            'message' => $message,
            'status' => $status,
            'response' => $response,
            'event_type' => $eventType,
            'reference_id' => $referenceId,
        ]);

        return $status === 'sent';
    }

    /**
     * Send Sales Invoice SMS
     */
    public function sendInvoiceSms(string $phone, float $amount): bool
    {
        $message = "Invoice Generated: Amount ৳" . number_format($amount, 2) . ". Thank you.";
        return $this->sendSMS($phone, $message, 'sales_invoice');
    }

    /**
     * Send Payroll SMS
     */
    public function sendPayrollSms(string $phone, float $netSalary, int $month, int $year): bool
    {
        $message = "Salary credited: ৳" . number_format($netSalary, 2) . " for {$month}/{$year}.";
        return $this->sendSMS($phone, $message, 'payroll');
    }

    /**
     * Send Leave Approval SMS
     */
    public function sendLeaveApprovalSms(string $phone): bool
    {
        $message = "Your leave request has been approved.";
        return $this->sendSMS($phone, $message, 'leave_approval');
    }
}
