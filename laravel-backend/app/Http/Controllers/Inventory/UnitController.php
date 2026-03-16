<?php
namespace App\Http\Controllers\Inventory;
use App\Http\Controllers\CrudController;
use App\Models\Unit;
class UnitController extends CrudController { protected string $modelClass = Unit::class; protected array $validationRules = ['name' => 'required|unique:units', 'abbreviation' => 'required|max:10']; }
