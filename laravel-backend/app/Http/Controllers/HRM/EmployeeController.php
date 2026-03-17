<?php
namespace App\Http\Controllers\HRM;
use App\Http\Controllers\CrudController;
use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends CrudController
{
    protected string $modelClass = Employee::class;
    protected array $searchFields = ['employee_code', 'first_name', 'last_name', 'email'];
    protected array $with = ['department', 'designation', 'branch', 'shift', 'salaryStructure', 'bankInfo', 'education', 'experience', 'emergencyContacts'];
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
            if ($employee->photo_url && \Storage::disk('public')->exists($employee->photo_url)) {
                \Storage::disk('public')->delete($employee->photo_url);
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
