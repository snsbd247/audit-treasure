import { supabase } from "@/integrations/supabase/client";

/**
 * Comprehensive audit logging utility for ERP operations.
 * Captures old/new data diffs, user context, and metadata.
 */

function getUserAgent(): string {
  return navigator.userAgent || "unknown";
}

/**
 * Log a create operation with the new record data.
 */
export async function logCreate(params: {
  userId?: string;
  userName?: string;
  module: string;
  recordId?: string;
  newData?: Record<string, any>;
  details?: string;
}) {
  await supabase.from("audit_log").insert({
    user_id: params.userId || null,
    user_name: params.userName || null,
    module: params.module,
    action: "create",
    record_id: params.recordId || null,
    new_data: params.newData || null,
    details: params.details || null,
    user_agent: getUserAgent(),
  } as any);
}

/**
 * Log an update operation with old vs new data diff.
 */
export async function logUpdate(params: {
  userId?: string;
  userName?: string;
  module: string;
  recordId: string;
  oldData: Record<string, any>;
  newData: Record<string, any>;
  details?: string;
}) {
  const { oldData, newData } = params;

  // Build diff: only include changed fields
  const diff: Record<string, { old: any; new: any }> = {};
  for (const key of new Set([...Object.keys(oldData), ...Object.keys(newData)])) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal };
    }
  }

  if (Object.keys(diff).length === 0) return; // No changes

  await supabase.from("audit_log").insert({
    user_id: params.userId || null,
    user_name: params.userName || null,
    module: params.module,
    action: "edit",
    record_id: params.recordId,
    old_data: oldData,
    new_data: newData,
    details: params.details || JSON.stringify({ changes: diff }),
    user_agent: getUserAgent(),
  } as any);
}

/**
 * Log a delete operation.
 */
export async function logDelete(params: {
  userId?: string;
  userName?: string;
  module: string;
  recordId: string;
  oldData?: Record<string, any>;
  details?: string;
}) {
  await supabase.from("audit_log").insert({
    user_id: params.userId || null,
    user_name: params.userName || null,
    module: params.module,
    action: "delete",
    record_id: params.recordId,
    old_data: params.oldData || null,
    details: params.details || null,
    user_agent: getUserAgent(),
  } as any);
}

/**
 * Log an approval action.
 */
export async function logApprove(params: {
  userId?: string;
  userName?: string;
  module: string;
  recordId: string;
  details?: string;
}) {
  await supabase.from("audit_log").insert({
    user_id: params.userId || null,
    user_name: params.userName || null,
    module: params.module,
    action: "approve",
    record_id: params.recordId,
    details: params.details || null,
    user_agent: getUserAgent(),
  } as any);
}

/**
 * Generic audit log entry.
 */
export async function logAudit(params: {
  userId?: string;
  userName?: string;
  module: string;
  action: string;
  recordId?: string;
  details?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
}) {
  await supabase.from("audit_log").insert({
    user_id: params.userId || null,
    user_name: params.userName || null,
    module: params.module,
    action: params.action,
    record_id: params.recordId || null,
    old_data: params.oldData || null,
    new_data: params.newData || null,
    details: params.details || null,
    user_agent: getUserAgent(),
  } as any);
}

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
  await logUpdate({
    userId: params.userId,
    userName: params.userName,
    module: params.module,
    recordId: params.recordId,
    oldData: params.oldValues,
    newData: params.newValues,
    details: undefined,
  });
}

// ===== User Activity Tracking =====

/**
 * Log a user activity (login, logout, page visit, etc.)
 */
export async function logActivity(params: {
  userId?: string;
  activityType: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  await supabase.from("user_activities" as any).insert({
    user_id: params.userId || null,
    activity_type: params.activityType,
    description: params.description || null,
    user_agent: getUserAgent(),
    metadata: params.metadata || null,
  });
}

/**
 * Log a login attempt.
 */
export async function logLoginAttempt(params: {
  userId?: string;
  email: string;
  success: boolean;
}) {
  await logActivity({
    userId: params.userId,
    activityType: params.success ? "login" : "failed_login",
    description: params.success
      ? `Successful login: ${params.email}`
      : `Failed login attempt: ${params.email}`,
    metadata: { email: params.email, success: params.success },
  });
}

/**
 * Log a logout event.
 */
export async function logLogout(userId?: string) {
  await logActivity({
    userId,
    activityType: "logout",
    description: "User logged out",
  });
}
