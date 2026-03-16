<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PurchaseReturnItem extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['purchase_return_id', 'product_id', 'quantity', 'unit_price', 'total'];
    public function purchaseReturn() { return $this->belongsTo(PurchaseReturn::class); }
    public function product() { return $this->belongsTo(ItemMaster::class, 'product_id'); }
}
