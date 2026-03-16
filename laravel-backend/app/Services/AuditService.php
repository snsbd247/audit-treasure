<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditService
{
    public function log(string $module, string $action, ?string $recordId = null, ?string $details = null, ?Request $request = null): void
    {
        $user = $request?->user();
        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'System',
            'module' => $module,
            'action' => $action,
            'record_id' => $recordId,
            'details' => $details,
            'ip_address' => $request?->ip(),
        ]);
    }
}
