<?php
namespace App\Http\Controllers\HRM;
use App\Http\Controllers\BaseController;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends BaseController
{
    public function index(Request $request)
    {
        $query = Attendance::with('employee');
        if ($request->employee_id) $query->where('employee_id', $request->employee_id);
        if ($request->date) $query->where('date', $request->date);
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
        return $this->created(Attendance::create($data));
    }

    public function update(Request $request, string $id)
    {
        $att = Attendance::findOrFail($id);
        $att->update($request->only('status', 'check_in', 'check_out', 'notes'));
        return $this->success($att);
    }
}
