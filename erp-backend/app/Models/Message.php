<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasUuids;

    protected $fillable = ['conversation_id', 'sender_id', 'message', 'is_read'];

    public function conversation() { return $this->belongsTo(Conversation::class); }
    public function sender() { return $this->belongsTo(User::class, 'sender_id'); }
}
