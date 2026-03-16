<?php
namespace App\Http\Controllers\HRM;
use App\Http\Controllers\CrudController;
use App\Models\LeaveRequest;
class LeaveRequestController extends CrudController { protected string $modelClass = LeaveRequest::class; protected array $with = ['employee', 'leaveType']; protected array $validationRules = ['employee_id' => 'required|exists:employees,id', 'leave_type_id' => 'required|exists:leave_types,id', 'start_date' => 'required|date', 'end_date' => 'required|date']; }
