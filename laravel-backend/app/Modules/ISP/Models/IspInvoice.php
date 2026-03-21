<?php

namespace App\Modules\ISP\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class IspInvoice extends Model
{
    use HasUuids;

    protected $table = 'isp_invoices';

    protected $fillable = [
        'customer_id',
        'amount',
        'billing_date',
        'due_date',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'billing_date' => 'date',
        'due_date' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(IspCustomer::class, 'customer_id');
    }

    public function payments()
    {
        return $this->hasMany(IspPayment::class, 'invoice_id');
    }
}
