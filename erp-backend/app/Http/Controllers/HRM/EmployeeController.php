<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\CrudController;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class EmployeeController extends CrudController
{
    protected string $modelClass = Employee::class;
    protected array $searchFields = ['employee_code', 'first_name', 'last_name', 'email'];
    protected array $with = ['department', 'designation', 'branch', 'shift'];
    protected array $validationRules = [
        'employee_code' => 'required|unique:employees,employee_code',
        'first_name' => 'required|max:100',
        'last_name' => 'required|max:100',
        'joining_date' => 'required|date',
        'department_id' => 'nullable|exists:departments,id',
        'designation_id' => 'nullable|exists:designations,id',
        'branch_id' => 'nullable|exists:branches,id',
        'shift_id' => 'nullable|exists:shifts,id',
        'salary' => 'numeric|min:0',
    ];

    /**
     * Override store to handle login account creation.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_code' => 'required|unique:employees,employee_code',
            'first_name' => 'required|max:100',
            'last_name' => 'required|max:100',
            'joining_date' => 'required|date',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'branch_id' => 'nullable|exists:branches,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'salary' => 'numeric|min:0',
            'email' => 'nullable|email',
            'mobile' => 'nullable|string',
            'address' => 'nullable|string',
            'national_id' => 'nullable|string',
            'employment_type' => 'nullable|in:permanent,contract,probation',
            'status' => 'nullable|in:active,inactive,terminated',
            'create_login' => 'sometimes|boolean',
        ]);

        $loginEnabled = $request->boolean('create_login');

        // Validate login fields only when login is enabled
        if ($loginEnabled) {
            // Auto-generate username if empty
            $username = $request->username;
            if (empty($username)) {
                $username = $this->generateUsername();
                $request->merge(['username' => $username]);
            }
            $request->validate([
                'username' => 'required|unique:users,username|max:50',
                'password' => 'required|min:6',
            ]);
        }

        return DB::transaction(function () use ($data, $request, $loginEnabled) {
            $employee = Employee::create($data);

            // Create user login account only if toggle is ON
            if ($loginEnabled) {
                $user = User::create([
                    'username' => $request->username,
                    'name' => "{$employee->first_name} {$employee->last_name}",
                    'email' => $employee->email,
                    'phone' => $employee->mobile,
                    'password' => Hash::make($request->password),
                    'employee_id' => $employee->id,
                    'branch_id' => $employee->branch_id,
                    'status' => 'active',
                ]);

                $employee->update(['user_id' => $user->id]);

                // Assign staff role if exists
                $staffRole = \App\Models\CustomRole::where('name', 'Staff')->first();
                if ($staffRole) {
                    $user->roles()->attach($staffRole->id);
                }
            }

            return $this->created($employee->fresh()->load('department', 'designation', 'branch', 'shift'));
        });
    }

    /**
     * Override show to load all relations for single employee view.
     */
    public function show(string $id)
    {
        $employee = Employee::with([
            'department', 'designation', 'branch', 'shift',
            'salaryStructure', 'bankInfo', 'education',
            'experience', 'emergencyContacts',
        ])->findOrFail($id);

        // Include linked user info
        $linkedUser = User::where('employee_id', $id)->first(['id', 'username', 'status']);

        return $this->success([
            'employee' => $employee,
            'linked_user' => $linkedUser,
        ]);
    }

    /**
     * Override update to handle login account management.
     */
    public function update(Request $request, string $id)
    {
        $employee = Employee::findOrFail($id);
        $data = $request->validate([
            'employee_code' => "sometimes|unique:employees,employee_code,{$id}",
            'first_name' => 'sometimes|max:100',
            'last_name' => 'sometimes|max:100',
            'joining_date' => 'sometimes|date',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'branch_id' => 'nullable|exists:branches,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'salary' => 'numeric|min:0',
            'email' => 'nullable|email',
            'mobile' => 'nullable|string',
            'address' => 'nullable|string',
            'national_id' => 'nullable|string',
            'employment_type' => 'nullable|in:permanent,contract,probation',
            'status' => 'nullable|in:active,inactive,terminated',
            'create_login' => 'sometimes|boolean',
        ]);

        $loginEnabled = $request->boolean('create_login');

        return DB::transaction(function () use ($data, $request, $employee, $id, $loginEnabled) {
            $employee->update($data);
            $existingUser = User::where('employee_id', $id)->first();

            if ($loginEnabled) {
                // Login toggle is ON
                if ($existingUser) {
                    // Update existing user
                    $updateData = ['name' => "{$employee->first_name} {$employee->last_name}", 'email' => $employee->email, 'status' => 'active'];
                    if ($request->filled('username')) {
                        $request->validate(['username' => "required|unique:users,username,{$existingUser->id}|max:50"]);
                        $updateData['username'] = $request->username;
                    }
                    if ($request->filled('password')) {
                        $request->validate(['password' => 'min:6']);
                        $updateData['password'] = Hash::make($request->password);
                    }
                    $existingUser->update($updateData);
                } else {
                    // Create new login account
                    $request->validate([
                        'username' => 'required|unique:users,username|max:50',
                        'password' => 'required|min:6',
                    ]);

                    $user = User::create([
                        'username' => $request->username,
                        'name' => "{$employee->first_name} {$employee->last_name}",
                        'email' => $employee->email,
                        'phone' => $employee->mobile,
                        'password' => Hash::make($request->password),
                        'employee_id' => $employee->id,
                        'branch_id' => $employee->branch_id,
                        'status' => 'active',
                    ]);

                    $employee->update(['user_id' => $user->id]);

                    $staffRole = \App\Models\CustomRole::where('name', 'Staff')->first();
                    if ($staffRole) {
                        $user->roles()->attach($staffRole->id);
                    }
                }
            } else {
                // Login toggle is OFF — disable login
                if ($existingUser) {
                    $existingUser->update(['status' => 'inactive', 'username' => null]);
                    $existingUser->tokens()->delete(); // Revoke all tokens
                    $employee->update(['user_id' => null]);
                }
            }

            return $this->success($employee->fresh()->load('department', 'designation', 'branch', 'shift'));
        });
    }

    /**
     * Upload employee profile photo.
     */
    public function uploadPhoto(Request $request, string $id)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $employee = Employee::findOrFail($id);

        if ($request->hasFile('photo')) {
            if ($employee->photo_url) {
                $oldPath = str_replace('/storage/', '', $employee->photo_url);
                if (\Storage::disk('public')->exists($oldPath)) {
                    \Storage::disk('public')->delete($oldPath);
                }
            }

            $path = $request->file('photo')->store('employees', 'public');
            $employee->update(['photo_url' => '/storage/' . $path]);

            return $this->success([
                'message' => 'Photo uploaded',
                'photo_url' => '/storage/' . $path,
            ]);
        }

        return $this->error('No photo provided', 400);
    }

    /**
     * Get linked user info for an employee.
     */
    public function getLinkedUser(string $id)
    {
        $user = User::where('employee_id', $id)->first(['id', 'username', 'status', 'created_at', 'last_login_at']);
        return $this->success($user);
    }

    /**
     * Auto-generate username in EMP-XXXX format.
     */
    private function generateUsername(): string
    {
        $lastUser = User::whereNotNull('username')
            ->where('username', 'LIKE', 'EMP-%')
            ->orderByRaw("CAST(SUBSTRING(username, 5) AS UNSIGNED) DESC")
            ->first();

        $nextNum = 1;
        if ($lastUser && preg_match('/^EMP-(\d+)$/i', $lastUser->username, $matches)) {
            $nextNum = (int) $matches[1] + 1;
        }

        $username = 'EMP-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

        // Ensure uniqueness
        while (User::where('username', $username)->exists()) {
            $nextNum++;
            $username = 'EMP-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
        }

        return $username;
    }

    /**
     * API endpoint to get next auto-generated username.
     */
    public function nextUsername()
    {
        return $this->success(['username' => $this->generateUsername()]);
    }
}
