<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstallCheck
{
    /**
     * Block access to install routes if already installed.
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            $installed = DB::table('system_settings')
                ->where('setting_key', 'setup_completed')
                ->where('setting_value', 'true')
                ->exists();

            if ($installed) {
                return response()->json([
                    'success' => false,
                    'message' => 'System is already installed. Reinstallation is blocked.',
                ], 403);
            }
        } catch (\Exception $e) {
            // DB not yet configured — allow install to proceed
        }

        return $next($request);
    }
}
