<?php

namespace App\Services;

use App\Models\AccVoucher;
use App\Models\VoucherEntry;
use App\Repositories\AccountRepository;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    public function __construct(
        private AccountRepository $accountRepo,
        private NumberSequenceService $seqService,
    ) {}

    /**
     * Create and optionally auto-approve an accounting voucher with balanced entries.
     */
    public function createVoucher(array $data, array $entries, bool $autoApprove = false): AccVoucher
    {
        // Validate balanced
        $totalDebit = collect($entries)->sum('debit');
        $totalCredit = collect($entries)->sum('credit');
        if (abs($totalDebit - $totalCredit) > 0.01) {
            throw new \InvalidArgumentException("Entries not balanced: D={$totalDebit} C={$totalCredit}");
        }

        $seqMap = ['journal' => 'journal_voucher', 'payment' => 'payment_voucher', 'receipt' => 'receipt_voucher', 'contra' => 'contra_voucher'];
        $seqId = $seqMap[$data['voucher_type']] ?? throw new \InvalidArgumentException("Unknown type: {$data['voucher_type']}");

        return DB::transaction(function () use ($data, $entries, $autoApprove, $seqId, $totalDebit) {
            $voucherNumber = $this->seqService->next($seqId);

            $voucher = AccVoucher::create([
                'voucher_number' => $voucherNumber,
                'voucher_type' => $data['voucher_type'],
                'voucher_date' => $data['voucher_date'],
                'description' => $data['description'] ?? '',
                'total_amount' => $totalDebit,
                'status' => $autoApprove ? 'approved' : 'draft',
                'branch_id' => $data['branch_id'] ?? null,
                'financial_year_id' => $data['financial_year_id'] ?? null,
                'created_by' => $data['created_by'] ?? null,
                'approved_by' => $autoApprove ? ($data['created_by'] ?? null) : null,
                'approved_at' => $autoApprove ? now() : null,
            ]);

            foreach ($entries as $idx => $entry) {
                VoucherEntry::create([
                    'voucher_id' => $voucher->id,
                    'account_id' => $entry['account_id'],
                    'debit' => $entry['debit'] ?? 0,
                    'credit' => $entry['credit'] ?? 0,
                    'narration' => $entry['narration'] ?? '',
                    'sort_order' => $idx,
                ]);
            }

            return $voucher->load('entries');
        });
    }

    /**
     * Auto-post a double-entry voucher from another module (e.g., Sales, Purchase).
     */
    public function autoPost(string $debitAccountName, string $creditAccountName, float $amount, string $description, string $voucherType, array $ctx): ?AccVoucher
    {
        $debitAcct = $this->accountRepo->findByName($debitAccountName);
        $creditAcct = $this->accountRepo->findByName($creditAccountName);

        if (!$debitAcct || !$creditAcct) {
            \Log::warning("Auto-post skipped: account '{$debitAccountName}' or '{$creditAccountName}' not found");
            return null;
        }

        return $this->createVoucher([
            'voucher_type' => $voucherType,
            'voucher_date' => $ctx['date'],
            'description' => $description,
            'branch_id' => $ctx['branch_id'] ?? null,
            'financial_year_id' => $ctx['financial_year_id'] ?? null,
            'created_by' => $ctx['user_id'] ?? null,
        ], [
            ['account_id' => $debitAcct->id, 'debit' => $amount, 'credit' => 0, 'narration' => $description],
            ['account_id' => $creditAcct->id, 'debit' => 0, 'credit' => $amount, 'narration' => $description],
        ], true);
    }

    public function approveVoucher(string $id, string $userId): AccVoucher
    {
        $voucher = AccVoucher::findOrFail($id);
        if ($voucher->status === 'approved') throw new \RuntimeException('Already approved');
        $voucher->update(['status' => 'approved', 'approved_by' => $userId, 'approved_at' => now()]);
        return $voucher;
    }

    public function rejectVoucher(string $id): AccVoucher
    {
        $voucher = AccVoucher::findOrFail($id);
        $voucher->update(['status' => 'rejected']);
        return $voucher;
    }

    /**
     * Trial Balance: sum debits/credits per account for a period.
     */
    public function trialBalance(string $from, string $to, ?string $branchId = null): array
    {
        $query = VoucherEntry::query()
            ->selectRaw('account_id, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->whereHas('voucher', function ($q) use ($from, $to, $branchId) {
                $q->whereBetween('voucher_date', [$from, $to])->where('status', 'approved');
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->groupBy('account_id')
            ->with('account');

        return $query->get()->map(fn ($e) => [
            'account_id' => $e->account_id,
            'account_code' => $e->account->account_code,
            'account_name' => $e->account->account_name,
            'account_type' => $e->account->account_type,
            'debit' => round($e->total_debit, 2),
            'credit' => round($e->total_credit, 2),
            'balance' => round($e->total_debit - $e->total_credit, 2),
        ])->toArray();
    }
}
