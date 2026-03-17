<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database {--type=auto : Backup type (manual|auto)}';
    protected $description = 'Create a SQL dump backup of the database';

    public function handle(): int
    {
        $filename = 'erp_backup_' . date('Y_m_d_H_i') . '.sql';
        $dir = storage_path('app/backups');
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $path = $dir . '/' . $filename;
        $type = $this->option('type');

        $this->info("Creating backup: {$filename}");

        try {
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port', 3306);
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');

            // Try mysqldump first
            if ($this->tryMysqldump($host, $port, $database, $username, $password, $path)) {
                $this->recordBackup($filename, $path, $type, 'mysqldump');
                $this->info("✅ Backup created via mysqldump: {$filename}");
                return 0;
            }

            // Fallback: PHP-based SQL export
            $this->info("mysqldump not available, using PHP fallback...");
            $this->phpSqlExport($database, $path);
            $this->recordBackup($filename, $path, $type, 'php');
            $this->info("✅ Backup created via PHP export: {$filename}");

            // Cleanup old backups
            $this->cleanupOldBackups();

            return 0;
        } catch (\Exception $e) {
            Log::error("Backup failed: " . $e->getMessage());
            $this->error("❌ Backup failed: " . $e->getMessage());

            // Record failure
            DB::table('backup_history')->insert([
                'id' => Str::uuid(),
                'file_name' => $filename,
                'backup_type' => $type,
                'format' => 'sql',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'created_at' => now(),
            ]);

            return 1;
        }
    }

    private function tryMysqldump(string $host, int $port, string $database, string $username, string $password, string $path): bool
    {
        $mysqldump = $this->findMysqldump();
        if (!$mysqldump) return false;

        $passArg = $password ? "--password=" . escapeshellarg($password) : "";
        $cmd = sprintf(
            '%s --user=%s %s --host=%s --port=%d --single-transaction --routines --triggers --add-drop-table %s > %s 2>&1',
            escapeshellarg($mysqldump),
            escapeshellarg($username),
            $passArg,
            escapeshellarg($host),
            $port,
            escapeshellarg($database),
            escapeshellarg($path)
        );

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0) {
            Log::warning("mysqldump failed (code {$returnCode}): " . implode("\n", $output));
            @unlink($path);
            return false;
        }

        return file_exists($path) && filesize($path) > 0;
    }

    private function findMysqldump(): ?string
    {
        $paths = ['mysqldump', '/usr/bin/mysqldump', '/usr/local/bin/mysqldump', '/usr/local/mysql/bin/mysqldump'];
        foreach ($paths as $p) {
            exec("which {$p} 2>/dev/null", $out, $code);
            if ($code === 0) return trim($out[0] ?? $p);
        }
        return null;
    }

    private function phpSqlExport(string $database, string $path): void
    {
        $handle = fopen($path, 'w');
        if (!$handle) throw new \RuntimeException("Cannot write to {$path}");

        fwrite($handle, "-- SmartERP SQL Backup\n");
        fwrite($handle, "-- Generated: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "-- Database: {$database}\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

        $tables = DB::select('SHOW TABLES');
        $key = "Tables_in_{$database}";

        foreach ($tables as $tableRow) {
            $table = $tableRow->$key;

            // Skip migration table
            if ($table === 'migrations') continue;

            // DROP + CREATE
            $create = DB::select("SHOW CREATE TABLE `{$table}`");
            $createSql = $create[0]->{'Create Table'} ?? '';
            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");
            fwrite($handle, $createSql . ";\n\n");

            // INSERT data in chunks
            $count = DB::table($table)->count();
            if ($count === 0) continue;

            $chunkSize = 500;
            $offset = 0;

            while ($offset < $count) {
                $rows = DB::table($table)->offset($offset)->limit($chunkSize)->get();
                foreach ($rows as $row) {
                    $values = collect((array) $row)->map(function ($val) {
                        if (is_null($val)) return 'NULL';
                        return "'" . addslashes((string) $val) . "'";
                    })->implode(', ');

                    $columns = collect(array_keys((array) $row))->map(fn($c) => "`{$c}`")->implode(', ');
                    fwrite($handle, "INSERT INTO `{$table}` ({$columns}) VALUES ({$values});\n");
                }
                $offset += $chunkSize;
            }
            fwrite($handle, "\n");
        }

        fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        fclose($handle);
    }

    private function recordBackup(string $filename, string $path, string $type, string $method): void
    {
        $fileSize = file_exists($path) ? filesize($path) : 0;
        $database = config('database.connections.mysql.database');
        $tables = DB::select('SHOW TABLES');
        $tablesCount = count($tables);
        $recordsCount = 0;
        $key = "Tables_in_{$database}";
        foreach ($tables as $t) {
            try {
                $recordsCount += DB::table($t->$key)->count();
            } catch (\Exception $e) {}
        }

        DB::table('backup_history')->insert([
            'id' => Str::uuid(),
            'file_name' => $filename,
            'backup_type' => $type,
            'format' => 'sql',
            'status' => 'completed',
            'file_size' => $fileSize,
            'tables_count' => $tablesCount,
            'records_count' => $recordsCount,
            'storage_path' => 'backups/' . $filename,
            'created_at' => now(),
        ]);

        // Update last auto backup time
        if ($type === 'auto') {
            DB::table('backup_settings')->where('id', 'default')->update([
                'last_auto_backup_at' => now(),
            ]);
        }
    }

    private function cleanupOldBackups(): void
    {
        try {
            $settings = DB::table('backup_settings')->where('id', 'default')->first();
            $retentionDays = $settings->retention_days ?? 30;
            $cutoff = now()->subDays($retentionDays);

            $oldBackups = DB::table('backup_history')
                ->where('created_at', '<', $cutoff)
                ->get();

            foreach ($oldBackups as $backup) {
                if ($backup->storage_path) {
                    $fullPath = storage_path('app/' . $backup->storage_path);
                    if (file_exists($fullPath)) @unlink($fullPath);
                }
            }

            DB::table('backup_history')->where('created_at', '<', $cutoff)->delete();
        } catch (\Exception $e) {
            Log::warning("Backup cleanup failed: " . $e->getMessage());
        }
    }
}
