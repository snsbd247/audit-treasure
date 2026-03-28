<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasUuids, SoftDeletes;

    protected $fillable = ['username', 'name', 'email', 'phone', 'password', 'branch_id', 'employee_id', 'status', 'is_online', 'last_seen_at', 'last_login_at'];
    protected $hidden = ['password', 'remember_token'];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function employee() { return $this->belongsTo(Employee::class); }
    public function roles() { return $this->belongsToMany(CustomRole::class, 'user_custom_roles', 'user_id', 'custom_role_id'); }

    /**
     * Super Admin = user with NO linked employee (employee_id IS NULL).
     * These users bypass ALL permission checks.
     */
    public function isSuperAdmin(): bool
    {
        return is_null($this->employee_id);
    }

    /**
     * Check if user has a specific permission string like "sales.view" or "users.create".
     * Super Admin (employee_id == null) bypasses all checks.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) return true;

        // Parse "module.action" format
        $parts = explode('.', $permission, 2);
        if (count($parts) !== 2) return false;

        [$module, $action] = $parts;

        // Map action names to column names
        $columnMap = [
            'view' => 'can_view',
            'create' => 'can_add',
            'add' => 'can_add',
            'edit' => 'can_edit',
            'delete' => 'can_delete',
            'generate' => 'can_add', // payroll.generate maps to can_add
            'approve' => 'can_edit', // approve maps to can_edit
        ];

        $column = $columnMap[$action] ?? null;
        if (!$column) return false;

        return $this->roles()
            ->join('role_permissions', 'custom_roles.id', '=', 'role_permissions.custom_role_id')
            ->where('role_permissions.module', $module)
            ->where("role_permissions.{$column}", 1)
            ->exists();
    }

    /**
     * Get all permissions as flat array of "module.action" strings.
     */
    public function getAllPermissions(): array
    {
        if ($this->isSuperAdmin()) {
            return ['*']; // Wildcard = full access
        }

        $rolePermissions = $this->roles()
            ->join('role_permissions', 'custom_roles.id', '=', 'role_permissions.custom_role_id')
            ->select('role_permissions.module', 'role_permissions.can_view', 'role_permissions.can_add', 'role_permissions.can_edit', 'role_permissions.can_delete')
            ->get();

        $permissions = [];
        $actionMap = ['can_view' => 'view', 'can_add' => 'create', 'can_edit' => 'edit', 'can_delete' => 'delete'];

        // Merge across roles (OR logic)
        $merged = [];
        foreach ($rolePermissions as $rp) {
            $mod = $rp->module;
            if (!isset($merged[$mod])) {
                $merged[$mod] = ['can_view' => false, 'can_add' => false, 'can_edit' => false, 'can_delete' => false];
            }
            foreach ($actionMap as $col => $action) {
                if ($rp->$col) $merged[$mod][$col] = true;
            }
        }

        foreach ($merged as $module => $flags) {
            foreach ($actionMap as $col => $action) {
                if ($flags[$col]) {
                    $permissions[] = "{$module}.{$action}";
                }
            }
        }

        return $permissions;
    }

    // Legacy compat
    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }
}
