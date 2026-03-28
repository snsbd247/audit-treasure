<?php
namespace App\Services;

use App\Models\Attendance;
use App\Models\BiometricDevice;
use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BiometricSyncService
{
    /**
     * Sync attendance from all active ZKTeco devices.
     * Uses the rats/zkteco PHP library for device communication.
     */
    public function syncAll(): array
    {
        $devices = BiometricDevice::where('status', 'active')->get();
        $results = [];

        foreach ($devices as $device) {
            try {
                $result = $this->syncDevice($device);
                $results[$device->device_name] = $result;
                $device->update(['last_sync_at' => now()]);
            } catch (\Exception $e) {
                Log::error("Biometric sync failed for {$device->device_name}: " . $e->getMessage());
                $results[$device->device_name] = ['error' => $e->getMessage()];
            }
        }

        return $results;
    }

    /**
     * Sync attendance from a single ZKTeco device.
     * Requires: composer require rats/zkteco
     */
    protected function syncDevice(BiometricDevice $device): array
    {
        // NOTE: This requires the rats/zkteco package.
        // Install via: composer require rats/zkteco
        // The ZKTeco device must be on the same network as the server.

        if (!class_exists(\Rats\Zkteco\Lib\ZKTeco::class)) {
            Log::warning('ZKTeco library not installed. Run: composer require rats/zkteco');
            return ['error' => 'ZKTeco library not installed', 'synced' => 0];
        }

        $zk = new \Rats\Zkteco\Lib\ZKTeco($device->ip_address, $device->port);

        if (!$zk->connect()) {
            throw new \Exception("Cannot connect to device {$device->ip_address}:{$device->port}");
        }

        $logs = $zk->getAttendance();
        $zk->disconnect();

        $synced = 0;

        // Group logs by employee and date to determine first/last punch
        $grouped = [];
        foreach ($logs as $log) {
            $empCode = $log['id'] ?? $log['uid'] ?? '';
            $timestamp = $log['timestamp'] ?? '';
            if (!$empCode || !$timestamp) continue;

            $date = date('Y-m-d', strtotime($timestamp));
            $time = date('H:i:s', strtotime($timestamp));
            $key = "{$empCode}_{$date}";

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'employee_code' => (string) $empCode,
                    'date' => $date,
                    'punches' => [],
                ];
            }
            $grouped[$key]['punches'][] = $time;
        }

        foreach ($grouped as $record) {
            sort($record['punches']);
            $checkIn = $record['punches'][0];
            $checkOut = count($record['punches']) > 1 ? end($record['punches']) : null;

            // Find employee
            $employee = Employee::where('employee_code', $record['employee_code'])->first();
            if (!$employee) continue;

            // Determine status
            $status = $this->determineStatus($employee, $checkIn);

            // Insert biometric log
            DB::table('biometric_logs')->insert([
                'id' => \Illuminate\Support\Str::uuid(),
                'device_id' => $device->device_name,
                'device_name' => $device->device_name,
                'employee_code' => $record['employee_code'],
                'date' => $record['date'],
                'check_in_time' => $checkIn,
                'check_out_time' => $checkOut,
                'processed' => true,
                'created_at' => now(),
            ]);

            // Upsert attendance
            $existing = Attendance::where('employee_id', $employee->id)
                ->where('date', $record['date'])
                ->first();

            if ($existing) {
                $existing->update([
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'status' => $status,
                ]);
            } else {
                Attendance::create([
                    'employee_id' => $employee->id,
                    'date' => $record['date'],
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'status' => $status,
                ]);
            }

            $synced++;
        }

        return ['synced' => $synced, 'total_logs' => count($logs)];
    }

    /**
     * Determine attendance status based on shift rules.
     */
    protected function determineStatus(Employee $employee, string $checkIn): string
    {
        if (!$employee->shift_id) return 'present';

        $shift = Shift::find($employee->shift_id);
        if (!$shift) return 'present';

        $shiftStart = strtotime($shift->start_time);
        $lateAfter = $shift->late_after_minutes ?? 15;
        $checkInTime = strtotime($checkIn);

        $lateThreshold = $shiftStart + ($lateAfter * 60);

        return $checkInTime > $lateThreshold ? 'late' : 'present';
    }
}
