<?php

namespace App\Modules\ISP\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class IspUsageLog extends Model
{
    use HasUuids;

    protected $table = 'isp_usage_logs';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'upload_bytes',
        'download_bytes',
        'recorded_at',
    ];

    protected $casts = [
        'upload_bytes'   => 'integer',
        'download_bytes' => 'integer',
        'recorded_at'    => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(IspCustomer::class, 'customer_id');
    }
}
