<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\BaseController;
use App\Models\EmployeeFundSetting;
use App\Models\FundTransaction;
use App\Services\FundService;
use Illuminate\Http\Request;

class FundController extends BaseController
{
    public function __construct(private FundService $fundService) {}

    // ─── Settings ────────────────────────────────────────────────

    public function settingsIndex(Request $request)
    {
        $query = EmployeeFundSetting::with('employee');
        if ($request->fund_type) $query->where('fund_type', $request->fund_type);
        if ($request->employee_id) $query->where('employee_id', $request->employee_id);
        return $this->success($query->orderBy('created_at')->get());
    }

    public function settingsStore(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'fund_type' => 'required|in:provident_fund,savings_fund',
            'calculation_type' => 'required|in:percentage,fixed',
            'employee_rate' => 'required|numeric|min:0',
            'employer_rate' => 'required|numeric|min:0',
            'effective_from' => 'required|date',
        ]);

        $setting = EmployeeFundSetting::updateOrCreate(
            ['employee_id' => $request->employee_id, 'fund_type' => $request->fund_type],
            $request->only('calculation_type', 'employee_rate', 'employer_rate', 'effective_from', 'is_active')
        );

        return $this->created($setting, 'Fund setting saved');
    }

    public function settingsUpdate(Request $request, string $id)
    {
        $setting = EmployeeFundSetting::findOrFail($id);
        $setting->update($request->only('calculation_type', 'employee_rate', 'employer_rate', 'effective_from', 'is_active'));
        return $this->success($setting, 'Fund setting updated');
    }

    public function settingsDestroy(string $id)
    {
        EmployeeFundSetting::findOrFail($id)->delete();
        return $this->success(null, 'Fund setting deleted');
    }

    // ─── Transactions ────────────────────────────────────────────

    public function transactionsIndex(Request $request)
    {
        $query = FundTransaction::with('employee');
        if ($request->fund_type) $query->where('fund_type', $request->fund_type);
        if ($request->employee_id) $query->where('employee_id', $request->employee_id);
        if ($request->year) $query->where('year', $request->year);
        if ($request->month) $query->where('month', $request->month);
        return $this->success($query->orderByDesc('created_at')->limit(500)->get());
    }

    public function transactionsStore(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'fund_type' => 'required|in:provident_fund,savings_fund',
            'transaction_type' => 'required|in:contribution,withdrawal,interest,adjustment',
            'employee_amount' => 'required|numeric|min:0',
            'employer_amount' => 'required|numeric|min:0',
        ]);

        $total = $request->employee_amount + $request->employer_amount;

        $tx = FundTransaction::create([
            'employee_id' => $request->employee_id,
            'fund_type' => $request->fund_type,
            'transaction_type' => $request->transaction_type,
            'employee_amount' => $request->employee_amount,
            'employer_amount' => $request->employer_amount,
            'total_amount' => $total,
            'notes' => $request->notes,
            'created_by' => $request->user()->id,
        ]);

        return $this->created($tx, 'Transaction recorded');
    }

    // ─── Balance ─────────────────────────────────────────────────

    public function balance(string $employeeId)
    {
        return $this->success([
            'provident_fund' => $this->fundService->getBalance($employeeId, 'provident_fund'),
            'savings_fund' => $this->fundService->getBalance($employeeId, 'savings_fund'),
            'total' => $this->fundService->getBalance($employeeId),
        ]);
    }

    public function calculateContribution(string $employeeId)
    {
        return $this->success([
            'provident_fund' => $this->fundService->calculateContribution($employeeId, 'provident_fund'),
            'savings_fund' => $this->fundService->calculateContribution($employeeId, 'savings_fund'),
        ]);
    }
}
