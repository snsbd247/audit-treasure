<?php
namespace App\Http\Controllers\Inventory;
use App\Http\Controllers\CrudController;
use App\Models\ItemMaster;

class ItemController extends CrudController
{
    protected string $modelClass = ItemMaster::class;
    protected array $searchFields = ['item_code', 'item_name'];
    protected array $with = ['category', 'unit'];
    protected array $validationRules = [
        'item_code' => 'required|unique:item_master,item_code',
        'item_name' => 'required|max:200',
        'item_type' => 'required|in:product,raw_material,finished_goods,service',
        'category_id' => 'nullable|exists:item_categories,id',
        'unit_id' => 'nullable|exists:units,id',
        'cost_price' => 'numeric|min:0',
        'selling_price' => 'numeric|min:0',
        'min_stock_level' => 'numeric|min:0',
    ];
}
