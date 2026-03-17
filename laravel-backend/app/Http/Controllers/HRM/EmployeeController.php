<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\CrudController;
use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends CrudController
{
    protected string $modelClass = Employee::class;
    protected array $searchFields = ['employee_code', 'first_name', 'last_name', 'email'];
    // Only load essential relations for list view (avoid N+1 without over-fetching)
    protected array $with = ['department', 'designation', 'branch', 'shift'];
    protected array $validationRules = [
        'employee_code' => 'required|unique:employees,employee_code',
        'first_name' => 'required|max:100',
        'last_name' => 'required|max:100',
        'joining_date' => 'required|date',
        'department_id' => 'nullable|exists:departments,id',
        'designation_id' => 'nullable|exists:designations,id',
        'branch_id' => 'nullable|exists:branches,id',
        'shift_id' => 'nullable|exists:shifts,id',
        'salary' => 'numeric|min:0',
    ];

    /**
     * Override show to load all relations for single employee view.
     */
    public function show(string $id)
    {
        return $this->success(
            Employee::with([
                'department', 'designation', 'branch', 'shift',
                'salaryStructure', 'bankInfo', 'education',
                'experience', 'emergencyContacts',
            ])->findOrFail($id)
        );
    }

    /**
     * Override update to allow updating existing employee_code.
     */
    public function update(Request $request, string $id)
    {
        $employee = Employee::findOrFail($id);
        $data = $request->validate([
            'employee_code' => "sometimes|unique:employees,employee_code,{$id}",
            'first_name' => 'sometimes|max:100',
            'last_name' => 'sometimes|max:100',
            'joining_date' => 'sometimes|date',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'branch_id' => 'nullable|exists:branches,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'salary' => 'numeric|min:0',
            'email' => 'nullable|email',
            'mobile' => 'nullable|string',
            'address' => 'nullable|string',
            'national_id' => 'nullable|string',
            'employment_type' => 'nullable|in:permanent,contract,probation',
            'status' => 'nullable|in:active,inactive,terminated',
        ]);
        $employee->update($data);
        return $this->success($employee->fresh()->load('department', 'designation', 'branch', 'shift'));
    }

    /**
     * Upload employee profile photo.
     */
    public function uploadPhoto(Request $request, string $id)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $employee = Employee::findOrFail($id);

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($employee->photo_url) {
                $oldPath = str_replace('/storage/', '', $employee->photo_url);
                if (\Storage::disk('public')->exists($oldPath)) {
                    \Storage::disk('public')->delete($oldPath);
                }
            }

            $path = $request->file('photo')->store('employees', 'public');
            $employee->update(['photo_url' => '/storage/' . $path]);

            return $this->success([
                'message' => 'Photo uploaded',
                'photo_url' => '/storage/' . $path,
            ]);
        }

        return $this->error('No photo provided', 400);
    }
}
