import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { Truck } from "lucide-react";

const AccountsPayableReport = () => {
  const { branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF } = useReportData();
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("purchases")
      .select("*, suppliers(name)")
      .gte("purchase_date", dateFrom)
      .lte("purchase_date", dateTo);
    if (branch !== "all") query = query.eq("branch_id", branch);
    query = query.order("purchase_date");

    const { data: purchases } = await query;
    const result = (purchases || []).map((p: any) => ({
      id: p.id,
      supplier_name: (p.suppliers as any)?.name || "Unknown",
      purchase_number: p.purchase_number,
      purchase_date: p.purchase_date,
      total_amount: Number(p.total_amount || 0),
    }));
    setData(result);
    setLoading(false);
  };

  const columns = [
    { key: "supplier_name", label: "Supplier" }, { key: "purchase_number", label: "Bill #" },
    { key: "purchase_date", label: "Date" }, { key: "total_amount", label: "Amount", format: "currency" as const },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="Accounts Payable" subtitle={`${dateFrom} to ${dateTo}`} />
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Accounts Payable</h1>
      </div>
      <ReportFilters
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        branches={branches} selectedBranch={branch} onBranchChange={setBranch}
        onSearch={fetchData} loading={loading}
        onPrint={() => handlePrint("Accounts Payable")}
        onExportExcel={() => handleExportExcel(data, columns, "accounts-payable")}
        onExportPDF={() => handleExportPDF("Accounts Payable")}
      />
      <div ref={printRef}>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Supplier</TableHead><TableHead>Bill #</TableHead>
              <TableHead>Date</TableHead><TableHead className="text-right">Outstanding Amount</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Click "Generate"</TableCell></TableRow>
              ) : data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.supplier_name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.purchase_number}</TableCell>
                  <TableCell>{r.purchase_date}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(r.total_amount)}</TableCell>
                </TableRow>
              ))}
              {data.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-right">Total Payable</TableCell>
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

export default AccountsPayableReport;
