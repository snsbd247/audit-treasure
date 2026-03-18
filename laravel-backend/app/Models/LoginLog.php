<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'ip_address', 'user_agent', 'login_time', 'logout_time'];

    protected $casts = [
        'login_time' => 'datetime',
        'logout_time' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
