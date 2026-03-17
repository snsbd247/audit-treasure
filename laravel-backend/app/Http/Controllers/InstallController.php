<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\User;

class InstallController extends BaseController
{
    /**
     * Check if system is already installed.
     */
    public function status(): JsonResponse
    {
        return $this->success(['installed' => $this->isInstalled()]);
    }

    /**
     * Step 1: Check server environment.
     */
    public function checkEnvironment(): JsonResponse
    {
        if ($this->isInstalled()) {
            return $this->error('System is already installed.', 403);
        }

        $checks = [
            'php_version' => [
                'label' => 'PHP Version >= 8.1',
                'ok' => version_compare(PHP_VERSION, '8.1.0', '>='),
                'value' => PHP_VERSION,
            ],
            'pdo_mysql' => [
                'label' => 'PDO MySQL Extension',
                'ok' => extension_loaded('pdo') && extension_loaded('pdo_mysql'),
                'value' => extension_loaded('pdo_mysql') ? 'Loaded' : 'Missing',
            ],
            'openssl' => [
                'label' => 'OpenSSL Extension',
                'ok' => extension_loaded('openssl'),
                'value' => extension_loaded('openssl') ? 'Loaded' : 'Missing',
            ],
            'mbstring' => [
                'label' => 'Mbstring Extension',
                'ok' => extension_loaded('mbstring'),
                'value' => extension_loaded('mbstring') ? 'Loaded' : 'Missing',
            ],
            'tokenizer' => [
                'label' => 'Tokenizer Extension',
                'ok' => extension_loaded('tokenizer'),
                'value' => extension_loaded('tokenizer') ? 'Loaded' : 'Missing',
            ],
            'json' => [
                'label' => 'JSON Extension',
                'ok' => extension_loaded('json'),
                'value' => extension_loaded('json') ? 'Loaded' : 'Missing',
            ],
            'bcmath' => [
                'label' => 'BCMath Extension',
                'ok' => extension_loaded('bcmath'),
                'value' => extension_loaded('bcmath') ? 'Loaded' : 'Missing',
            ],
            'fileinfo' => [
                'label' => 'Fileinfo Extension',
                'ok' => extension_loaded('fileinfo'),
                'value' => extension_loaded('fileinfo') ? 'Loaded' : 'Missing',
            ],
            'storage_writable' => [
                'label' => 'Storage Directory Writable',
                'ok' => is_writable(storage_path()),
                'value' => is_writable(storage_path()) ? 'Writable' : 'Not Writable — run: chmod -R 775 storage',
            ],
            'bootstrap_cache' => [
                'label' => 'Bootstrap Cache Writable',
                'ok' => is_writable(base_path('bootstrap/cache')),
                'value' => is_writable(base_path('bootstrap/cache')) ? 'Writable' : 'Not Writable — run: chmod -R 775 bootstrap/cache',
            ],
            'env_writable' => [
                'label' => 'Base Directory Writable (.env)',
                'ok' => is_writable(base_path()) || (file_exists(base_path('.env')) && is_writable(base_path('.env'))),
                'value' => (is_writable(base_path()) || (file_exists(base_path('.env')) && is_writable(base_path('.env')))) ? 'Writable' : 'Not Writable',
            ],
        ];

        $allOk = collect($checks)->every(fn($c) => $c['ok']);

        return $this->success(['checks' => $checks, 'all_ok' => $allOk]);
    }

