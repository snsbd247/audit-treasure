<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalesReturnItem extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['sales_return_id', 'product_id', 'quantity', 'price', 'total'];
    public function salesReturn() { return $this->belongsTo(SalesReturn::class); }
    public function product() { return $this->belongsTo(ItemMaster::class, 'product_id'); }
}
