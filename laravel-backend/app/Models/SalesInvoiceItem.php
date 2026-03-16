<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalesInvoiceItem extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['sales_invoice_id', 'product_id', 'quantity', 'price', 'discount', 'total'];
    public function invoice() { return $this->belongsTo(SalesInvoice::class, 'sales_invoice_id'); }
    public function product() { return $this->belongsTo(ItemMaster::class, 'product_id'); }
}
