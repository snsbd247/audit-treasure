<?php

namespace App\Modules\ISP\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class IspRouter extends Model
{
    use HasUuids;

    protected $table = 'isp_routers';

    protected $fillable = [
        'name',
        'ip_address',
        'username',
        'password',
        'port',
        'is_active',
        'notes',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'port'      => 'integer',
        'is_active' => 'boolean',
    ];

    public function customers()
    {
        return $this->hasMany(IspCustomer::class, 'router_id');
    }
}
