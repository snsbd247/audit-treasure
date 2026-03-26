import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requiredPermission?: string;
  requireSuperAdmin?: boolean;
  requireAdmin?: boolean;
  requiredModule?: string;
  requiredAction?: "can_view" | "can_add" | "can_edit" | "can_delete";
}

const AccessState = ({ title, message }: { title: string; message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-2">
      <p className="text-destructive font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const ProtectedRoute = ({
  children,
  requiredPermission,
  requireSuperAdmin,
  requireAdmin,
  requiredModule,
  requiredAction = "can_view",
}: Props) => {
  const { user, loading, isSuperAdmin, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessState title="Access Denied" message="You don't have permission to access this page." />;
  }

  if ((requireSuperAdmin || requireAdmin) && !isSuperAdmin) {
    return <AccessState title="Access Denied" message="Super Admin privileges required." />;
  }

  if (requiredModule) {
    const actionMap: Record<string, string> = {
      can_view: "view",
      can_add: "create",
      can_edit: "edit",
      can_delete: "delete",
    };

    const perm = `${requiredModule}.${actionMap[requiredAction] || "view"}`;
    if (!hasPermission(perm)) {
      return <AccessState title="Access Denied" message="You don't have permission to access this page." />;
    }
  }

  return <>{children}</>;
};
