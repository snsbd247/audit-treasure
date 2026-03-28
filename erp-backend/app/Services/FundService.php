<?php

namespace App\Services;

use App\Models\EmployeeFundSetting;
use App\Models\FundTransaction;
use App\Models\SalaryStructure;
use Illuminate\Support\Facades\DB;

class FundService
{
    public function __construct(
        private AccountingService $accountingService,
    ) {}

    /**
     * Calculate fund contribution amounts for an employee.
     */
    public function calculateContribution(string $employeeId, string $fundType): array
    {
        $setting = EmployeeFundSetting::where('employee_id', $employeeId)
            ->where('fund_type', $fundType)
            ->where('is_active', true)
            ->first();

        if (!$setting) return ['employee' => 0, 'employer' => 0, 'total' => 0];

        if ($setting->calculation_type === 'fixed') {
            return [
                'employee' => round($setting->employee_rate, 2),
                'employer' => round($setting->employer_rate, 2),
                'total' => round($setting->employee_rate + $setting->employer_rate, 2),
            ];
        }

        // Percentage based on basic salary
        $salary = SalaryStructure::where('employee_id', $employeeId)
            ->where('effective_from', '<=', now()->toDateString())
            ->orderByDesc('effective_from')->first();

        $basic = $salary ? (float) $salary->basic_salary : 0;
        if (!$basic) {
            $emp = \App\Models\Employee::find($employeeId);
            $basic = $emp ? (float) $emp->salary : 0;
        }

        $empAmount = round($basic * $setting->employee_rate / 100, 2);
        $erAmount = round($basic * $setting->employer_rate / 100, 2);

        return [
            'employee' => $empAmount,
            'employer' => $erAmount,
            'total' => $empAmount + $erAmount,
        ];
    }

    /**
     * Process fund deductions during payroll for an employee.
     * Returns total employee deduction amount.
     */
    public function processPayrollDeduction(string $employeeId, int $month, int $year, string $payrollId, ?string $userId = null): float
    {
        $totalDeduction = 0;

        foreach (['provident_fund', 'savings_fund'] as $fundType) {
            $amounts = $this->calculateContribution($employeeId, $fundType);
            if ($amounts['total'] <= 0) continue;

            FundTransaction::create([
                'employee_id' => $employeeId,
                'fund_type' => $fundType,
                'transaction_type' => 'contribution',
                'employee_amount' => $amounts['employee'],
                'employer_amount' => $amounts['employer'],
                'total_amount' => $amounts['total'],
                'month' => $month,
                'year' => $year,
                'payroll_id' => $payrollId,
                'notes' => "Payroll auto-deduction {$month}/{$year}",
                'created_by' => $userId,
            ]);

            $totalDeduction += $amounts['employee'];

            // Post accounting entries
            $fundLabel = $fundType === 'provident_fund' ? 'Provident Fund' : 'Savings Fund';
            $emp = \App\Models\Employee::find($employeeId);
            $empName = $emp ? "{$emp->first_name} {$emp->last_name}" : 'Unknown';

            // Employee contribution: Dr Salary Expense / Cr PF Liability
            if ($amounts['employee'] > 0) {
                $this->accountingService->autoPost(
                    'Salary Expense', "{$fundLabel} Liability",
                    $amounts['employee'],
                    "{$fundLabel} Employee Contribution - {$empName} - {$month}/{$year}",
                    'journal',
                    ['date' => now()->toDateString(), 'branch_id' => $emp?->branch_id, 'user_id' => $userId]
                );
            }

            // Employer contribution: Dr PF Expense / Cr PF Liability
            if ($amounts['employer'] > 0) {
                $this->accountingService->autoPost(
                    "{$fundLabel} Expense", "{$fundLabel} Liability",
                    $amounts['employer'],
                    "{$fundLabel} Employer Contribution - {$empName} - {$month}/{$year}",
                    'journal',
                    ['date' => now()->toDateString(), 'branch_id' => $emp?->branch_id, 'user_id' => $userId]
                );
            }
        }

        return $totalDeduction;
    }

    /**
     * Get fund balance for employee.
     */
    public function getBalance(string $employeeId, ?string $fundType = null): float
    {
        $query = FundTransaction::where('employee_id', $employeeId);
        if ($fundType) $query->where('fund_type', $fundType);

        $contributions = (clone $query)->where('transaction_type', '!=', 'withdrawal')->sum('total_amount');
        $withdrawals = (clone $query)->where('transaction_type', 'withdrawal')->sum('total_amount');

        return round((float) $contributions - (float) $withdrawals, 2);
    }
}