    /**
     * Step 2: Test database connection.
     */
    public function testDatabase(Request $request): JsonResponse
    {
        if ($this->isInstalled()) {
            return $this->error('System is already installed.', 403);
        }

        $data = $request->validate([
            'db_host' => 'required|string|max:255',
            'db_port' => 'nullable|integer|min:1|max:65535',
            'db_name' => 'required|string|max:255',
            'db_user' => 'required|string|max:255',
            'db_pass' => 'nullable|string|max:255',
        ]);

        try {
            $pdo = new \PDO(
                "mysql:host={$data['db_host']};port=" . ($data['db_port'] ?? 3306) . ";dbname={$data['db_name']}",
                $data['db_user'],
                $data['db_pass'] ?? '',
                [\PDO::ATTR_TIMEOUT => 5, \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
            $version = $pdo->query('SELECT VERSION()')->fetchColumn();

            return $this->success([
                'connected' => true,
                'version' => $version,
            ], 'Database connection successful');
        } catch (\Exception $e) {
            return $this->error('Database connection failed: ' . $e->getMessage(), 422);
        }
    }

    /**
     * Step 3: Run full installation.
     */
    public function install(Request $request): JsonResponse
    {
        if ($this->isInstalled()) {
            return $this->error('System is already installed.', 403);
        }

        $data = $request->validate([
            'db_host' => 'required|string|max:255',
            'db_port' => 'nullable|integer|min:1|max:65535',
            'db_name' => 'required|string|max:255',
            'db_user' => 'required|string|max:255',
            'db_pass' => 'nullable|string|max:255',
            'admin_name' => 'required|string|max:100',
            'admin_username' => 'required|string|max:50|regex:/^[a-zA-Z0-9_]+$/',
            'admin_email' => 'nullable|email|max:100',
            'admin_password' => 'required|string|min:6|max:100',
            'company_name' => 'nullable|string|max:200',
        ]);

        $steps = [];

        try {
            // 1. Write .env file
            $steps[] = 'Writing .env configuration...';
            $this->writeEnvFile($data);

            // 2. Clear config cache so new .env is loaded
            $steps[] = 'Clearing configuration cache...';
            Artisan::call('config:clear');

            // 3. Re-set database config at runtime
            $steps[] = 'Connecting to database...';
            config([
                'database.connections.mysql.host' => $data['db_host'],
                'database.connections.mysql.port' => $data['db_port'] ?? 3306,
                'database.connections.mysql.database' => $data['db_name'],
                'database.connections.mysql.username' => $data['db_user'],
                'database.connections.mysql.password' => $data['db_pass'] ?? '',
            ]);
            DB::purge('mysql');
            DB::reconnect('mysql');

            // 4. Generate app key
            $steps[] = 'Generating application key...';
            Artisan::call('key:generate', ['--force' => true]);

            // 5. Run migrations
            $steps[] = 'Running database migrations...';
            Artisan::call('migrate', ['--force' => true]);

            // 6. Run seeder (RBAC, CoA, master data)
            $steps[] = 'Seeding master data (RBAC, Chart of Accounts, Units)...';
            Artisan::call('db:seed', ['--force' => true]);

            // 7. Override the seeded admin with user-provided credentials
            $steps[] = 'Creating Super Admin account...';
            $admin = User::where('username', 'admin')->first();
            if ($admin) {
                $admin->update([
                    'name' => $data['admin_name'],
                    'username' => $data['admin_username'],
                    'email' => $data['admin_email'] ?? 'admin@erp.local',
                    'password' => Hash::make($data['admin_password']),
                    'employee_id' => null, // Super Admin
                ]);
            } else {
                // Create fresh if seeder didn't create one
                $admin = User::create([
                    'name' => $data['admin_name'],
                    'username' => $data['admin_username'],
                    'email' => $data['admin_email'] ?? 'admin@erp.local',
                    'password' => Hash::make($data['admin_password']),
                    'employee_id' => null, // Super Admin
                ]);
                // Attach Super Admin role
                $superRole = \App\Models\CustomRole::where('name', 'Super Admin')->first();
                if ($superRole) {
                    $admin->roles()->attach($superRole->id);
                }
            }

            // 8. Update company name if provided
            if (!empty($data['company_name'])) {
                $steps[] = 'Setting company name...';
                DB::table('company_settings')->limit(1)->update([
                    'company_name' => $data['company_name'],
                ]);
            }

            // 9. Create storage link + backup directory
            $steps[] = 'Creating storage link & backup directory...';
            @mkdir(storage_path('app/backups'), 0775, true);
            try {
                Artisan::call('storage:link');
            } catch (\Exception $e) {
                // May already exist
            }

            // 10. Mark as installed (DB flag + file lock)
            $steps[] = 'Finalizing installation...';
            DB::table('system_settings')->updateOrInsert(
                ['setting_key' => 'setup_completed'],
                ['setting_value' => 'true', 'updated_at' => now(), 'created_at' => now()]
            );
            // File-based lock as backup
            file_put_contents(storage_path('installed'), date('Y-m-d H:i:s'));

            // 11. Cache config for production
            $steps[] = 'Optimizing for production...';
            try {
                Artisan::call('config:cache');
                Artisan::call('route:cache');
                Artisan::call('view:cache');
            } catch (\Exception $e) {
                // Non-critical — closures in routes will prevent route:cache
                Log::warning('Post-install optimization warning: ' . $e->getMessage());
            }

            $steps[] = '✅ Installation completed successfully!';

            return $this->success([
                'username' => $data['admin_username'],
                'steps' => $steps,
                'message' => 'Installation completed successfully!',
            ], 'ERP System installed successfully');

        } catch (\Exception $e) {
            Log::error('Installation failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            $steps[] = '❌ Error: ' . $e->getMessage();

            return response()->json([
                'success' => false,
                'message' => 'Installation failed: ' . $e->getMessage(),
                'data' => ['steps' => $steps],
            ], 500);
        }
    }

    /**
     * Write .env file dynamically.
     */
    private function writeEnvFile(array $data): void
    {
        $appKey = 'base64:' . base64_encode(random_bytes(32));
        $appUrl = url('/');
        $dbPass = addslashes($data['db_pass'] ?? '');

        $env = <<<ENV
APP_NAME="SmartERP"
APP_ENV=production
APP_KEY={$appKey}
APP_DEBUG=false
APP_URL={$appUrl}

LOG_CHANNEL=daily
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST={$data['db_host']}
DB_PORT={$data['db_port']}
DB_DATABASE={$data['db_name']}
DB_USERNAME={$data['db_user']}
DB_PASSWORD="{$dbPass}"

SANCTUM_STATEFUL_DOMAINS={$this->getStatefulDomain()}
SESSION_DOMAIN={$this->getSessionDomain()}

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

FILESYSTEM_DISK=public
ENV;

        file_put_contents(base_path('.env'), $env);
    }

    private function getStatefulDomain(): string
    {
        return request()->getHost();
    }

    private function getSessionDomain(): string
    {
        return '.' . request()->getHost();
    }

    /**
     * Check if system is installed via file lock OR DB flag.
     */
    private function isInstalled(): bool
    {
        // File-based check (fastest, no DB needed)
        if (file_exists(storage_path('installed'))) {
            return true;
        }

        // DB-based check (fallback)
        if (!file_exists(base_path('.env'))) {
            return false;
        }

        try {
            return DB::table('system_settings')
                ->where('setting_key', 'setup_completed')
                ->where('setting_value', 'true')
                ->exists();
        } catch (\Exception $e) {
            return false;
        }
    }
}
