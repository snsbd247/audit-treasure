<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasUuids, SoftDeletes;

    protected $fillable = ['username', 'name', 'email', 'phone', 'password', 'branch_id', 'status'];
    protected $hidden = ['password', 'remember_token'];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function roles() { return $this->belongsToMany(CustomRole::class, 'user_roles', 'user_id', 'role_id'); }

    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    public function hasPermission(string $module, string $action): bool
    {
        return $this->roles()
            ->join('role_permissions', 'custom_roles.id', '=', 'role_permissions.custom_role_id')
            ->where('role_permissions.module', $module)
            ->where("role_permissions.can_{$action}", 1)
            ->exists();
    }
}
