<?php
namespace App\Http\Controllers\HRM;
use App\Http\Controllers\CrudController;
use App\Models\Shift;
class ShiftController extends CrudController { protected string $modelClass = Shift::class; protected array $validationRules = ['shift_name' => 'required|max:100', 'start_time' => 'required', 'end_time' => 'required']; }
