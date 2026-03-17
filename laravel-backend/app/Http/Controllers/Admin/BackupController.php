<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BackupController extends BaseController
{
    /**
     * List backup history.
     */
    public function index(Request $request): JsonResponse
    {
        $history = DB::table('backup_history')
            ->orderByDesc('created_at')
            ->limit($request->input('limit', 50))
            ->get();

        return $this->success($history);
    }

    /**
     * Create a new SQL backup.
     */
    public function create(Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return $this->error('Only Super Admins can create backups.', 403);
        }

        try {
            $exitCode = Artisan::call('backup:database', ['--type' => 'manual']);

            if ($exitCode !== 0) {
                return $this->error('Backup command failed.', 500);
            }

            // Get the latest backup record
            $latest = DB::table('backup_history')
                ->orderByDesc('created_at')
                ->first();

            return $this->success($latest, 'Backup created successfully');
        } catch (\Exception $e) {
            Log::error("Backup creation failed: " . $e->getMessage());
            return $this->error('Backup failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Download a backup file.
     */
    public function download(string $id): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $record = DB::table('backup_history')->where('id', $id)->first();
        if (!$record || !$record->storage_path) {
            return $this->error('Backup file not found.', 404);
        }

        $fullPath = storage_path('app/' . $record->storage_path);
        if (!file_exists($fullPath)) {
            return $this->error('Backup file not found on disk.', 404);
        }

        return response()->download($fullPath, $record->file_name, [
            'Content-Type' => 'application/sql',
        ]);
    }

    /**
     * Restore database from uploaded SQL file.
     */
    public function restore(Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return $this->error('Only Super Admins can restore backups.', 403);
        }

        $request->validate([
            'sql_file' => 'required|file|max:102400', // 100MB max
        ]);

        $file = $request->file('sql_file');
        $originalName = $file->getClientOriginalName();

        if (!Str::endsWith($originalName, '.sql')) {
            return $this->error('Only .sql files are allowed.', 422);
        }

        try {
            $path = $file->storeAs('backups', 'restore_' . date('Y_m_d_H_i_s') . '.sql');
            $fullPath = storage_path('app/' . $path);

            // Try mysql command first
            $restored = $this->tryMysqlRestore($fullPath);

            if (!$restored) {
                // Fallback: execute SQL line by line
                $this->phpSqlRestore($fullPath);
            }

            // Record restore in history
            DB::table('backup_history')->insert([
                'id' => Str::uuid(),
                'file_name' => $originalName,
                'backup_type' => 'restore',
                'format' => 'sql',
                'status' => 'completed',
                'file_size' => $file->getSize(),
                'storage_path' => $path,
                'created_at' => now(),
            ]);

            // Clean up restore file
            @unlink($fullPath);

            return $this->success(null, 'Database restored successfully');
        } catch (\Exception $e) {
            Log::error("Restore failed: " . $e->getMessage());

            DB::table('backup_history')->insert([
                'id' => Str::uuid(),
                'file_name' => $originalName,
                'backup_type' => 'restore',
                'format' => 'sql',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'created_at' => now(),
            ]);

            return $this->error('Restore failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a backup record and its file.
     */
    public function destroy(string $id, Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return $this->error('Only Super Admins can delete backups.', 403);
        }

        $record = DB::table('backup_history')->where('id', $id)->first();
        if (!$record) {
            return $this->error('Backup not found.', 404);
        }

        // Delete file from disk
        if ($record->storage_path) {
            $fullPath = storage_path('app/' . $record->storage_path);
            if (file_exists($fullPath)) @unlink($fullPath);
        }

        DB::table('backup_history')->where('id', $id)->delete();

        return $this->success(null, 'Backup deleted');
    }

    /**
     * Get/update backup settings.
     */
    public function settings(Request $request): JsonResponse
    {
        if ($request->isMethod('get')) {
            $settings = DB::table('backup_settings')->where('id', 'default')->first();
            if (!$settings) {
                // Create default settings
                DB::table('backup_settings')->insert([
                    'id' => 'default',
                    'auto_backup_enabled' => false,
                    'schedule_interval' => 'daily',
                    'retention_days' => 30,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $settings = DB::table('backup_settings')->where('id', 'default')->first();
            }
            return $this->success($settings);
        }

        // Update settings
        if (!$request->user()->isSuperAdmin()) {
            return $this->error('Only Super Admins can update settings.', 403);
        }

        $data = $request->validate([
            'auto_backup_enabled' => 'nullable|boolean',
            'schedule_interval' => 'nullable|in:hourly,daily,weekly',
            'retention_days' => 'nullable|integer|min:1|max:365',
        ]);

        DB::table('backup_settings')->where('id', 'default')->update(array_merge(
            array_filter($data, fn($v) => !is_null($v)),
            ['updated_by' => $request->user()->id, 'updated_at' => now()]
        ));

        return $this->success(null, 'Settings updated');
    }

    private function tryMysqlRestore(string $path): bool
    {
        $mysql = $this->findMysql();
        if (!$mysql) return false;

        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $passArg = $password ? "--password=" . escapeshellarg($password) : "";
        $cmd = sprintf(
            '%s --user=%s %s --host=%s --port=%d %s < %s 2>&1',
            escapeshellarg($mysql),
            escapeshellarg($username),
            $passArg,
            escapeshellarg($host),
            $port,
            escapeshellarg($database),
            escapeshellarg($path)
        );

        exec($cmd, $output, $returnCode);
        return $returnCode === 0;
    }

    private function findMysql(): ?string
    {
        $paths = ['mysql', '/usr/bin/mysql', '/usr/local/bin/mysql', '/usr/local/mysql/bin/mysql'];
        foreach ($paths as $p) {
            exec("which {$p} 2>/dev/null", $out, $code);
            if ($code === 0) return trim($out[0] ?? $p);
        }
        return null;
    }

    private function phpSqlRestore(string $path): void
    {
        $sql = file_get_contents($path);
        if (!$sql) throw new \RuntimeException("Cannot read SQL file");

        // Remove comments
        $sql = preg_replace('/^--.*$/m', '', $sql);
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);

        DB::unprepared($sql);
    }
}
