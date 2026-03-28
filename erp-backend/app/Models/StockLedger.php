<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StockLedger extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $table = 'stock_ledger';
    protected $fillable = [
        'transaction_type', 'transaction_id', 'item_id', 'branch_id', 'warehouse_id',
        'quantity_in', 'quantity_out', 'balance_quantity', 'unit_cost', 'total_value',
        'reference_number', 'transaction_date',
    ];
    protected $casts = ['transaction_date' => 'date'];
    public function item() { return $this->belongsTo(ItemMaster::class, 'item_id'); }
}
