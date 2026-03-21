<?php

namespace App\Modules\ISP\Services;

use App\Modules\ISP\Models\IspInvoice;
use App\Modules\ISP\Models\IspPayment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * bKash Payment Gateway Integration (Tokenized Checkout v1.2)
 *
 * Required .env variables:
 *   BKASH_APP_KEY
 *   BKASH_APP_SECRET
 *   BKASH_USERNAME
 *   BKASH_PASSWORD
 *   BKASH_BASE_URL       (sandbox: https://tokenized.sandbox.bka.sh/v1.2.0-beta)
 *   BKASH_CALLBACK_URL   (your domain + /api/isp/bkash/callback)
 */
class BkashService
{
    private string $baseUrl;
    private string $appKey;
    private string $appSecret;
    private string $username;
    private string $password;
    private string $callbackUrl;

    public function __construct()
    {
        $this->baseUrl     = rtrim(env('BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'), '/');
        $this->appKey      = env('BKASH_APP_KEY', '');
        $this->appSecret   = env('BKASH_APP_SECRET', '');
        $this->username    = env('BKASH_USERNAME', '');
        $this->password    = env('BKASH_PASSWORD', '');
        $this->callbackUrl = env('BKASH_CALLBACK_URL', url('/api/isp/bkash/callback'));
    }

    // ──────────────────────────────────────────────
    //  TOKEN
    // ──────────────────────────────────────────────

    /**
     * Get or refresh bKash auth token (cached for 55 minutes).
     */
    public function getToken(): ?string
    {
        return Cache::remember('bkash_token', 55 * 60, function () {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
                'username'     => $this->username,
                'password'     => $this->password,
            ])->post("{$this->baseUrl}/tokenized/checkout/token/grant", [
                'app_key'    => $this->appKey,
                'app_secret' => $this->appSecret,
            ]);

            if ($response->successful() && $response->json('id_token')) {
                Log::info('bKash: Token acquired');
                return $response->json('id_token');
            }

            Log::error('bKash: Token grant failed', ['response' => $response->json()]);
            return null;
        });
    }

    // ──────────────────────────────────────────────
    //  CREATE PAYMENT
    // ──────────────────────────────────────────────

    /**
     * Initiate a bKash payment.
     * Returns bKashURL for redirect + paymentID.
     */
    public function createPayment(float $amount, string $invoiceId): array
    {
        $token = $this->getToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Could not acquire bKash token'];
        }

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
            'Authorization' => $token,
            'X-APP-Key'     => $this->appKey,
        ])->post("{$this->baseUrl}/tokenized/checkout/create", [
            'mode'                => '0011',
            'payerReference'      => $invoiceId,
            'callbackURL'         => $this->callbackUrl . '?invoice_id=' . $invoiceId,
            'amount'              => number_format($amount, 2, '.', ''),
            'currency'            => 'BDT',
            'intent'              => 'sale',
            'merchantInvoiceNumber' => $invoiceId,
        ]);

        $data = $response->json();

        if ($response->successful() && !empty($data['bkashURL'])) {
            Log::info("bKash: Payment created for invoice {$invoiceId}", ['paymentID' => $data['paymentID']]);
            return [
                'success'    => true,
                'bkashURL'   => $data['bkashURL'],
                'paymentID'  => $data['paymentID'],
            ];
        }

        Log::error("bKash: Create payment failed for invoice {$invoiceId}", ['response' => $data]);
        return [
            'success' => false,
            'message' => $data['statusMessage'] ?? 'Payment creation failed',
        ];
    }

    // ──────────────────────────────────────────────
    //  EXECUTE PAYMENT
    // ──────────────────────────────────────────────

    /**
     * Execute (confirm) a payment after user completes bKash flow.
     */
    public function executePayment(string $paymentID): array
    {
        $token = $this->getToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Could not acquire bKash token'];
        }

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
            'Authorization' => $token,
            'X-APP-Key'     => $this->appKey,
        ])->post("{$this->baseUrl}/tokenized/checkout/execute", [
            'paymentID' => $paymentID,
        ]);

        $data = $response->json();

        if ($response->successful() && ($data['statusCode'] ?? '') === '0000') {
            Log::info("bKash: Payment executed", ['trxID' => $data['trxID'] ?? null]);
            return [
                'success'        => true,
                'transactionId'  => $data['trxID'] ?? null,
                'amount'         => $data['amount'] ?? 0,
                'paymentID'      => $paymentID,
                'raw'            => $data,
            ];
        }

        Log::error("bKash: Execute payment failed", ['response' => $data]);
        return [
            'success' => false,
            'message' => $data['statusMessage'] ?? 'Payment execution failed',
            'raw'     => $data,
        ];
    }

    // ──────────────────────────────────────────────
    //  QUERY PAYMENT
    // ──────────────────────────────────────────────

    /**
     * Query payment status from bKash.
     */
    public function queryPayment(string $paymentID): array
    {
        $token = $this->getToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Could not acquire bKash token'];
        }

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
            'Authorization' => $token,
            'X-APP-Key'     => $this->appKey,
        ])->post("{$this->baseUrl}/tokenized/checkout/payment/status", [
            'paymentID' => $paymentID,
        ]);

        $data = $response->json();

        if ($response->successful()) {
            return ['success' => true, 'data' => $data];
        }

        return ['success' => false, 'message' => 'Query failed', 'data' => $data];
    }
}
