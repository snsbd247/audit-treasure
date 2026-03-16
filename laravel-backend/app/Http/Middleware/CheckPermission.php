<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    /**
     * Usage in routes: ->middleware('permission:accounting,view')
     */
    public function handle(Request $request, Closure $next, string $module, string $action)
    {
        $user = $request->user();
        if (!$user) return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);

        // Super admin bypasses
        if ($user->hasRole('Super Admin')) return $next($request);

        if (!$user->hasPermission($module, $action)) {
            return response()->json(['success' => false, 'message' => "No {$action} permission for {$module}"], 403);
        }

        return $next($request);
    }
}
