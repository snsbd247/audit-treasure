<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\BaseController;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HrDashboardController extends BaseController
{
    public function index(Request $request)
    {
        $today = now()->toDateString();
        $currentMonth = now()->month;
        $currentYear = now()->year;

        // Employee counts
        $totalEmployees = Employee::where('status', 'active')->count();

        // Today's attendance
        $todayAttendance = Attendance::where('date', $today)->get();
        $presentToday = $todayAttendance->where('status', 'present')->count();
        $absentToday = $todayAttendance->where('status', 'absent')->count();
        $lateToday = $todayAttendance->where('status', 'late')->count();
        $onLeave = $todayAttendance->where('status', 'leave')->count();

        // Salary expense (current month)
        $totalSalaryExpense = Payroll::where('month', $currentMonth)
            ->where('year', $currentYear)
            ->sum('net_salary');

        // Pending payroll
        $pendingPayroll = Payroll::where('status', 'draft')
            ->where('month', $currentMonth)
            ->where('year', $currentYear)
            ->count();

        // Department-wise employees
        $departmentWise = Employee::where('status', 'active')
            ->select('department_id', DB::raw('count(*) as count'))
            ->groupBy('department_id')
            ->with('department:id,name')
            ->get()
            ->map(fn($e) => [
                'department' => $e->department?->name ?? 'Unassigned',
                'count' => $e->count,
            ]);

        // Monthly salary expense (last 6 months)
        $monthlySalary = Payroll::select(
                DB::raw('month'),
                DB::raw('year'),
                DB::raw('SUM(net_salary) as total')
            )
            ->where('status', 'approved')
            ->groupBy('month', 'year')
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->limit(6)
            ->get();

        // Pending leave requests
        $pendingLeaves = LeaveRequest::where('status', 'pending')->count();

        // Alerts
        $alerts = [];
        if ($pendingLeaves > 0) {
            $alerts[] = ['type' => 'warning', 'message' => "{$pendingLeaves} pending leave request(s)"];
        }
        if ($pendingPayroll > 0) {
            $alerts[] = ['type' => 'info', 'message' => "{$pendingPayroll} payroll record(s) awaiting approval"];
        }
        $absentRate = $totalEmployees > 0 ? round(($absentToday / $totalEmployees) * 100, 1) : 0;
        if ($absentRate > 20) {
            $alerts[] = ['type' => 'error', 'message' => "High absence rate today: {$absentRate}%"];
        }

        return $this->success([
            'metrics' => [
                'total_employees' => $totalEmployees,
                'present_today' => $presentToday,
                'absent_today' => $absentToday,
                'late_today' => $lateToday,
                'on_leave' => $onLeave,
                'total_salary_expense' => round($totalSalaryExpense, 2),
                'pending_payroll' => $pendingPayroll,
                'pending_leaves' => $pendingLeaves,
            ],
            'department_wise' => $departmentWise,
            'monthly_salary' => $monthlySalary,
            'alerts' => $alerts,
        ]);
    }
}
