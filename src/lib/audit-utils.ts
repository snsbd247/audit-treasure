import { supabase } from "@/integrations/supabase/client";

/**
 * Logs an edit action with old vs new value diff to the audit_log table.
 * Used for tracking edits on approved documents especially.
 */
export async function logEditAudit(params: {
  userId?: string;
  userName?: string;
  module: string;
  action: string;
  recordId: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
}) {
  const { userId, userName, module, action, recordId, oldValues, newValues } = params;

  // Build diff: only include changed fields
  const diff: Record<string, { old: any; new: any }> = {};
  for (const key of new Set([...Object.keys(oldValues), ...Object.keys(newValues)])) {
    const oldVal = oldValues[key];
    const newVal = newValues[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal };
    }
  }

  if (Object.keys(diff).length === 0) return; // No changes

  await supabase.from("audit_log").insert({
    user_id: userId || null,
    user_name: userName || null,
    module,
    action,
    record_id: recordId,
    details: JSON.stringify({
      changes: diff,
      timestamp: new Date().toISOString(),
    }),
  });
}

/**
 * Simple audit log entry without diff (for create/delete).
 */
export async function logAudit(params: {
  userId?: string;
  userName?: string;
  module: string;
  action: string;
  recordId?: string;
  details?: string;
}) {
  await supabase.from("audit_log").insert({
    user_id: params.userId || null,
    user_name: params.userName || null,
    module: params.module,
    action: params.action,
    record_id: params.recordId || null,
    details: params.details || null,
  });
}
