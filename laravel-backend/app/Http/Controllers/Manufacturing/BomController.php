<?php
namespace App\Http\Controllers\Manufacturing;
use App\Http\Controllers\CrudController;
use App\Models\BillOfMaterial;
class BomController extends CrudController { protected string $modelClass = BillOfMaterial::class; protected array $with = ['product', 'items.material']; protected array $validationRules = ['name' => 'required|max:200', 'product_id' => 'required|exists:item_master,id']; }
