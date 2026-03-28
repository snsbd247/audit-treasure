<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BomItem extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['bom_id', 'material_id', 'quantity', 'unit'];
    public function bom() { return $this->belongsTo(BillOfMaterial::class, 'bom_id'); }
    public function material() { return $this->belongsTo(ItemMaster::class, 'material_id'); }
}
