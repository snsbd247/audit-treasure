import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";

const GeneralLedgerReport = () => {
  const { accounts, branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF } = useReportData();
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("voucher_entries")
      .select("*, acc_vouchers!inner(voucher_number, voucher_date, status, description, branch_id)")
      .eq("acc_vouchers.status", "approved")
      .gte("acc_vouchers.voucher_date", dateFrom)
      .lte("acc_vouchers.voucher_date", dateTo);

    if (selectedAccount !== "all") query = query.eq("account_id", selectedAccount);
    if (branch !== "all") query = query.eq("acc_vouchers.branch_id", branch);
    query = query.order("acc_vouchers(voucher_date)");

    const { data: entries } = await query;

    // Group by account and compute running balance
    const grouped = new Map<string, any[]>();
    (entries || []).forEach((e: any) => {
      const list = grouped.get(e.account_id) || [];
      list.push(e);
      grouped.set(e.account_id, list);
    });

    const result: any[] = [];
    grouped.forEach((entries, accountId) => {
      const acc = accounts.find((a) => a.id === accountId);
      if (!acc) return;
      let runBal = acc.opening_balance_type === "debit" ? acc.opening_balance : -acc.opening_balance;

      entries.forEach((e) => {
        runBal += Number(e.debit) - Number(e.credit);
        result.push({
          ...e,
          account_name: acc.account_name,
          account_code: acc.account_code,
          voucher_number: e.acc_vouchers?.voucher_number,
          voucher_date: e.acc_vouchers?.voucher_date,
          description: e.acc_vouchers?.description || e.narration || "—",
          running_balance: runBal,
        });
      });
    });

    setData(result);
    setLoading(false);
  };

  const columns = [
    { key: "voucher_date", label: "Date" }, { key: "account_name", label: "Account" },
    { key: "voucher_number", label: "Voucher #" }, { key: "description", label: "Description" },
    { key: "debit", label: "Debit", format: "currency" as const }, { key: "credit", label: "Credit", format: "currency" as const },
    { key: "running_balance", label: "Balance", format: "currency" as const },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="General Ledger" subtitle={`${dateFrom} to ${dateTo}`} />
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">General Ledger</h1>
      </div>
      <ReportFilters
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        branches={branches} selectedBranch={branch} onBranchChange={setBranch}
        accounts={accounts} selectedAccount={selectedAccount} onAccountChange={setSelectedAccount}
        onSearch={fetchData} loading={loading}
        onPrint={() => handlePrint("General Ledger")}
        onExportExcel={() => handleExportExcel(data, columns, "general-ledger")}
        onExportPDF={() => handleExportPDF("General Ledger")}
      />
      <div ref={printRef}>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Account</TableHead><TableHead>Voucher #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Select filters and click "Generate"</TableCell></TableRow>
              ) : data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{e.voucher_date}</TableCell>
                  <TableCell className="font-medium text-sm">{e.account_name}</TableCell>
                  <TableCell className="font-mono text-xs">{e.voucher_number}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{e.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(e.debit) > 0 ? fc(Number(e.debit)) : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(e.credit) > 0 ? fc(Number(e.credit)) : ""}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${e.running_balance < 0 ? "text-destructive" : ""}`}>
                    {fc(Math.abs(e.running_balance))} {e.running_balance >= 0 ? "Dr" : "Cr"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default GeneralLedgerReport;
