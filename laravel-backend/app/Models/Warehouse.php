<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasUuids;
    protected $fillable = ['name', 'code', 'address', 'branch_id', 'is_active'];
    public function branch() { return $this->belongsTo(Branch::class); }
    public function stock() { return $this->hasMany(WarehouseStock::class); }
}
