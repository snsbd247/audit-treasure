<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['product_id', 'item_id', 'warehouse_id', 'branch_id', 'movement_type', 'reference_type', 'reference_id', 'quantity'];
    public function product() { return $this->belongsTo(ItemMaster::class, 'product_id'); }
}
