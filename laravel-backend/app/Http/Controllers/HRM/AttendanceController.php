<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\BaseController;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends BaseController
{
    public function index(Request $request)
    {
        $query = Attendance::with('employee');
        if ($request->employee_id) $query->where('employee_id', $request->employee_id);
        if ($request->date) $query->where('date', $request->date);
        if ($request->status) $query->where('status', $request->status);
        if ($request->branch_id) {
            $query->whereHas('employee', fn($q) => $q->where('branch_id', $request->branch_id));
        }
        if ($request->month && $request->year) {
            $query->whereMonth('date', $request->month)->whereYear('date', $request->year);
        }
        return $this->paginated($query->orderByDesc('date')->paginate($request->per_page ?? 50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late,half_day,leave',
            'check_in' => 'nullable',
            'check_out' => 'nullable',
            'notes' => 'nullable',
        ]);
        return $this->created(Attendance::updateOrCreate(
            ['employee_id' => $data['employee_id'], 'date' => $data['date']],
            $data
        ));
    }

    /**
     * Bulk attendance entry for a date.
     */
    public function bulkStore(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'records' => 'required|array|min:1',
            'records.*.employee_id' => 'required|exists:employees,id',
            'records.*.status' => 'required|in:present,absent,late,half_day,leave',
        ]);

        $results = [];
        DB::transaction(function () use ($request, &$results) {
            foreach ($request->records as $record) {
                $results[] = Attendance::updateOrCreate(
                    ['employee_id' => $record['employee_id'], 'date' => $request->date],
                    [
                        'status' => $record['status'],
                        'check_in' => $record['check_in'] ?? null,
                        'check_out' => $record['check_out'] ?? null,
                        'notes' => $record['notes'] ?? null,
                    ]
                );
            }
        });

        return $this->created($results, count($results) . ' attendance records saved');
    }

    public function update(Request $request, string $id)
    {
        $att = Attendance::findOrFail($id);
        $att->update($request->only('status', 'check_in', 'check_out', 'notes'));
        return $this->success($att);
    }
}
