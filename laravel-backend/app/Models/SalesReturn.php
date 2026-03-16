<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalesReturn extends Model
{
    use HasUuids;
    protected $fillable = ['return_number', 'return_date', 'customer_id', 'sales_invoice_id', 'branch_id', 'total_amount', 'reason', 'status', 'created_by'];
    protected $casts = ['return_date' => 'date'];
    public function customer() { return $this->belongsTo(Customer::class); }
    public function items() { return $this->hasMany(SalesReturnItem::class); }
}
