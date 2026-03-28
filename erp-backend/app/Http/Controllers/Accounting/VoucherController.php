<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\BaseController;
use App\Repositories\VoucherRepository;
use App\Services\AccountingService;
use Illuminate\Http\Request;

class VoucherController extends BaseController
{
    public function __construct(
        private VoucherRepository $repo,
        private AccountingService $service,
    ) {}

    public function index(Request $request)
    {
        return $this->paginated($this->repo->all($request->all()));
    }

    public function store(Request $request)
    {
        $request->validate([
            'voucher_type' => 'required|in:journal,payment,receipt,contra',
            'voucher_date' => 'required|date',
            'entries' => 'required|array|min:2',
            'entries.*.account_id' => 'required|exists:chart_of_accounts,id',
            'entries.*.debit' => 'numeric|min:0',
            'entries.*.credit' => 'numeric|min:0',
        ]);

        $voucher = $this->service->createVoucher(
            array_merge($request->only('voucher_type', 'voucher_date', 'description', 'branch_id', 'financial_year_id'), ['created_by' => $request->user()->id]),
            $request->entries
        );

        return $this->created($voucher);
    }

    public function show(string $id) { return $this->success($this->repo->findWithEntries($id)); }

    public function approve(Request $request, string $id)
    {
        return $this->success($this->service->approveVoucher($id, $request->user()->id));
    }

    public function reject(string $id)
    {
        return $this->success($this->service->rejectVoucher($id));
    }
}
