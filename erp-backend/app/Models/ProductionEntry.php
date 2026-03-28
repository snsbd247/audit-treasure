<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductionEntry extends Model
{
    use HasUuids;
    protected $fillable = [
        'production_number', 'production_date', 'product_id', 'bom_id', 'branch_id',
        'quantity', 'raw_material_cost', 'labor_cost', 'electricity_cost', 'total_cost',
        'notes', 'status', 'created_by',
    ];
    protected $casts = ['production_date' => 'date'];
    public function product() { return $this->belongsTo(ItemMaster::class, 'product_id'); }
    public function bom() { return $this->belongsTo(BillOfMaterial::class, 'bom_id'); }
    public function materials() { return $this->hasMany(ProductionMaterial::class, 'production_id'); }
}
