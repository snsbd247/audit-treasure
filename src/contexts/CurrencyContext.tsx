import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CurrencyConfig {
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  currency_position: string;
}

interface CurrencyContextType {
  config: CurrencyConfig;
  /** Format a number as currency string using system settings */
  fc: (amount: number) => string;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaults: CurrencyConfig = {
  currency_name: "US Dollar",
  currency_code: "USD",
  currency_symbol: "$",
  currency_position: "before",
};

const CurrencyContext = createContext<CurrencyContextType>({
  config: defaults,
  fc: (n) => `$${n.toLocaleString()}`,
  loading: true,
  refetch: async () => {},
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<CurrencyConfig>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("company_settings" as any)
      .select("currency_name, currency_code, currency_symbol, currency_position")
      .eq("id", "default")
      .single();
    if (data) {
      setConfig(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fc = (amount: number): string => {
    const formatted = Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return config.currency_position === "after"
      ? `${formatted} ${config.currency_symbol}`
      : `${config.currency_symbol} ${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ config, fc, loading, refetch: fetchConfig }}>
      {children}
    </CurrencyContext.Provider>
  );
};
