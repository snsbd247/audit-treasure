<?php

namespace App\Modules\ISP\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IspReseller extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'isp_resellers';

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'commission_rate',
        'balance',
        'status',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'balance'         => 'decimal:2',
    ];

    public function customers()
    {
        return $this->hasMany(IspCustomer::class, 'reseller_id');
    }
}
