import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { exportToExcel, printReport, type ReportColumn } from "@/lib/report-utils";

interface Account {
  id: string;
  account_name: string;
  account_code: string;
  account_type: string;
  opening_balance: number;
  opening_balance_type: string;
  parent_id: string | null;
}

interface Branch {
  id: string;
  name: string;
}

export function useReportData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const { fc } = useCurrency();
  const { settings } = useCompanySettings();
  const printRef = useRef<HTMLDivElement>(null);

  // Default date range: current financial year or current month
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(`${now.getFullYear()}-01-01`);
  const [dateTo, setDateTo] = useState(now.toISOString().slice(0, 10));
  const [branch, setBranch] = useState("all");

  useEffect(() => {
    const init = async () => {
      const [aRes, bRes] = await Promise.all([
        supabase.from("chart_of_accounts").select("*").order("account_code"),
        supabase.from("branches").select("id, name"),
      ]);
      setAccounts((aRes.data || []) as Account[]);
      setBranches((bRes.data || []) as Branch[]);
    };
    init();
  }, []);

  const handlePrint = useCallback(
    (title: string) => {
      printReport(printRef, title, settings?.company_name, {
        address: settings?.address || undefined,
        phone: settings?.phone || undefined,
        email: settings?.email || undefined,
      });
    },
    [settings]
  );

  const handleExportExcel = useCallback(
    (data: Record<string, any>[], columns: ReportColumn[], filename: string) => {
      exportToExcel(data, columns, filename);
    },
    []
  );

  const handleExportPDF = useCallback(
    (title: string) => {
      handlePrint(title);
    },
    [handlePrint]
  );

  return {
    accounts,
    branches,
    loading,
    setLoading,
    fc,
    settings,
    printRef,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    branch,
    setBranch,
    handlePrint,
    handleExportExcel,
    handleExportPDF,
  };
}
