<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class InstallController extends Controller
{
    /**
     * Step 1: Check server environment requirements
     */
    public function checkEnvironment()
    {
        $checks = [
            'php_version' => [
                'label' => 'PHP Version >= 8.1',
                'ok' => version_compare(PHP_VERSION, '8.1.0', '>='),
                'value' => PHP_VERSION,
            ],
            'pdo' => [
                'label' => 'PDO Extension',
                'ok' => extension_loaded('pdo') && extension_loaded('pdo_mysql'),
                'value' => extension_loaded('pdo_mysql') ? 'Installed' : 'Missing',
            ],
            'openssl' => [
                'label' => 'OpenSSL Extension',
                'ok' => extension_loaded('openssl'),
                'value' => extension_loaded('openssl') ? 'Installed' : 'Missing',
            ],
            'mbstring' => [
                'label' => 'Mbstring Extension',
                'ok' => extension_loaded('mbstring'),
                'value' => extension_loaded('mbstring') ? 'Installed' : 'Missing',
            ],
            'tokenizer' => [
                'label' => 'Tokenizer Extension',
                'ok' => extension_loaded('tokenizer'),
                'value' => extension_loaded('tokenizer') ? 'Installed' : 'Missing',
            ],
            'json' => [
                'label' => 'JSON Extension',
                'ok' => extension_loaded('json'),
                'value' => extension_loaded('json') ? 'Installed' : 'Missing',
            ],
            'bcmath' => [
                'label' => 'BCMath Extension',
                'ok' => extension_loaded('bcmath'),
                'value' => extension_loaded('bcmath') ? 'Installed' : 'Missing',
            ],
            'storage_writable' => [
                'label' => 'Storage Directory Writable',
                'ok' => is_writable(storage_path()),
                'value' => is_writable(storage_path()) ? 'Writable' : 'Not Writable',
            ],
            'env_writable' => [
                'label' => '.env File Writable',
                'ok' => is_writable(base_path()) || is_writable(base_path('.env')),
                'value' => (is_writable(base_path()) || is_writable(base_path('.env'))) ? 'Writable' : 'Not Writable',
            ],
        ];

        $allPassed = collect($checks)->every(fn($c) => $c['ok']);

        return response()->json([
            'success' => true,
            'checks' => $checks,
            'all_passed' => $allPassed,
        ]);
    }

    /**
     * Step 2: Test database connection
     */
    public function testDatabase(Request $request)
    {
        $request->validate([
            'db_host' => 'required|string|max:255',
            'db_name' => 'required|string|max:255',
            'db_user' => 'required|string|max:255',
            'db_pass' => 'nullable|string|max:255',
        ]);

        try {
            $pdo = new \PDO(
                "mysql:host={$request->db_host};charset=utf8mb4",
                $request->db_user,
                $request->db_pass ?? '',
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );

            // Check if database exists
            $stmt = $pdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$request->db_name]);
            $dbExists = $stmt->fetch() !== false;

            return response()->json([
                'success' => true,
                'connection' => true,
                'database_exists' => $dbExists,
                'message' => $dbExists
                    ? 'Connection successful! Database exists.'
                    : 'Connection successful! Database will be created.',
            ]);
        } catch (\PDOException $e) {
            return response()->json([
                'success' => false,
                'connection' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Step 3: Write .env, run migrations, seed, create admin — all in one
     */
    public function runSetup(Request $request)
    {
        $request->validate([
            'db_host' => 'required|string|max:255',
            'db_name' => 'required|string|max:255',
            'db_user' => 'required|string|max:255',
            'db_pass' => 'nullable|string|max:255',
            'admin_name' => 'required|string|max:100',
            'admin_username' => 'required|string|max:50',
            'admin_password' => 'required|string|min:6|max:100',
            'company_name' => 'nullable|string|max:255',
        ]);

        try {
            // 1. Create database if not exists
            $pdo = new \PDO(
                "mysql:host={$request->db_host};charset=utf8mb4",
                $request->db_user,
                $request->db_pass ?? '',
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
            $dbName = preg_replace('/[^a-zA-Z0-9_]/', '', $request->db_name);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo = null;

            // 2. Write .env file
            $appKey = 'base64:' . base64_encode(random_bytes(32));
            $envContent = $this->generateEnv($request, $appKey);
            file_put_contents(base_path('.env'), $envContent);

            // 3. Clear config cache so new .env is picked up
            Artisan::call('config:clear');

            // 4. Re-set database config at runtime
            config([
                'database.connections.mysql.host' => $request->db_host,
                'database.connections.mysql.database' => $request->db_name,
                'database.connections.mysql.username' => $request->db_user,
                'database.connections.mysql.password' => $request->db_pass ?? '',
            ]);
            DB::purge('mysql');
            DB::reconnect('mysql');

            // 5. Run migrations
            Artisan::call('migrate', ['--force' => true]);
            $migrateOutput = Artisan::output();

            // 6. Run seeder (RBAC roles, CoA, master data)
            Artisan::call('db:seed', ['--force' => true]);
            $seedOutput = Artisan::output();

            // 7. Create Super Admin user (employee_id = null → full access)
            $adminId = (string) Str::uuid();
            DB::table('users')->insert([
                'id' => $adminId,
                'username' => $request->admin_username,
                'name' => $request->admin_name,
                'email' => $request->admin_username . '@erp.local',
                'password' => Hash::make($request->admin_password),
                'branch_id' => DB::table('branches')->value('id'),
                'employee_id' => null, // Super Admin indicator
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Attach Super Admin role
            $superAdminRoleId = DB::table('custom_roles')->where('name', 'Super Admin')->value('id');
            if ($superAdminRoleId) {
                DB::table('user_roles')->insert([
                    'id' => (string) Str::uuid(),
                    'user_id' => $adminId,
                    'role_id' => $superAdminRoleId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 8. Update company name if provided
            if ($request->company_name) {
                DB::table('company_settings')
                    ->orderBy('created_at')
                    ->limit(1)
                    ->update(['company_name' => $request->company_name]);
            }

            // 9. Create storage link
            try {
                Artisan::call('storage:link');
            } catch (\Exception $e) {
                // Storage link may already exist
            }

            // 10. Mark setup as completed
            DB::table('system_settings')->updateOrInsert(
                ['setting_key' => 'setup_completed'],
                ['setting_value' => 'true', 'updated_at' => now()]
            );

            return response()->json([
                'success' => true,
                'message' => 'Installation completed successfully!',
                'admin_username' => $request->admin_username,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Installation failed: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Check if system is already installed
     */
    public function status()
    {
        $installed = false;
        try {
            $installed = DB::table('system_settings')
                ->where('setting_key', 'setup_completed')
                ->where('setting_value', 'true')
                ->exists();
        } catch (\Exception $e) {
            // DB not connected yet — not installed
        }

        return response()->json([
            'installed' => $installed,
        ]);
    }

    /**
     * Generate .env file content
     */
    private function generateEnv(Request $request, string $appKey): string
    {
        $dbPass = $request->db_pass ?? '';
        return <<<ENV
APP_NAME=SmartERP
APP_ENV=production
APP_KEY={$appKey}
APP_DEBUG=false
APP_URL=

LOG_CHANNEL=single
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST={$request->db_host}
DB_PORT=3306
DB_DATABASE={$request->db_name}
DB_USERNAME={$request->db_user}
DB_PASSWORD={$dbPass}

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

SANCTUM_STATEFUL_DOMAINS=
ENV;
    }
}
