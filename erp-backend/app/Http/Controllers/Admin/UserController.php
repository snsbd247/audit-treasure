<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BaseController;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends BaseController
{
    public function __construct(private AuditService $auditService) {}

    public function index(Request $request)
    {
        $query = User::with('roles', 'branch')
            ->whereNull('deleted_at')
            ->where('status', '!=', 'deleted');

        // Hide Super Admin users (employee_id IS NULL) from non-Super Admin viewers
        $currentUser = $request->user();
        if ($currentUser && $currentUser->employee_id !== null) {
            $query->whereNotNull('employee_id');
        }

        return $this->paginated(
            $query->orderByDesc('created_at')
                ->paginate($request->per_page ?? 25)
        );
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

        $this->auditService->logCreate('users', $user->id, $user->toArray(), $request);

        return $this->created($user->load('roles'));
    }

    public function show(string $id)
    {
        return $this->success(User::with('roles.permissions', 'branch')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $oldData = $user->toArray();

        $data = $request->only('name', 'email', 'phone', 'branch_id', 'status');
        if ($request->password) $data['password'] = Hash::make($request->password);
        $user->update($data);
        if ($request->has('role_ids')) $user->roles()->sync($request->role_ids);

        $this->auditService->logUpdate('users', $user->id, $oldData, $user->fresh()->toArray(), $request);

        return $this->success($user->load('roles'));
    }

    /**
     * Check if user has related data before deletion.
     */
    public function checkRelated(string $id)
    {
        $tables = [
            ['table' => 'sales_invoices', 'column' => 'created_by'],
            ['table' => 'purchases', 'column' => 'created_by'],
            ['table' => 'acc_vouchers', 'column' => 'created_by'],
            ['table' => 'acc_vouchers', 'column' => 'approved_by'],
            ['table' => 'production_entries', 'column' => 'created_by'],
            ['table' => 'purchase_returns', 'column' => 'created_by'],
            ['table' => 'sales_returns', 'column' => 'created_by'],
            ['table' => 'employee_documents', 'column' => 'generated_by'],
        ];

        $related = [];
        foreach ($tables as $t) {
            $count = DB::table($t['table'])->where($t['column'], $id)->count();
            if ($count > 0) {
                $related[] = ['table' => $t['table'], 'column' => $t['column'], 'count' => $count];
            }
        }

        // Check employees
        $empCount = DB::table('employees')->where('user_id', $id)->count();
        if ($empCount > 0) {
            $related[] = ['table' => 'employees', 'column' => 'user_id', 'count' => $empCount];
        }

        return $this->success([
            'has_related_data' => count($related) > 0,
            'related_tables' => $related,
        ]);
    }

    /**
     * Transfer data from one user to another then soft-delete.
     */
    public function transferAndDelete(Request $request, string $id)
    {
        $request->validate(['transfer_to_user_id' => 'required|exists:users,id']);
        $transferTo = $request->transfer_to_user_id;

        if ($id === $transferTo) {
            return $this->error('Cannot transfer data to the same user', 400);
        }
        if ($id === $request->user()->id) {
            return $this->error('Cannot delete your own account', 400);
        }

        $transferableTables = [
            ['table' => 'sales_invoices', 'column' => 'created_by'],
            ['table' => 'purchases', 'column' => 'created_by'],
            ['table' => 'acc_vouchers', 'column' => 'created_by'],
            ['table' => 'acc_vouchers', 'column' => 'approved_by'],
            ['table' => 'production_entries', 'column' => 'created_by'],
            ['table' => 'purchase_returns', 'column' => 'created_by'],
            ['table' => 'sales_returns', 'column' => 'created_by'],
            ['table' => 'employee_documents', 'column' => 'generated_by'],
        ];

        $transfers = [];
        DB::transaction(function () use ($id, $transferTo, $transferableTables, &$transfers) {
            foreach ($transferableTables as $t) {
                $updated = DB::table($t['table'])
                    ->where($t['column'], $id)
                    ->update([$t['column'] => $transferTo]);
                $transfers[] = ['table' => $t['table'], 'column' => $t['column'], 'updated' => $updated];
            }

            // Unlink employees
            DB::table('employees')->where('user_id', $id)->update(['user_id' => null]);

            // Soft delete user
            $user = User::findOrFail($id);
            $user->update(['status' => 'deleted', 'deleted_at' => now()]);

            // Remove roles
            DB::table('user_custom_roles')->where('user_id', $id)->delete();
        });

        $this->auditService->log('users', 'Data Transfer & Delete', $id,
            json_encode(['transfer_to' => $transferTo, 'transfers' => $transfers]),
            $request
        );

        return $this->success(['transfers' => $transfers], 'Data transferred and user deleted');
    }

    /**
     * Soft delete user (only if no related data).
     */
    public function destroy(Request $request, string $id)
    {
        if ($id === $request->user()->id) {
            return $this->error('Cannot delete your own account', 400);
        }

        // Check for related data
        $tables = [
            ['table' => 'sales_invoices', 'column' => 'created_by'],
            ['table' => 'purchases', 'column' => 'created_by'],
            ['table' => 'acc_vouchers', 'column' => 'created_by'],
            ['table' => 'production_entries', 'column' => 'created_by'],
            ['table' => 'employees', 'column' => 'user_id'],
        ];

        foreach ($tables as $t) {
            if (DB::table($t['table'])->where($t['column'], $id)->exists()) {
                return $this->error('User has existing data. Please transfer data before deletion.', 400);
            }
        }

        $user = User::findOrFail($id);
        $oldData = $user->toArray();
        $user->update(['status' => 'deleted', 'deleted_at' => now()]);

        // Remove roles
        DB::table('user_custom_roles')->where('user_id', $id)->delete();

        $this->auditService->logDelete('users', $id, $oldData, $request);

        return $this->success(null, 'User deleted successfully');
    }
}
