<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ItemMaster extends Model
{
    use HasUuids;
    protected $table = 'item_master';
    protected $fillable = [
        'item_code', 'item_name', 'item_type', 'description', 'category_id', 'unit_id',
        'cost_price', 'selling_price', 'opening_stock', 'min_stock_level', 'is_stock_item', 'status',
    ];

    public function category() { return $this->belongsTo(ItemCategory::class, 'category_id'); }
    public function unit() { return $this->belongsTo(Unit::class); }
    public function warehouseStock() { return $this->hasMany(WarehouseStock::class, 'item_id'); }
    public function stockLedger() { return $this->hasMany(StockLedger::class, 'item_id'); }
}
