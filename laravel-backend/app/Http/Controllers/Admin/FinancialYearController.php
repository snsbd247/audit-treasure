<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\CrudController;
use App\Models\FinancialYear;
class FinancialYearController extends CrudController { protected string $modelClass = FinancialYear::class; protected array $validationRules = ['name' => 'required', 'start_date' => 'required|date', 'end_date' => 'required|date']; }
