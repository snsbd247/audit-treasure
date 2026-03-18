<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PartyNote extends Model
{
    use HasUuids;

    protected $table = 'party_notes';
    public $timestamps = false;

    protected $fillable = ['party_id', 'party_type', 'note', 'created_by'];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
