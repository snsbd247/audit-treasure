import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BrandingSettings {
  software_name: string;
  software_version: string;
  footer_text: string;
  developer_name: string;
  white_label_mode: boolean;
  primary_color: string;
  secondary_color: string;
  company_logo_url: string;
  login_logo_url: string;
  favicon_url: string;
}

const DEFAULTS: BrandingSettings = {
  software_name: "SmartERP",
  software_version: "1.0",
  footer_text: "© 2026 SmartERP. All Rights Reserved.",
  developer_name: "Ismail Software Solutions",
  white_label_mode: false,
  primary_color: "221 83% 53%",
  secondary_color: "220 14% 96%",
  company_logo_url: "",
  login_logo_url: "",
  favicon_url: "",
};

const BRANDING_KEYS = Object.keys(DEFAULTS) as (keyof BrandingSettings)[];

interface BrandingContextType {
  branding: BrandingSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULTS,
  loading: true,
  refetch: async () => {},
});

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", BRANDING_KEYS);

    if (data && data.length > 0) {
      const merged = { ...DEFAULTS };
      data.forEach((row: any) => {
        const key = row.setting_key as keyof BrandingSettings;
        if (key === "white_label_mode") {
          (merged as any)[key] = row.setting_value === "true";
        } else {
          (merged as any)[key] = row.setting_value || DEFAULTS[key];
        }
      });
      setBranding(merged);
      applyThemeColors(merged.primary_color, merged.secondary_color);
      applyFavicon(merged.favicon_url);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refetch: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

function applyThemeColors(primary: string, secondary: string) {
  if (!primary) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  if (secondary) {
    root.style.setProperty("--secondary", secondary);
  }
}

function applyFavicon(url: string) {
  if (!url) return;
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}
