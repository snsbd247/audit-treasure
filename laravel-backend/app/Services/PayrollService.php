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
    ) {}

    /**
     * Process payroll for given month/year.
     * Net Salary = Basic + Allowances + Overtime(1.5x) - Deductions - (Absent × DailySalary)
     */
    public function process(int $month, int $year, array $employeeIds = []): array
    {
        $query = Employee::where('status', 'active');
        if (!empty($employeeIds)) $query->whereIn('id', $employeeIds);
        $employees = $query->get();

        $results = [];

        DB::transaction(function () use ($employees, $month, $year, &$results) {
            foreach ($employees as $emp) {
                // Skip if already processed
                if (Payroll::where('employee_id', $emp->id)->where('month', $month)->where('year', $year)->exists()) continue;

                $salary = SalaryStructure::where('employee_id', $emp->id)
                    ->where('effective_from', '<=', "{$year}-{$month}-28")
                    ->orderByDesc('effective_from')->first();

                $basic = $salary ? $salary->basic_salary : $emp->salary;
                $allowances = $salary ? $salary->allowances : 0;
                $deductions = $salary ? $salary->deductions : 0;

                // Count absences
                $workDays = cal_days_in_month(CAL_GREGORIAN, $month, $year);
                $absentDays = Attendance::where('employee_id', $emp->id)
                    ->whereMonth('date', $month)->whereYear('date', $year)
                    ->where('status', 'absent')->count();

                $dailySalary = $basic / $workDays;

                // Overtime
                $otHours = (float) OvertimeRecord::where('employee_id', $emp->id)
                    ->whereMonth('date', $month)->whereYear('date', $year)
                    ->where('status', 'approved')->sum('hours');
                $hourlyRate = $basic / ($workDays * 8);
                $otPay = $otHours * $hourlyRate * 1.5;

                $netSalary = $basic + $allowances + $otPay - $deductions - ($absentDays * $dailySalary);

                $payroll = Payroll::create([
                    'employee_id' => $emp->id,
                    'month' => $month,
                    'year' => $year,
                    'basic_salary' => $basic,
                    'allowances' => $allowances + $otPay,
                    'deductions' => $deductions + ($absentDays * $dailySalary),
                    'net_salary' => max(0, round($netSalary, 2)),
                    'status' => 'draft',
                ]);

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
}
