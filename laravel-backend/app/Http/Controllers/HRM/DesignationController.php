<?php
namespace App\Http\Controllers\HRM;
use App\Http\Controllers\CrudController;
use App\Models\Designation;
class DesignationController extends CrudController { protected string $modelClass = Designation::class; protected array $searchFields = ['name']; protected array $validationRules = ['name' => 'required|max:100']; }
