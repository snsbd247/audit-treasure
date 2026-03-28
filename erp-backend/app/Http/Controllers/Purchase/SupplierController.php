<?php
namespace App\Http\Controllers\Purchase;
use App\Http\Controllers\CrudController;
use App\Models\Supplier;
class SupplierController extends CrudController { protected string $modelClass = Supplier::class; protected array $searchFields = ['name', 'email', 'phone']; protected array $validationRules = ['name' => 'required|max:200']; }
