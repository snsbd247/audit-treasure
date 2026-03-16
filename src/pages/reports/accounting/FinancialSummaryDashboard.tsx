import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ReportHeader } from "@/components/ReportHeader";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Landmark, BarChart3 } from "lucide-react";

const FinancialSummaryDashboard = () => {
  const { fc } = useCurrency();
  const [stats, setStats] = useState({ revenue: 0, expense: 0, netProfit: 0, cashBalance: 0, bankBalance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [accountsRes, entriesRes] = await Promise.all([
        supabase.from("chart_of_accounts").select("*"),
        supabase.from("voucher_entries")
          .select("account_id, debit, credit, acc_vouchers!inner(status)")
          .eq("acc_vouchers.status", "approved"),
      ]);

      const accounts = (accountsRes.data || []) as any[];
      const entries = (entriesRes.data || []) as any[];

      const balMap = new Map<string, number>();
      entries.forEach((e) => {
        const cur = balMap.get(e.account_id) || 0;
        balMap.set(e.account_id, cur + Number(e.debit) - Number(e.credit));
      });

      let revenue = 0, expense = 0, cashBalance = 0, bankBalance = 0;

      accounts.forEach((a) => {
        const txnBal = balMap.get(a.id) || 0;
        const openBal = a.opening_balance_type === "debit" ? a.opening_balance : -a.opening_balance;
        const totalBal = openBal + txnBal;

        if (a.account_type === "income") revenue += Math.abs(txnBal);
        if (a.account_type === "expense") expense += Math.abs(txnBal);
        if (a.account_name.toLowerCase().includes("cash")) cashBalance += totalBal;
        if (a.account_name.toLowerCase().includes("bank")) bankBalance += totalBal;
      });

      setStats({ revenue, expense, netProfit: revenue - expense, cashBalance, bankBalance });
      setLoading(false);
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Revenue", value: stats.revenue, icon: TrendingUp, color: "text-green-700 dark:text-green-400" },
    { label: "Total Expense", value: stats.expense, icon: TrendingDown, color: "text-destructive" },
    { label: "Net Profit", value: stats.netProfit, icon: DollarSign, color: stats.netProfit >= 0 ? "text-green-700 dark:text-green-400" : "text-destructive" },
    { label: "Cash Balance", value: stats.cashBalance, icon: PiggyBank, color: "text-primary" },
    { label: "Bank Balance", value: stats.bankBalance, icon: Landmark, color: "text-primary" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="Financial Summary" />
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Financial Summary Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold tabular-nums ${c.color}`}>
                {loading ? "..." : fc(c.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FinancialSummaryDashboard;
