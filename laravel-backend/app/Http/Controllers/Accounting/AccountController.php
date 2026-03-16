<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\BaseController;
use App\Repositories\AccountRepository;
use App\Services\AccountingService;
use Illuminate\Http\Request;

class AccountController extends BaseController
{
    public function __construct(private AccountRepository $repo) {}

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
        return $this->created($this->repo->create($data));
    }

    public function show(string $id) { return $this->success($this->repo->find($id)); }

    public function update(Request $request, string $id)
    {
        $data = $request->validate([
            'account_name' => 'max:150',
            'account_type' => 'in:asset,liability,income,expense,equity',
            'parent_id' => 'nullable|exists:chart_of_accounts,id',
            'is_active' => 'boolean',
        ]);
        return $this->success($this->repo->update($id, $data));
    }

    public function destroy(string $id) { $this->repo->delete($id); return $this->success(null, 'Deleted'); }

    public function tree() { return $this->success($this->repo->getTree()); }

    public function ledger(Request $request, string $id)
    {
        $request->validate(['from' => 'required|date', 'to' => 'required|date']);
        return $this->success($this->repo->getLedger($id, $request->from, $request->to));
    }
}
