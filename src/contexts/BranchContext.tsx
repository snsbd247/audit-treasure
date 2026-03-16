import { createContext, useContext, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface BranchContextType {
  /** Current user's branch_id, null if super_admin with no branch */
  userBranchId: string | null;
  /** Whether user can see all branches */
  canAccessAllBranches: boolean;
  /** Get branch filter for queries - returns branch_id or null (no filter) */
  getBranchFilter: () => string | null;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { profile, isSuperAdmin } = useAuth();

  const userBranchId = profile?.branch_id || null;
  const canAccessAllBranches = isSuperAdmin;

  const getBranchFilter = useCallback(() => {
    if (canAccessAllBranches) return null; // no filter, see all
    return userBranchId;
  }, [canAccessAllBranches, userBranchId]);

  return (
    <BranchContext.Provider value={{ userBranchId, canAccessAllBranches, getBranchFilter }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
