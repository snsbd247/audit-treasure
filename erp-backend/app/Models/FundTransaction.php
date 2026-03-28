<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FundTransaction extends Model
{
    use HasUuids;
    public $timestamps = false;

    protected $fillable = [
        'employee_id', 'fund_type', 'transaction_type',
        'employee_amount', 'employer_amount', 'total_amount',
        'month', 'year', 'payroll_id', 'voucher_id', 'notes', 'created_by',
    ];

    protected $casts = [
        'employee_amount' => 'float',
        'employer_amount' => 'float',
        'total_amount' => 'float',
    ];

    public function employee() { return $this->belongsTo(Employee::class); }
    public function payroll() { return $this->belongsTo(Payroll::class); }
    public function voucher() { return $this->belongsTo(AccVoucher::class, 'voucher_id'); }
}
