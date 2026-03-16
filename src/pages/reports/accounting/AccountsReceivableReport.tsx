import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck } from "lucide-react";

const AccountsReceivableReport = () => {
  const { branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF } = useReportData();
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("sales_invoices")
      .select("*, customers(name)")
      .in("status", ["completed", "sent"])
      .gte("invoice_date", dateFrom)
      .lte("invoice_date", dateTo);
    if (branch !== "all") query = query.eq("branch_id", branch);
    query = query.order("invoice_date");

    const { data: invoices } = await query;
    const result = (invoices || []).map((inv: any) => ({
      id: inv.id,
      customer_name: (inv.customers as any)?.name || "Walk-in",
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      total_amount: Number(inv.net_amount || inv.total_amount || 0),
    }));
    setData(result);
    setLoading(false);
  };

  const columns = [
    { key: "customer_name", label: "Customer" }, { key: "invoice_number", label: "Invoice #" },
    { key: "invoice_date", label: "Date" }, { key: "total_amount", label: "Amount", format: "currency" as const },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="Accounts Receivable" subtitle={`${dateFrom} to ${dateTo}`} />
      <div className="flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Accounts Receivable</h1>
      </div>
      <ReportFilters
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        branches={branches} selectedBranch={branch} onBranchChange={setBranch}
        onSearch={fetchData} loading={loading}
        onPrint={() => handlePrint("Accounts Receivable")}
        onExportExcel={() => handleExportExcel(data, columns, "accounts-receivable")}
        onExportPDF={() => handleExportPDF("Accounts Receivable")}
      />
      <div ref={printRef}>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Customer</TableHead><TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead><TableHead className="text-right">Outstanding Amount</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Click "Generate"</TableCell></TableRow>
              ) : data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.customer_name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.invoice_number}</TableCell>
                  <TableCell>{r.invoice_date}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(r.total_amount)}</TableCell>
                </TableRow>
              ))}
              {data.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-right">Total Outstanding</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(data.reduce((s, r) => s + r.total_amount, 0))}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default AccountsReceivableReport;
