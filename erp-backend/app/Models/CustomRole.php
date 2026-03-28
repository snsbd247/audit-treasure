<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CustomRole extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['name', 'description'];

    public function permissions() { return $this->hasMany(RolePermission::class); }
    public function users() { return $this->belongsToMany(User::class, 'user_custom_roles', 'custom_role_id', 'user_id'); }
}
