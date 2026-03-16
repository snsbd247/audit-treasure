<?php
namespace App\Http\Controllers\Inventory;
use App\Http\Controllers\CrudController;
use App\Models\ItemCategory;
class ItemCategoryController extends CrudController { protected string $modelClass = ItemCategory::class; protected array $searchFields = ['name']; protected array $validationRules = ['name' => 'required|max:100']; }
