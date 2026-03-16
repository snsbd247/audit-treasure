<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WarehouseStock extends Model
{
    use HasUuids;
    protected $table = 'warehouse_stock';
    protected $fillable = ['item_id', 'warehouse_id', 'quantity'];
    public function item() { return $this->belongsTo(ItemMaster::class, 'item_id'); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
}
