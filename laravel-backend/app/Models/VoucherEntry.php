<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VoucherEntry extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['voucher_id', 'account_id', 'debit', 'credit', 'narration', 'sort_order'];

    public function voucher() { return $this->belongsTo(AccVoucher::class, 'voucher_id'); }
    public function account() { return $this->belongsTo(ChartOfAccount::class, 'account_id'); }
}
