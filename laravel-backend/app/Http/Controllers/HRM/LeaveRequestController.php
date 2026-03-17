<?php
namespace App\Http\Controllers\HRM;

use App\Http\Controllers\CrudController;
use App\Models\LeaveRequest;
use App\Services\SmsService;
use Illuminate\Http\Request;

class LeaveRequestController extends CrudController
{
    protected string $modelClass = LeaveRequest::class;
    protected array $with = ['employee', 'leaveType'];
    protected array $validationRules = [
        'employee_id' => 'required|exists:employees,id',
        'leave_type_id' => 'required|exists:leave_types,id',
        'start_date' => 'required|date',
        'end_date' => 'required|date',
    ];

    public function approve(Request $request, string $id)
    {
        $leave = LeaveRequest::with('employee')->findOrFail($id);
        $leave->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
        ]);

        // Send SMS notification
        if ($leave->employee && $leave->employee->mobile) {
            try {
                app(SmsService::class)->sendLeaveApprovalSms($leave->employee->mobile);
            } catch (\Exception $e) {
                \Log::error('Leave approval SMS failed: ' . $e->getMessage());
            }
        }

        return $this->success($leave->load($this->with));
    }

    public function reject(Request $request, string $id)
    {
        $leave = LeaveRequest::findOrFail($id);
        $leave->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
        ]);
        return $this->success($leave->load($this->with));
    }
}
