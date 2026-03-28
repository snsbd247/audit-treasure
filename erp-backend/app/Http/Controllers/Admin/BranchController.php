<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\CrudController;
use App\Models\Branch;
class BranchController extends CrudController { protected string $modelClass = Branch::class; protected array $searchFields = ['name', 'code']; protected array $validationRules = ['code' => 'required|unique:branches', 'name' => 'required|max:100']; }
