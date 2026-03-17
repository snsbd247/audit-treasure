<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\BaseController;
use App\Models\User;
use App\Services\UserActivityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends BaseController
{
    public function __construct(private UserActivityService $activityService) {}

    public function login(Request $request)
    {
        $request->validate(['username' => 'required', 'password' => 'required']);

        $user = User::where('username', $request->username)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            // Log failed attempt
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
        $roles = $user->roles()->with('permissions')->get();

        // Log successful login
        $this->activityService->logLogin($user->id, $request, true);

        return $this->success([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'branch_id' => $user->branch_id,
                'roles' => $roles,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $this->activityService->logLogout($request->user()->id, $request);
        $request->user()->currentAccessToken()->delete();
        return $this->success(null, 'Logged out');
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles.permissions', 'branch');
        return $this->success($user);
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
