<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class UpdateLastSeen
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check()) {
            auth()->user()->update([
                'is_online' => true,
                'last_seen_at' => now(),
            ]);
        }

        return $next($request);
    }
}
