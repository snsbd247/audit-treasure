import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, TrendingUp } from "lucide-react";

interface AnalysisReportProps {
  type: "expense" | "income";
}

const AnalysisReport = ({ type }: AnalysisReportProps) => {
  const { accounts, branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF } = useReportData();
  const [data, setData] = useState<any[]>([]);
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
      if (type === "expense") {
        balMap.set(e.account_id, cur + Number(e.debit) - Number(e.credit));
      } else {
        balMap.set(e.account_id, cur + Number(e.credit) - Number(e.debit));
      }
    });

    const filteredAccounts = accounts
      .filter((a) => a.account_type === type)
      .map((a) => ({ ...a, total: Math.abs(balMap.get(a.id) || 0) }))
      .filter((a) => a.total > 0)
      .sort((a, b) => b.total - a.total);

    setData(filteredAccounts);
    setLoading(false);
  };

  const title = type === "expense" ? "Expense Analysis" : "Income Analysis";
  const Icon = type === "expense" ? TrendingDown : TrendingUp;
  const grandTotal = data.reduce((s, d) => s + d.total, 0);

  const columns = [
    { key: "account_code", label: "Code" },
    { key: "account_name", label: type === "expense" ? "Expense Account" : "Income Account" },
    { key: "total", label: "Total Amount", format: "currency" as const },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle={title} subtitle={`${dateFrom} to ${dateTo}`} />
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
      <ReportFilters
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        branches={branches} selectedBranch={branch} onBranchChange={setBranch}
        onSearch={fetchData} loading={loading}
        onPrint={() => handlePrint(title)}
        onExportExcel={() => handleExportExcel(data, columns, title.toLowerCase().replace(/\s+/g, "-"))}
        onExportPDF={() => handleExportPDF(title)}
      />
      <Tabs value={view} onValueChange={setView}>
        <TabsList><TabsTrigger value="summary">Summary</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger></TabsList>
      </Tabs>
      <div ref={printRef}>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead>
              <TableHead>{type === "expense" ? "Expense Account" : "Income Account"}</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Click "Generate"</TableCell></TableRow>
              ) : data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.account_code}</TableCell>
                  <TableCell className="font-medium">{d.account_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(d.total)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
              ))}
              {data.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2} className="text-right">Grand Total</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(grandTotal)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
};

export const ExpenseAnalysisReport = () => <AnalysisReport type="expense" />;
export const IncomeAnalysisReport = () => <AnalysisReport type="income" />;
