import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";

const ProfitLossReport = () => {
  const { accounts, branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF } = useReportData();
  const [income, setIncome] = useState<any[]>([]);
  const [expense, setExpense] = useState<any[]>([]);
  const [view, setView] = useState("summary");

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("voucher_entries")
      .select("account_id, debit, credit, acc_vouchers!inner(status, voucher_date, branch_id)")
      .eq("acc_vouchers.status", "approved")
      .gte("acc_vouchers.voucher_date", dateFrom)
      .lte("acc_vouchers.voucher_date", dateTo);
    if (branch !== "all") query = query.eq("acc_vouchers.branch_id", branch);

    const { data: entries } = await query;
    const balMap = new Map<string, number>();
    (entries || []).forEach((e: any) => {
      const cur = balMap.get(e.account_id) || 0;
      balMap.set(e.account_id, cur + Number(e.credit) - Number(e.debit));
    });

    const incomeAccounts = accounts.filter((a) => a.account_type === "income").map((a) => ({
      ...a, balance: Math.abs(balMap.get(a.id) || 0),
    })).filter((a) => a.balance > 0);

    const expenseAccounts = accounts.filter((a) => a.account_type === "expense").map((a) => ({
      ...a, balance: Math.abs(balMap.get(a.id) || 0),
    })).filter((a) => a.balance > 0);

    setIncome(incomeAccounts);
    setExpense(expenseAccounts);
    setLoading(false);
  };

  const totalIncome = income.reduce((s, i) => s + i.balance, 0);
  const totalExpense = expense.reduce((s, e) => s + e.balance, 0);
  const netProfit = totalIncome - totalExpense;

  const allData = [
    ...income.map((i) => ({ ...i, category: "Income" })),
    ...expense.map((e) => ({ ...e, category: "Expense" })),
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="Profit & Loss Statement" subtitle={`${dateFrom} to ${dateTo}`} />
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Profit & Loss Statement</h1>
      </div>
      <ReportFilters
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        branches={branches} selectedBranch={branch} onBranchChange={setBranch}
        onSearch={fetchData} loading={loading}
        onPrint={() => handlePrint("Profit & Loss Statement")}
        onExportExcel={() => handleExportExcel(allData, [
          { key: "account_code", label: "Code" }, { key: "account_name", label: "Account" },
          { key: "category", label: "Category" }, { key: "balance", label: "Amount", format: "currency" },
        ], "profit-loss")}
        onExportPDF={() => handleExportPDF("Profit & Loss Statement")}
      />
      <Tabs value={view} onValueChange={setView}>
        <TabsList><TabsTrigger value="summary">Summary</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger></TabsList>
      </Tabs>
      <div ref={printRef}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base text-green-700 dark:text-green-400">Income</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableBody>
                {income.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow> : income.map((i) => (
                  <TableRow key={i.id}><TableCell>{i.account_name}</TableCell><TableCell className="text-right tabular-nums">{fc(i.balance)}</TableCell></TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold"><TableCell>Total Income</TableCell><TableCell className="text-right tabular-nums">{fc(totalIncome)}</TableCell></TableRow>
              </TableBody></Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base text-destructive">Expenses</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableBody>
                {expense.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow> : expense.map((e) => (
                  <TableRow key={e.id}><TableCell>{e.account_name}</TableCell><TableCell className="text-right tabular-nums">{fc(e.balance)}</TableCell></TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold"><TableCell>Total Expenses</TableCell><TableCell className="text-right tabular-nums">{fc(totalExpense)}</TableCell></TableRow>
              </TableBody></Table>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-4">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground text-lg">Net Profit / (Loss)</span>
              <span className={`text-2xl font-bold tabular-nums ${netProfit >= 0 ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>
                {fc(netProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfitLossReport;
