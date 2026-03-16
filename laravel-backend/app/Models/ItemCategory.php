<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ItemCategory extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['name', 'description', 'parent_id', 'is_active'];
    public function parent() { return $this->belongsTo(self::class, 'parent_id'); }
    public function children() { return $this->hasMany(self::class, 'parent_id'); }
    public function items() { return $this->hasMany(ItemMaster::class, 'category_id'); }
}
