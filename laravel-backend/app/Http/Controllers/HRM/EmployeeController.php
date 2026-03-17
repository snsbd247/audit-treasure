<?php
namespace App\Http\Controllers\HRM;
use App\Http\Controllers\CrudController;
use App\Models\Employee;

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
}
