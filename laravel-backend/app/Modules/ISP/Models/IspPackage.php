<?php

namespace App\Modules\ISP\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IspPackage extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'isp_packages';

    protected $fillable = [
        'name',
        'speed',
        'price',
        'billing_cycle',
        'mikrotik_profile',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'billing_cycle' => 'integer',
    ];

    public function customers()
    {
        return $this->hasMany(IspCustomer::class, 'package_id');
    }
}
