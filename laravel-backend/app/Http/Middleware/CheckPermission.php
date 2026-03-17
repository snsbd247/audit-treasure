<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    /**
     * Usage in routes: ->middleware('permission:accounting,view')
     * Only super_admin bypasses. All other users checked via role_permissions.
     */
    public function handle(Request $request, Closure $next, string $module, string $action)
    {
        $user = $request->user();
        if (!$user) return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);

        // Only Super Admin bypasses all permission checks
        if ($user->hasRole('Super Admin')) return $next($request);

        if (!$user->hasPermission($module, $action)) {
            return response()->json(['success' => false, 'message' => "No {$action} permission for {$module}"], 403);
        }

        return $next($request);
    }
}
