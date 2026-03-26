<?php

namespace App\Services;

use App\Models\Payroll;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\SalaryStructure;
use App\Models\OvertimeRecord;
use Illuminate\Support\Facades\DB;

class PayrollService
{
    public function __construct(
        private AccountingService $accountingService,
        private FundService $fundService,
    ) {}

    /**
     * Process payroll for given month/year.
     * Net Salary = Basic + Allowances + OvertimePay - AbsentDeduction - LateDeduction
     */
    public function process(int $month, int $year, array $employeeIds = [], ?string $branchId = null): array
    {
        $query = Employee::where('status', 'active');
        if (!empty($employeeIds)) $query->whereIn('id', $employeeIds);
        if ($branchId) $query->where('branch_id', $branchId);
        $employees = $query->get();

        $results = [];

        DB::transaction(function () use ($employees, $month, $year, &$results) {
            foreach ($employees as $emp) {
                // Skip if already processed
                if (Payroll::where('employee_id', $emp->id)->where('month', $month)->where('year', $year)->exists()) continue;

                $salary = SalaryStructure::where('employee_id', $emp->id)
                    ->where('effective_from', '<=', sprintf('%04d-%02d-28', $year, $month))
                    ->orderByDesc('effective_from')->first();

                $basic = $salary ? (float) $salary->basic_salary : (float) $emp->salary;
                $allowances = $salary
                    ? (float) $salary->house_rent + (float) $salary->medical_allowance + (float) $salary->other_allowance
                    : 0;
                $totalSalary = $salary ? (float) $salary->total_salary : ($basic + $allowances);

                // Working days in month
                $workDays = cal_days_in_month(CAL_GREGORIAN, $month, $year);
                $dailySalary = $totalSalary / $workDays;

                // Count absences & lates
                $absentDays = Attendance::where('employee_id', $emp->id)
                    ->whereMonth('date', $month)->whereYear('date', $year)
                    ->where('status', 'absent')->count();

                $lateDays = Attendance::where('employee_id', $emp->id)
                    ->whereMonth('date', $month)->whereYear('date', $year)
                    ->where('status', 'late')->count();

                $leaveDays = Attendance::where('employee_id', $emp->id)
                    ->whereMonth('date', $month)->whereYear('date', $year)
                    ->where('status', 'leave')->count();

                // Overtime
                $otHours = (float) OvertimeRecord::where('employee_id', $emp->id)
                    ->whereMonth('date', $month)->whereYear('date', $year)
                    ->where('status', 'approved')->sum('hours');
                $hourlyRate = $basic / ($workDays * 8);
                $otPay = round($otHours * $hourlyRate * 1.5, 2);

                // Deductions
                $absentDeduction = round($absentDays * $dailySalary, 2);
                $lateDeduction = round($lateDays * 50, 2); // ৳50 per late
                $totalDeductions = $absentDeduction + $lateDeduction;

                // Fund deductions (PF & Savings Fund)
                $pfContribution = $this->fundService->calculateContribution($emp->id, 'provident_fund');
                $sfContribution = $this->fundService->calculateContribution($emp->id, 'savings_fund');
                $fundEmployeeDeduction = $pfContribution['employee'] + $sfContribution['employee'];
                $totalDeductions += $fundEmployeeDeduction;

                $netSalary = $totalSalary + $otPay - $totalDeductions;

                $payroll = Payroll::create([
                    'employee_id' => $emp->id,
                    'month' => $month,
                    'year' => $year,
                    'basic_salary' => $basic,
                    'allowances' => $allowances + $otPay,
                    'deductions' => $totalDeductions,
                    'net_salary' => max(0, round($netSalary, 2)),
                    'status' => 'draft',
                ]);

                // Record fund transactions linked to payroll
                $this->fundService->processPayrollDeduction($emp->id, $month, $year, $payroll->id);

                $results[] = $payroll;
            }
        });

        return $results;
    }

    public function approve(string $payrollId, string $userId): Payroll
    {
        $payroll = Payroll::with('employee')->findOrFail($payrollId);
        if ($payroll->status === 'approved') throw new \RuntimeException('Already approved');

        $payroll->update(['status' => 'approved']);

        // Post accounting entry
        $emp = $payroll->employee;
        $this->accountingService->autoPost('Salary Expense', 'Cash', $payroll->net_salary,
            "Salary {$emp->first_name} {$emp->last_name} - {$payroll->month}/{$payroll->year}", 'payment', [
                'date' => now()->toDateString(),
                'branch_id' => $emp->branch_id,
                'user_id' => $userId,
            ]);

        return $payroll;
    }

    /**
     * Approve all draft payroll for a month/year.
     */
    public function approveAll(int $month, int $year, string $userId): int
    {
        $drafts = Payroll::where('month', $month)->where('year', $year)->where('status', 'draft')->get();

        foreach ($drafts as $payroll) {
            $this->approve($payroll->id, $userId);
        }

        return $drafts->count();
    }
}
