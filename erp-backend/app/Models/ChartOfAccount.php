<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    use HasUuids;
    protected $table = 'chart_of_accounts';
    protected $fillable = ['account_code', 'account_name', 'account_type', 'parent_id', 'opening_balance', 'opening_balance_type', 'is_active'];

    public function parent() { return $this->belongsTo(self::class, 'parent_id'); }
    public function children() { return $this->hasMany(self::class, 'parent_id'); }
    public function voucherEntries() { return $this->hasMany(VoucherEntry::class, 'account_id'); }
}
