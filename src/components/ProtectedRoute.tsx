import { forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requiredPermission?: string; // e.g. "sales.view", "users.create"
  requireSuperAdmin?: boolean;
  /** @deprecated Use requiredPermission instead */
  requireAdmin?: boolean;
  /** @deprecated Use requiredPermission instead */
  requiredModule?: string;
  /** @deprecated Use requiredPermission instead */
  requiredAction?: "can_view" | "can_add" | "can_edit" | "can_delete";
}

export const ProtectedRoute = forwardRef<HTMLDivElement, Props>(
  ({ children, requiredPermission, requireSuperAdmin, requireAdmin, requiredModule, requiredAction = "can_view" }, ref) => {
    const { user, loading, isSuperAdmin, hasPermission } = useAuth();

    if (loading) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) return <Navigate to="/login" replace />;

    // New permission format: "module.action"
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">Access Denied</p>
            <p className="text-sm text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    // Super admin check
    if ((requireSuperAdmin || requireAdmin) && !isSuperAdmin) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">Access Denied</p>
            <p className="text-sm text-muted-foreground">Super Admin privileges required.</p>
          </div>
        </div>
      );
    }

    // Legacy module-based permission (backward compat)
    if (requiredModule) {
      const actionMap: Record<string, string> = {
        can_view: "view",
        can_add: "create",
        can_edit: "edit",
        can_delete: "delete",
      };
      const perm = `${requiredModule}.${actionMap[requiredAction] || "view"}`;
      if (!hasPermission(perm)) {
        return (
          <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-2">
              <p className="text-destructive font-medium">Access Denied</p>
              <p className="text-sm text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </div>
        );
      }
    }

    return <>{children}</>;
  }
);

ProtectedRoute.displayName = "ProtectedRoute";
