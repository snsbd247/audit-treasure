<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasUuids;
    protected $fillable = ['purchase_number', 'purchase_date', 'supplier_id', 'branch_id', 'total_amount', 'payment_method', 'notes', 'status', 'created_by'];
    protected $casts = ['purchase_date' => 'date'];
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function items() { return $this->hasMany(PurchaseItem::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
}
