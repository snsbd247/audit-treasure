<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductionMaterial extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['production_id', 'material_id', 'quantity', 'cost'];
    public function production() { return $this->belongsTo(ProductionEntry::class, 'production_id'); }
    public function material() { return $this->belongsTo(ItemMaster::class, 'material_id'); }
}
