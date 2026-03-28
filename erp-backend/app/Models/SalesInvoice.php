<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalesInvoice extends Model
{
    use HasUuids;
    protected $fillable = ['invoice_number', 'invoice_date', 'customer_id', 'branch_id', 'total_amount', 'discount', 'net_amount', 'notes', 'status', 'created_by'];
    protected $casts = ['invoice_date' => 'date'];
    public function customer() { return $this->belongsTo(Customer::class); }
    public function items() { return $this->hasMany(SalesInvoiceItem::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
}
