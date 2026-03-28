<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\BaseController;
use App\Models\CustomRole;
use App\Models\RolePermission;
use Illuminate\Http\Request;

class RoleController extends BaseController
{
    public function index() { return $this->success(CustomRole::with('permissions')->get()); }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|unique:custom_roles', 'description' => 'nullable', 'permissions' => 'array']);
        $role = CustomRole::create(['name' => $data['name'], 'description' => $data['description'] ?? null]);
        if (!empty($data['permissions'])) {
            foreach ($data['permissions'] as $p) {
                RolePermission::create(array_merge($p, ['custom_role_id' => $role->id]));
            }
        }
        return $this->created($role->load('permissions'));
    }

    public function show(string $id) { return $this->success(CustomRole::with('permissions')->findOrFail($id)); }

    public function update(Request $request, string $id)
    {
        $role = CustomRole::findOrFail($id);
        $role->update($request->only('name', 'description'));
        if ($request->has('permissions')) {
            $role->permissions()->delete();
            foreach ($request->permissions as $p) {
                RolePermission::create(array_merge($p, ['custom_role_id' => $role->id]));
            }
        }
        return $this->success($role->load('permissions'));
    }

    public function destroy(string $id) { CustomRole::findOrFail($id)->delete(); return $this->success(null, 'Deleted'); }
}
