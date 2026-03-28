<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserActivity extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $table = 'user_activities';

    protected $fillable = [
        'user_id', 'activity_type', 'description',
        'ip_address', 'user_agent', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
