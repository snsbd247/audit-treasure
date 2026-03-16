import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CompanySettings {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  currency_position: string;
  default_branch_id: string | null;
  default_financial_year_id: string | null;
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("company_settings" as any)
      .select("*")
      .eq("id", "default")
      .single();
    setSettings(data as any);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return { settings, loading, refetch: fetch };
}

export function formatCurrency(amount: number, settings: CompanySettings | null): string {
  if (!settings) return amount.toLocaleString();
  const formatted = amount.toLocaleString();
  return settings.currency_position === "before"
    ? `${settings.currency_symbol}${formatted}`
    : `${formatted}${settings.currency_symbol}`;
}
