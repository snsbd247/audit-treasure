import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Custom hook for permission checking.
 * 
 * Rule: If user.employee_id == NULL → Super Admin → return true for everything.
 *       Otherwise → check against permissions array.
 * 
 * Usage:
 *   const { can, canView, canCreate, canEdit, canDelete } = usePermission();
 *   if (can("sales.view")) { ... }
 *   if (canCreate("users")) { ... }
 */
export function usePermission() {
  const { profile, permissions, isSuperAdmin } = useAuth();

  const can = useCallback(
    (permission: string): boolean => {
      // Super Admin (employee_id == null) bypasses all checks
      if (isSuperAdmin) return true;
      // Wildcard means full access
      if (permissions.includes("*")) return true;
      return permissions.includes(permission);
    },
    [isSuperAdmin, permissions]
  );

  const canView = useCallback((module: string) => can(`${module}.view`), [can]);
  const canCreate = useCallback((module: string) => can(`${module}.create`), [can]);
  const canEdit = useCallback((module: string) => can(`${module}.edit`), [can]);
  const canDelete = useCallback((module: string) => can(`${module}.delete`), [can]);

  return { can, canView, canCreate, canEdit, canDelete, isSuperAdmin };
}
