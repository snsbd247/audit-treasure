<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\BaseController;
use App\Models\ChartOfAccount;
use App\Models\AccVoucher;
use App\Models\VoucherEntry;
use App\Repositories\AccountRepository;
use App\Services\AccountingService;
use App\Services\NumberSequenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountController extends BaseController
{
    public function __construct(
        private AccountRepository $repo,
        private NumberSequenceService $numService,
    ) {}

    public function index(Request $request)
    {
        return $this->paginated($this->repo->all($request->all()));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'account_code' => 'required|unique:chart_of_accounts',
            'account_name' => 'required|max:150',
            'account_type' => 'required|in:asset,liability,income,expense,equity',
            'parent_id' => 'nullable|exists:chart_of_accounts,id',
            'opening_balance' => 'numeric',
            'opening_balance_type' => 'in:debit,credit',
        ]);

        // Only Super Admin can set opening balance
        $user = $request->user();
        if (!$user->isSuperAdmin()) {
            $data['opening_balance'] = 0;
            $data['opening_balance_type'] = 'debit';
        }

        return DB::transaction(function () use ($data, $request) {
            $account = $this->repo->create($data);

            // Auto-create opening balance journal entry
            $openingBal = floatval($data['opening_balance'] ?? 0);
            if ($openingBal > 0) {
                $this->createOpeningBalanceEntry($account, $openingBal, $data['opening_balance_type'] ?? 'debit', $request->user());
            }

            return $this->created($account);
        });
    }

    public function show(string $id) { return $this->success($this->repo->find($id)); }

    public function update(Request $request, string $id)
    {
        $data = $request->validate([
            'account_name' => 'max:150',
            'account_type' => 'in:asset,liability,income,expense,equity',
            'parent_id' => 'nullable|exists:chart_of_accounts,id',
            'is_active' => 'boolean',
            'opening_balance' => 'numeric',
            'opening_balance_type' => 'in:debit,credit',
        ]);

        $user = $request->user();
        $account = ChartOfAccount::findOrFail($id);

        // Only Super Admin can modify opening balance
        if (!$user->isSuperAdmin()) {
            unset($data['opening_balance'], $data['opening_balance_type']);
        }

        return DB::transaction(function () use ($data, $account, $request) {
            $oldBalance = floatval($account->opening_balance);
            $oldType = $account->opening_balance_type;

            $account->update($data);
            $account->refresh();

            // If opening balance changed, update/create the journal entry
            $newBalance = floatval($account->opening_balance);
            $newType = $account->opening_balance_type;

            if ($newBalance !== $oldBalance || $newType !== $oldType) {
                $this->updateOpeningBalanceEntry($account, $newBalance, $newType, $request->user());
            }

            return $this->success($account);
        });
    }

    public function destroy(string $id) { $this->repo->delete($id); return $this->success(null, 'Deleted'); }

    public function tree() { return $this->success($this->repo->getTree()); }

    public function ledger(Request $request, string $id)
    {
        $request->validate(['from' => 'required|date', 'to' => 'required|date']);
        return $this->success($this->repo->getLedger($id, $request->from, $request->to));
    }

    /**
     * Create opening balance journal entry for a new account.
     */
    private function createOpeningBalanceEntry(ChartOfAccount $account, float $amount, string $type, $user): void
    {
        if ($amount <= 0) return;

        // Find Opening Balance Equity account (or create one)
        $obEquity = ChartOfAccount::where('account_name', 'like', '%Opening Balance%')
            ->where('account_type', 'equity')
            ->first();

        if (!$obEquity) {
            $obEquity = ChartOfAccount::create([
                'account_code' => '3900',
                'account_name' => 'Opening Balance Equity',
                'account_type' => 'equity',
                'opening_balance' => 0,
            ]);
        }

        $voucherNumber = $this->numService->next('journal_voucher');

        $voucher = AccVoucher::create([
            'voucher_number' => $voucherNumber,
            'voucher_type' => 'journal',
            'voucher_date' => now()->toDateString(),
            'description' => "Opening Balance - {$account->account_name}",
            'total_amount' => $amount,
            'status' => 'approved',
            'created_by' => $user->id,
            'approved_by' => $user->id,
            'approved_at' => now(),
            'branch_id' => $user->branch_id,
        ]);

        // Debit/Credit the account based on type
        if ($type === 'debit') {
            VoucherEntry::create([
                'voucher_id' => $voucher->id,
                'account_id' => $account->id,
                'debit' => $amount,
                'credit' => 0,
                'narration' => 'Opening Balance',
                'sort_order' => 1,
            ]);
            VoucherEntry::create([
                'voucher_id' => $voucher->id,
                'account_id' => $obEquity->id,
                'debit' => 0,
                'credit' => $amount,
                'narration' => 'Opening Balance',
                'sort_order' => 2,
            ]);
        } else {
            VoucherEntry::create([
                'voucher_id' => $voucher->id,
                'account_id' => $account->id,
                'debit' => 0,
                'credit' => $amount,
                'narration' => 'Opening Balance',
                'sort_order' => 1,
            ]);
            VoucherEntry::create([
                'voucher_id' => $voucher->id,
                'account_id' => $obEquity->id,
                'debit' => $amount,
                'credit' => 0,
                'narration' => 'Opening Balance',
                'sort_order' => 2,
            ]);
        }
    }

    /**
     * Update or recreate opening balance entry when balance changes.
     */
    private function updateOpeningBalanceEntry(ChartOfAccount $account, float $newAmount, string $newType, $user): void
    {
        // Delete old opening balance voucher for this account
        $oldVoucherIds = AccVoucher::where('description', "Opening Balance - {$account->account_name}")
            ->pluck('id');

        if ($oldVoucherIds->count() > 0) {
            VoucherEntry::whereIn('voucher_id', $oldVoucherIds)->delete();
            AccVoucher::whereIn('id', $oldVoucherIds)->delete();
        }

        // Recreate if amount > 0
        if ($newAmount > 0) {
            $this->createOpeningBalanceEntry($account, $newAmount, $newType, $user);
        }
    }
}
