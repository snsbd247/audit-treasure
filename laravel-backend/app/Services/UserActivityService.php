<?php

namespace App\Services;

use App\Models\UserActivity;
use Illuminate\Http\Request;

class UserActivityService
{
    public function log(string $activityType, ?string $description = null, ?Request $request = null, ?string $userId = null, ?array $metadata = null): void
    {
        UserActivity::create([
            'user_id' => $userId ?? $request?->user()?->id,
            'activity_type' => $activityType,
            'description' => $description,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'metadata' => $metadata,
        ]);
    }

    public function logLogin(string $userId, Request $request, bool $success = true): void
    {
        $this->log(
            $success ? 'login' : 'failed_login',
            $success ? 'User logged in' : 'Failed login attempt',
            $request,
            $userId,
            ['username' => $request->input('username'), 'status' => $success ? 'success' : 'failed']
        );
    }

    public function logLogout(string $userId, Request $request): void
    {
        $this->log('logout', 'User logged out', $request, $userId);
    }
}
