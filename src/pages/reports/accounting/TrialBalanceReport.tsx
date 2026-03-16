import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

const TrialBalanceReport = () => {
  const { accounts, branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF } = useReportData();
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("voucher_entries")
      .select("account_id, debit, credit, acc_vouchers!inner(status, voucher_date, branch_id)")
      .eq("acc_vouchers.status", "approved")
      .gte("acc_vouchers.voucher_date", dateFrom)
      .lte("acc_vouchers.voucher_date", dateTo);

    if (branch !== "all") query = query.eq("acc_vouchers.branch_id", branch);

    const { data: entries } = await query;
    const balMap = new Map<string, { debit: number; credit: number }>();
    (entries || []).forEach((e: any) => {
      const cur = balMap.get(e.account_id) || { debit: 0, credit: 0 };
      cur.debit += Number(e.debit);
      cur.credit += Number(e.credit);
      balMap.set(e.account_id, cur);
    });

    const result = accounts.map((a) => {
      const txn = balMap.get(a.id) || { debit: 0, credit: 0 };
      const openDr = a.opening_balance_type === "debit" ? a.opening_balance : 0;
      const openCr = a.opening_balance_type === "credit" ? a.opening_balance : 0;
      const openBal = openDr - openCr;
      const closingBal = openBal + txn.debit - txn.credit;
      return { ...a, opening: openBal, total_debit: txn.debit, total_credit: txn.credit, closing: closingBal };
    }).filter((a) => a.total_debit > 0 || a.total_credit > 0 || a.opening !== 0);

    setData(result);
    setLoading(false);
  };

  const columns = [
    { key: "account_code", label: "Account Code" },
    { key: "account_name", label: "Account Name" },
    { key: "opening", label: "Opening Balance", format: "currency" as const },
    { key: "total_debit", label: "Debit", format: "currency" as const },
    { key: "total_credit", label: "Credit", format: "currency" as const },
    { key: "closing", label: "Closing Balance", format: "currency" as const },
  ];

  const totalDebit = data.reduce((s, d) => s + d.total_debit, 0);
  const totalCredit = data.reduce((s, d) => s + d.total_credit, 0);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="Trial Balance" subtitle={`${dateFrom} to ${dateTo}`} />
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Trial Balance</h1>
      </div>
      <ReportFilters
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        branches={branches} selectedBranch={branch} onBranchChange={setBranch}
        onSearch={fetchData} loading={loading}
        onPrint={() => handlePrint("Trial Balance")}
        onExportExcel={() => handleExportExcel(data, columns, "trial-balance")}
        onExportPDF={() => handleExportPDF("Trial Balance")}
      />
      <div ref={printRef}>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Closing</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Click "Generate" to load data</TableCell></TableRow>
              ) : data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.account_code}</TableCell>
                  <TableCell className="font-medium">{t.account_name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground text-xs">{t.account_type}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(t.opening)}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.total_debit > 0 ? fc(t.total_debit) : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.total_credit > 0 ? fc(t.total_credit) : ""}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${t.closing < 0 ? "text-destructive" : ""}`}>{fc(t.closing)}</TableCell>
                </TableRow>
              ))}
              {data.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4} className="text-right">Total</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(totalDebit)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(totalCredit)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(totalDebit - totalCredit)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default TrialBalanceReport;
