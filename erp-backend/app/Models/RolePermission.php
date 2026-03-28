<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['custom_role_id', 'module', 'can_view', 'can_add', 'can_edit', 'can_delete'];

    public function role() { return $this->belongsTo(CustomRole::class, 'custom_role_id'); }
}
