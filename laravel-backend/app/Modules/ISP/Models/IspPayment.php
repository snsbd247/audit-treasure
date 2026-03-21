<?php

namespace App\Modules\ISP\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class IspPayment extends Model
{
    use HasUuids;

    protected $table = 'isp_payments';

    protected $fillable = [
        'invoice_id',
        'amount',
        'method',
        'transaction_id',
        'gateway',
        'gateway_status',
        'gateway_response',
        'paid_at',
    ];

    protected $casts = [
        'amount'           => 'decimal:2',
        'paid_at'          => 'datetime',
        'gateway_response' => 'array',
    ];

    public function invoice()
    {
        return $this->belongsTo(IspInvoice::class, 'invoice_id');
    }
}
