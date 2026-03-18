<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PaymentAllocation extends Model
{
    use HasUuids;

    protected $table = 'payment_allocations';
    public $timestamps = false;

    protected $fillable = [
        'payment_id', 'invoice_id', 'invoice_type', 'allocated_amount',
    ];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
    ];

    public function payment()
    {
        return $this->belongsTo(PartyPayment::class, 'payment_id');
    }
}
