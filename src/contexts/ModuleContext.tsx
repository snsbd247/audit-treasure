import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ModuleKey = "inventory" | "multi_warehouse" | "multi_branch" | "hrm" | "accounts" | "bank" | "purchase" | "sales" | "reports" | "manufacturing";

interface ModuleSetting {
  id: string;
  module_name: string;
  module_key: ModuleKey;
  is_enabled: boolean;
  updated_by: string | null;
  updated_at: string;
}

interface ModuleContextType {
  modules: ModuleSetting[];
  loading: boolean;
  isModuleEnabled: (key: ModuleKey) => boolean;
  toggleModule: (key: ModuleKey, enabled: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<ModuleSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isSuperAdmin, profile } = useAuth();

  const fetchModules = useCallback(async () => {
    const { data, error } = await supabase
      .from("module_settings" as any)
      .select("*");
    if (!error && data) {
      setModules(data as any as ModuleSetting[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const isModuleEnabled = useCallback((key: ModuleKey) => {
    const mod = modules.find((m) => m.module_key === key);
    return mod ? mod.is_enabled : true; // default enabled if not found
  }, [modules]);

  const toggleModule = useCallback(async (key: ModuleKey, enabled: boolean) => {
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can change module settings");
      return;
    }

    const { error } = await supabase
      .from("module_settings" as any)
      .update({
        is_enabled: enabled,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("module_key", key);

    if (error) {
      toast.error("Failed to update module: " + error.message);
      return;
    }

    // Audit log
    await supabase.from("audit_log").insert({
      user_id: user?.id,
      user_name: profile?.name || profile?.email || "Unknown",
      module: "Module Settings",
      action: enabled ? "Enabled" : "Disabled",
      details: `Module "${key}" ${enabled ? "enabled" : "disabled"}`,
      record_id: key,
    });

    toast.success(`Module ${enabled ? "enabled" : "disabled"} successfully`);
    await fetchModules();
  }, [isSuperAdmin, user, profile, fetchModules]);

  return (
    <ModuleContext.Provider value={{ modules, loading, isModuleEnabled, toggleModule, refetch: fetchModules }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModules must be used within ModuleProvider");
  return ctx;
}
