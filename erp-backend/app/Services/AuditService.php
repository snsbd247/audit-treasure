<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditService
{
    public function log(string $module, string $action, ?string $recordId = null, ?string $details = null, ?Request $request = null, ?array $oldData = null, ?array $newData = null): void
    {
        $user = $request?->user();
        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'System',
            'module' => $module,
            'action' => $action,
            'record_id' => $recordId,
            'details' => $details,
            'old_data' => $oldData,
            'new_data' => $newData,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }

    public function logCreate(string $module, string $recordId, array $newData, ?Request $request = null): void
    {
        $this->log($module, 'create', $recordId, null, $request, null, $newData);
    }

    public function logUpdate(string $module, string $recordId, array $oldData, array $newData, ?Request $request = null): void
    {
        $this->log($module, 'edit', $recordId, null, $request, $oldData, $newData);
    }

    public function logDelete(string $module, string $recordId, array $oldData, ?Request $request = null): void
    {
        $this->log($module, 'delete', $recordId, null, $request, $oldData, null);
    }
}
