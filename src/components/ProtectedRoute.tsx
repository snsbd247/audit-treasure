import { forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = forwardRef<HTMLDivElement, Props>(
  ({ children, requireAdmin }, ref) => {
    const { user, loading, isAdmin } = useAuth();

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
    if (requireAdmin && !isAdmin) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">Access Denied</p>
            <p className="text-sm text-muted-foreground">Admin privileges required to access this page.</p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }
);

ProtectedRoute.displayName = "ProtectedRoute";
