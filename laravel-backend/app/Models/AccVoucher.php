<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AccVoucher extends Model
{
    use HasUuids;
    protected $fillable = [
        'voucher_number', 'voucher_type', 'voucher_date', 'description',
        'total_amount', 'status', 'branch_id', 'financial_year_id',
        'created_by', 'approved_by', 'approved_at',
    ];
    protected $casts = ['voucher_date' => 'date', 'approved_at' => 'datetime'];

    public function entries() { return $this->hasMany(VoucherEntry::class, 'voucher_id'); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function financialYear() { return $this->belongsTo(FinancialYear::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
}
