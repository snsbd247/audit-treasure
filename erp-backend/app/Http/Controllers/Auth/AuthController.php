<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\BaseController;
use App\Models\User;
use App\Models\LoginLog;
use App\Services\UserActivityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends BaseController
{
    public function __construct(private UserActivityService $activityService) {}

    public function login(Request $request)
    {
        $request->validate(['username' => 'required', 'password' => 'required']);

        $user = User::where('username', $request->username)->whereNotNull('username')->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            $this->activityService->log('failed_login', "Failed login for: {$request->username}", $request, null, [
                'username' => $request->username,
                'status' => 'failed',
            ]);
            return $this->error('Invalid credentials', 401);
        }
        if ($user->status !== 'active') {
            $this->activityService->log('failed_login', "Disabled account login: {$request->username}", $request, $user->id, [
                'username' => $request->username,
                'status' => 'disabled',
            ]);
            return $this->error('Account is disabled', 403);
        }

        $token = $user->createToken('api')->plainTextToken;
        $user->update(['is_online' => true, 'last_seen_at' => now(), 'last_login_at' => now()]);
        $roles = $user->roles()->with('permissions')->get();
        $permissions = $user->getAllPermissions();

        // Log login activity
        LoginLog::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'login_time' => now(),
        ]);

        // Log successful login
        $this->activityService->logLogin($user->id, $request, true);

        Log::info("User logged in: {$user->username}, Super Admin: " . ($user->isSuperAdmin() ? 'YES' : 'NO') . ", Permissions: " . json_encode($permissions));

        return $this->success([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'branch_id' => $user->branch_id,
                'employee_id' => $user->employee_id,
                'is_super_admin' => $user->isSuperAdmin(),
                'roles' => $roles,
                'permissions' => $permissions,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        $user->update(['is_online' => false, 'last_seen_at' => now()]);

        // Update the latest login log with logout time
        $latestLog = LoginLog::where('user_id', $user->id)
            ->whereNull('logout_time')
            ->orderBy('login_time', 'desc')
            ->first();
        if ($latestLog) {
            $latestLog->update(['logout_time' => now()]);
        }

        $this->activityService->logLogout($user->id, $request);
        $user->currentAccessToken()->delete();
        return $this->success(null, 'Logged out');
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles.permissions', 'branch');
        return $this->success([
            'user' => $user,
            'is_super_admin' => $user->isSuperAdmin(),
            'permissions' => $user->getAllPermissions(),
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('Current password is incorrect', 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        $this->activityService->log('password_change', 'Password changed', $request, $user->id);

        return $this->success(null, 'Password changed');
    }
}
