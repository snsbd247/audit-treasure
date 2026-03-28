<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BillOfMaterial extends Model
{
    use HasUuids;
    protected $table = 'bill_of_materials';
    protected $fillable = ['name', 'product_id', 'notes'];
    public function product() { return $this->belongsTo(ItemMaster::class, 'product_id'); }
    public function items() { return $this->hasMany(BomItem::class, 'bom_id'); }
}
