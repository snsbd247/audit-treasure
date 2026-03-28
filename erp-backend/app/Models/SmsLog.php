<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SmsLog extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['phone', 'message', 'status', 'response', 'event_type', 'reference_id', 'sent_by'];
    protected $casts = ['created_at' => 'datetime'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->created_at = $model->created_at ?? now();
        });
    }
}
