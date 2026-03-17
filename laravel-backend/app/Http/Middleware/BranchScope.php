<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class BranchScope
{
    /**
     * Automatically scope queries to user's branch unless Super Admin.
     * Super Admin = employee_id IS NULL → can access all branches.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && !$user->isSuperAdmin() && $user->branch_id) {
            $request->merge(['branch_id' => $user->branch_id]);
        }
        return $next($request);
    }
}
