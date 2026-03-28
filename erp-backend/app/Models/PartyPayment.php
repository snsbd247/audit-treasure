<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PartyPayment extends Model
{
    use HasUuids;

    protected $table = 'party_payments';

    protected $fillable = [
        'party_id', 'party_type', 'amount', 'payment_date',
        'payment_method', 'reference', 'notes', 'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function allocations()
    {
        return $this->hasMany(PaymentAllocation::class, 'payment_id');
    }

    public function getAllocatedAmountAttribute(): float
    {
        return (float) $this->allocations()->sum('allocated_amount');
    }

    public function getUnallocatedAmountAttribute(): float
    {
        return (float) $this->amount - $this->allocated_amount;
    }
}
