<?php
namespace App\Http\Controllers\Inventory;
use App\Http\Controllers\CrudController;
use App\Models\Warehouse;

class WarehouseController extends CrudController
{
    protected string $modelClass = Warehouse::class;
    protected array $searchFields = ['name', 'code'];
    protected array $with = ['branch'];
    protected array $validationRules = [
        'name' => 'required|max:100',
        'code' => 'required|unique:warehouses,code',
        'address' => 'nullable',
        'branch_id' => 'nullable|exists:branches,id',
    ];
}
