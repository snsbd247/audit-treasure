<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\BaseController;
use App\Models\User;
use App\Models\CustomRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends BaseController
{
    public function index(Request $request)
    {
        return $this->paginated(User::with('roles', 'branch')
            ->orderByDesc('created_at')->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|unique:users',
            'name' => 'required|max:100',
            'email' => 'nullable|email',
            'password' => 'required|min:6',
            'branch_id' => 'nullable|exists:branches,id',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:custom_roles,id',
        ]);
        $data['password'] = Hash::make($data['password']);
        $user = User::create(collect($data)->except('role_ids')->toArray());
        if (!empty($data['role_ids'])) $user->roles()->sync($data['role_ids']);
        return $this->created($user->load('roles'));
    }

    public function show(string $id) { return $this->success(User::with('roles.permissions', 'branch')->findOrFail($id)); }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $data = $request->only('name', 'email', 'phone', 'branch_id', 'status');
        if ($request->password) $data['password'] = Hash::make($request->password);
        $user->update($data);
        if ($request->has('role_ids')) $user->roles()->sync($request->role_ids);
        return $this->success($user->load('roles'));
    }

    public function destroy(string $id)
    {
        User::findOrFail($id)->delete();
        return $this->success(null, 'Deleted');
    }
}
