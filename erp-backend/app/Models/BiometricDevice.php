<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BiometricDevice extends Model
{
    use HasUuids;
    protected $fillable = ['device_name', 'ip_address', 'port', 'location', 'status', 'last_sync_at'];
    protected $casts = ['last_sync_at' => 'datetime'];
}
