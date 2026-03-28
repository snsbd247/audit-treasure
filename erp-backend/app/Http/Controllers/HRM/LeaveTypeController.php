<?php
namespace App\Http\Controllers\HRM;
use App\Http\Controllers\CrudController;
use App\Models\LeaveType;
class LeaveTypeController extends CrudController { protected string $modelClass = LeaveType::class; protected array $validationRules = ['name' => 'required|max:100', 'days_per_year' => 'integer|min:0']; }
