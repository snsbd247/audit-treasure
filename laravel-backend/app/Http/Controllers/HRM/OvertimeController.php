<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\BaseController;
use App\Models\OvertimeRecord;
use Illuminate\Http\Request;

class OvertimeController extends BaseController
{
    public function index(Request $request)
    {
        $query = OvertimeRecord::with('employee');
        if ($request->employee_id) $query->where('employee_id', $request->employee_id);
        if ($request->month && $request->year) {
            $query->whereMonth('date', $request->month)->whereYear('date', $request->year);
        }
        if ($request->status) $query->where('status', $request->status);
        return $this->paginated($query->orderByDesc('date')->paginate($request->per_page ?? 50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'hours' => 'required|numeric|min:0.5|max:24',
        ]);
        return $this->created(OvertimeRecord::create($data));
    }

    public function update(Request $request, string $id)
    {
        $record = OvertimeRecord::findOrFail($id);
        $record->update($request->only('hours', 'date'));
        return $this->success($record);
    }

    public function approve(Request $request, string $id)
    {
        $record = OvertimeRecord::findOrFail($id);
        $record->update(['status' => 'approved', 'approved_by' => $request->user()->id]);
        return $this->success($record);
    }

    public function destroy(string $id)
    {
        OvertimeRecord::findOrFail($id)->delete();
        return $this->success(null, 'Deleted');
    }
}
