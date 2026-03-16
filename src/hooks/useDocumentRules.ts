/**
 * Document Approval & Editing Rules Hook
 * 
 * Rules:
 * - Draft: any user with edit permission can edit/delete
 * - Approved: locked for normal users; only Super Admin can edit/delete
 * - Cancelled: no edits allowed by anyone
 */

import { useAuth } from "@/contexts/AuthContext";

export type DocumentStatus = "draft" | "approved" | "cancelled" | "completed" | "pending" | "rejected";

interface DocumentRules {
  /** Can the current user edit this document? */
  canEdit: boolean;
  /** Can the current user delete this document? */
  canDelete: boolean;
  /** Can the current user approve this document? */
  canApprove: boolean;
  /** Can the current user cancel this document? */
  canCancel: boolean;
  /** Is this an override edit (Super Admin editing approved doc)? */
  isOverrideEdit: boolean;
  /** Human-readable reason if editing is blocked */
  lockReason: string | null;
}

export function useDocumentRules(
  module: string,
  status: DocumentStatus | string
): DocumentRules {
  const { isSuperAdmin, isAdmin, hasPermission } = useAuth();

  const normalizedStatus = status?.toLowerCase() as DocumentStatus;
  const userCanEdit = hasPermission(module, "can_edit") || isSuperAdmin;
  const userCanDelete = hasPermission(module, "can_delete") || isSuperAdmin;

  // Cancelled documents: no one can edit
  if (normalizedStatus === "cancelled") {
    return {
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canCancel: false,
      isOverrideEdit: false,
      lockReason: "Cancelled documents cannot be modified",
    };
  }

  // Approved/completed documents: only Super Admin
  if (normalizedStatus === "approved" || normalizedStatus === "completed") {
    return {
      canEdit: isSuperAdmin,
      canDelete: isSuperAdmin,
      canApprove: false,
      canCancel: isSuperAdmin || isAdmin,
      isOverrideEdit: isSuperAdmin,
      lockReason: isSuperAdmin ? null : "Only Super Admin can modify approved documents",
    };
  }

  // Draft/pending/rejected: normal edit rules apply
  return {
    canEdit: userCanEdit,
    canDelete: userCanDelete,
    canApprove: isAdmin || isSuperAdmin,
    canCancel: userCanEdit,
    isOverrideEdit: false,
    lockReason: userCanEdit ? null : "You don't have permission to edit",
  };
}

/**
 * Get status badge styling
 */
export function getDocumentStatusConfig(status: string) {
  const s = status?.toLowerCase();
  switch (s) {
    case "draft":
      return { label: "Draft", variant: "secondary" as const, className: "bg-muted text-muted-foreground" };
    case "pending":
      return { label: "Pending", variant: "outline" as const, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
    case "approved":
      return { label: "Approved", variant: "default" as const, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" };
    case "completed":
      return { label: "Completed", variant: "default" as const, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" };
    case "active":
      return { label: "Active", variant: "default" as const, className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" };
    case "rejected":
      return { label: "Rejected", variant: "destructive" as const, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
    case "cancelled":
      return { label: "Cancelled", variant: "destructive" as const, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
    default:
      return { label: status || "Unknown", variant: "secondary" as const, className: "bg-muted text-muted-foreground" };
  }
}
