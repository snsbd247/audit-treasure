import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logLoginAttempt, logLogout } from "@/lib/audit-utils";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "super_admin" | "admin" | "staff";

interface Profile {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  branch_id: string | null;
  status: string;
}

interface Permission {
  module: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  permissions: Permission[];
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (module: string, action: "can_view" | "can_add" | "can_edit" | "can_delete") => boolean;
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
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (rolesRes.data) setRoles(rolesRes.data.map((r: any) => r.role as AppRole));

    // Fetch custom role permissions
    const { data: customRoleLinks } = await supabase
      .from("user_custom_roles")
      .select("custom_role_id")
      .eq("user_id", userId);

    if (customRoleLinks && customRoleLinks.length > 0) {
      const roleIds = customRoleLinks.map((r: any) => r.custom_role_id);
      const { data: perms } = await supabase
        .from("role_permissions")
        .select("*")
        .in("custom_role_id", roleIds);
      if (perms) {
        // Merge permissions across roles (OR logic - if any role grants, it's granted)
        const merged: Record<string, Permission> = {};
        perms.forEach((p: any) => {
          if (!merged[p.module]) {
            merged[p.module] = { module: p.module, can_view: false, can_add: false, can_edit: false, can_delete: false };
          }
          if (p.can_view) merged[p.module].can_view = true;
          if (p.can_add) merged[p.module].can_add = true;
          if (p.can_edit) merged[p.module].can_edit = true;
          if (p.can_delete) merged[p.module].can_delete = true;
        });
        setPermissions(Object.values(merged));
      }
    } else {
      setPermissions([]);
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
        setRoles([]);
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
    // Log login attempt
    try {
      await logLoginAttempt({
        userId: data?.user?.id,
        email,
        success: !error,
      });
    } catch { /* ignore logging errors */ }
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

  const isSuperAdmin = roles.includes("super_admin");
  // isAdmin is now only true for super_admin — all other access is permission-based
  const isAdmin = isSuperAdmin;

  const hasPermission = useCallback((module: string, action: "can_view" | "can_add" | "can_edit" | "can_delete") => {
    // Super admin bypasses all permission checks
    if (isSuperAdmin) return true;
    const perm = permissions.find((p) => p.module === module);
    return perm ? perm[action] : false;
  }, [isSuperAdmin, permissions]);

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
