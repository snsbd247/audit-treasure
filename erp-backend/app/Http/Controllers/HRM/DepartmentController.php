<?php
namespace App\Http\Controllers\HRM;
use App\Http\Controllers\CrudController;
use App\Models\Department;
class DepartmentController extends CrudController { protected string $modelClass = Department::class; protected array $searchFields = ['name']; protected array $validationRules = ['name' => 'required|max:100']; }
