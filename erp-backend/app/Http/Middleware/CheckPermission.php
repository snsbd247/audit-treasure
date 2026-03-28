<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CheckPermission
{
    /**
     * Usage in routes: ->middleware('permission:sales.view')
     * 
     * Rule: If user.employee_id IS NULL → Super Admin → allow all.
     *       Otherwise → check hasPermission('module.action').
     */
    public function handle(Request $request, Closure $next, string $permission)
    {
        $user = $request->user();
        if (!$user) return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);

        // Super Admin: employee_id is NULL → full access
        if ($user->isSuperAdmin()) {
            Log::debug("Permission granted (Super Admin): {$permission} for user {$user->id}");
            return $next($request);
        }

        if (!$user->hasPermission($permission)) {
            Log::warning("Permission denied: {$permission} for user {$user->id} ({$user->name})");
            return response()->json([
                'success' => false,
                'message' => "Permission denied: {$permission}",
            ], 403);
        }

        Log::debug("Permission granted: {$permission} for user {$user->id}");
        return $next($request);
    }
}
