import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logLoginAttempt, logLogout } from "@/lib/audit-utils";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  branch_id: string | null;
  employee_id: string | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  permissions: string[];
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Accepts "module.action" (new) or (module, action) legacy format */
  hasPermission: (moduleOrPermission: string, action?: string) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, meta?: Record<string, string>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileData) {
      const p = profileData as any;
      setProfile({
        id: p.id,
        name: p.name,
        username: p.username,
        email: p.email,
        phone: p.phone,
        branch_id: p.branch_id,
        employee_id: p.employee_id ?? null,
        status: p.status,
      });

      // Super Admin = employee_id is NULL
      const isSA = p.employee_id === null || p.employee_id === undefined;

      if (isSA) {
        setPermissions(["*"]); // Wildcard = full access
      } else {
        // Fetch custom role permissions
        const { data: customRoleLinks } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("user_id", userId);

        if (customRoleLinks && customRoleLinks.length > 0) {
          const roleIds = customRoleLinks.map((r: any) => r.custom_role_id);
          const { data: perms } = await supabase
            .from("role_permissions")
            .select("*")
            .in("custom_role_id", roleIds);

          if (perms) {
            const actionMap: Record<string, string> = {
              can_view: "view",
              can_add: "create",
              can_edit: "edit",
              can_delete: "delete",
            };
            const merged: Record<string, Record<string, boolean>> = {};
            perms.forEach((p: any) => {
              if (!merged[p.module]) merged[p.module] = {};
              Object.entries(actionMap).forEach(([col, action]) => {
                if (p[col]) merged[p.module][action] = true;
              });
            });

            const flatPerms: string[] = [];
            Object.entries(merged).forEach(([mod, actions]) => {
              Object.entries(actions).forEach(([action, granted]) => {
                if (granted) flatPerms.push(`${mod}.${action}`);
              });
            });
            setPermissions(flatPerms);
          } else {
            setPermissions([]);
          }
        } else {
          setPermissions([]);
        }
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
        setPermissions([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    try {
      await logLoginAttempt({ userId: data?.user?.id, email, success: !error });
    } catch { /* ignore */ }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, meta?: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try { await logLogout(user?.id); } catch { /* ignore */ }
    await supabase.auth.signOut();
  };

  // Super Admin = employee_id is null (or wildcard permissions)
  const isSuperAdmin = profile?.employee_id === null || profile?.employee_id === undefined || permissions.includes("*");
  const isAdmin = isSuperAdmin;

  // Derive legacy roles array from permissions/super admin status
  const roles: string[] = isSuperAdmin ? ["super_admin"] : [];

  const hasPermission = useCallback(
    (moduleOrPermission: string, action?: string): boolean => {
      if (isSuperAdmin) return true;
      if (permissions.includes("*")) return true;

      // Legacy 2-arg format: hasPermission("sales", "can_view") → "sales.view"
      if (action) {
        const actionMap: Record<string, string> = {
          can_view: "view", can_add: "create", can_edit: "edit", can_delete: "delete",
        };
        const mapped = actionMap[action] || action;
        return permissions.includes(`${moduleOrPermission}.${mapped}`);
      }

      // New 1-arg format: hasPermission("sales.view")
      return permissions.includes(moduleOrPermission);
    },
    [isSuperAdmin, permissions]
  );

  return (
    <AuthContext.Provider value={{
      user, session, profile, roles, permissions, loading,
      isAdmin, isSuperAdmin, hasPermission,
      signIn, signUp, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
