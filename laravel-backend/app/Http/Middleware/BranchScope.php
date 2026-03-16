<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class BranchScope
{
    /**
     * Automatically scope queries to user's branch unless Super Admin.
     * Sets request->branch_id for controllers to use.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && !$user->hasRole('Super Admin') && $user->branch_id) {
            // Force branch_id to user's branch
            $request->merge(['branch_id' => $user->branch_id]);
        }
        return $next($request);
    }
}
