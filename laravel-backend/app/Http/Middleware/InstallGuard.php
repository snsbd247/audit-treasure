<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstallGuard
{
    /**
     * Block access to install routes if system is already installed.
     * Uses dual check: file lock + DB flag.
     */
    public function handle(Request $request, Closure $next)
    {
        // File-based check (fastest, no DB query needed)
        if (file_exists(storage_path('installed'))) {
            return response()->json([
                'success' => false,
                'message' => 'System is already installed. Access denied.',
            ], 403);
        }

        // DB-based check (fallback if file was deleted)
        try {
            $installed = DB::table('system_settings')
                ->where('setting_key', 'setup_completed')
                ->where('setting_value', 'true')
                ->exists();

            if ($installed) {
                // Recreate file lock for faster checks
                file_put_contents(storage_path('installed'), date('Y-m-d H:i:s'));

                return response()->json([
                    'success' => false,
                    'message' => 'System is already installed. Access denied.',
                ], 403);
            }
        } catch (\Exception $e) {
            // Table doesn't exist yet — allow install to proceed
        }

        return $next($request);
    }
}
