<?php

namespace App\Modules\ISP\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IspCustomer extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'isp_customers';

    protected $fillable = [
        'name',
        'phone',
        'address',
        'package_id',
        'router_id',
        'reseller_id',
        'pppoe_username',
        'pppoe_password',
        'ip_address',
        'mac_address',
        'status',
    ];

    protected $hidden = ['pppoe_password'];

    public function package()
    {
        return $this->belongsTo(IspPackage::class, 'package_id');
    }

    public function router()
    {
        return $this->belongsTo(IspRouter::class, 'router_id');
    }

    public function invoices()
    {
        return $this->hasMany(IspInvoice::class, 'customer_id');
    }

    public function reseller()
    {
        return $this->belongsTo(IspReseller::class, 'reseller_id');
    }

    public function usageLogs()
    {
        return $this->hasMany(IspUsageLog::class, 'customer_id');
    }
}
