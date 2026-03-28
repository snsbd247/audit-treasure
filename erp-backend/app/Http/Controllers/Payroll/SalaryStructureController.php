<?php
namespace App\Http\Controllers\Payroll;
use App\Http\Controllers\CrudController;
use App\Models\SalaryStructure;
class SalaryStructureController extends CrudController
{
    protected string $modelClass = SalaryStructure::class;
    protected array $with = ['employee'];
    protected array $validationRules = [
        'employee_id' => 'required|exists:employees,id',
        'basic_salary' => 'required|numeric|min:0',
        'house_rent' => 'numeric|min:0',
        'medical_allowance' => 'numeric|min:0',
        'other_allowance' => 'numeric|min:0',
        'effective_from' => 'required|date',
    ];
}
