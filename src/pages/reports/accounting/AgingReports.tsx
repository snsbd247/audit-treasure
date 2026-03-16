import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

interface AgingReportProps {
  type: "receivable" | "payable";
}

const AgingReport = ({ type }: AgingReportProps) => {
  const { branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF } = useReportData();
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();

    if (type === "receivable") {
      let query = supabase.from("sales_invoices")
        .select("*, customers(name)")
        .in("status", ["completed", "sent"]);
      if (branch !== "all") query = query.eq("branch_id", branch);
      const { data: invoices } = await query;

      const customerMap = new Map<string, { name: string; d0_30: number; d31_60: number; d61_90: number; d90plus: number; total: number }>();
      (invoices || []).forEach((inv: any) => {
        const custName = (inv.customers as any)?.name || "Walk-in";
        const custId = inv.customer_id || "walk-in";
        const days = Math.floor((today.getTime() - new Date(inv.invoice_date).getTime()) / 86400000);
        const amount = Number(inv.net_amount || inv.total_amount || 0);
        const cur = customerMap.get(custId) || { name: custName, d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 };
        if (days <= 30) cur.d0_30 += amount;
        else if (days <= 60) cur.d31_60 += amount;
        else if (days <= 90) cur.d61_90 += amount;
        else cur.d90plus += amount;
        cur.total += amount;
        customerMap.set(custId, cur);
      });
      setData(Array.from(customerMap.values()));
    } else {
      let query = supabase.from("purchases")
        .select("*, suppliers(name)");
      if (branch !== "all") query = query.eq("branch_id", branch);
      const { data: purchases } = await query;

      const supplierMap = new Map<string, { name: string; d0_30: number; d31_60: number; d61_90: number; d90plus: number; total: number }>();
      (purchases || []).forEach((p: any) => {
        const suppName = (p.suppliers as any)?.name || "Unknown";
        const suppId = p.supplier_id || "unknown";
        const days = Math.floor((today.getTime() - new Date(p.purchase_date).getTime()) / 86400000);
        const amount = Number(p.total_amount || 0);
        const cur = supplierMap.get(suppId) || { name: suppName, d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 };
        if (days <= 30) cur.d0_30 += amount;
        else if (days <= 60) cur.d31_60 += amount;
        else if (days <= 90) cur.d61_90 += amount;
        else cur.d90plus += amount;
        cur.total += amount;
        supplierMap.set(suppId, cur);
      });
      setData(Array.from(supplierMap.values()));
    }
    setLoading(false);
  };

  const title = type === "receivable" ? "Accounts Receivable Aging" : "Accounts Payable Aging";
  const partyLabel = type === "receivable" ? "Customer" : "Supplier";

  const columns = [
    { key: "name", label: partyLabel },
    { key: "d0_30", label: "0–30 Days", format: "currency" as const },
    { key: "d31_60", label: "31–60 Days", format: "currency" as const },
    { key: "d61_90", label: "61–90 Days", format: "currency" as const },
    { key: "d90plus", label: "90+ Days", format: "currency" as const },
    { key: "total", label: "Total", format: "currency" as const },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle={title} />
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
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
      <div ref={printRef}>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{partyLabel}</TableHead>
              <TableHead className="text-right">0–30 Days</TableHead>
              <TableHead className="text-right">31–60 Days</TableHead>
              <TableHead className="text-right">61–90 Days</TableHead>
              <TableHead className="text-right">90+ Days</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Click "Generate"</TableCell></TableRow>
              ) : data.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.d0_30 > 0 ? fc(r.d0_30) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.d31_60 > 0 ? fc(r.d31_60) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.d61_90 > 0 ? fc(r.d61_90) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">{r.d90plus > 0 ? fc(r.d90plus) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fc(r.total)}</TableCell>
                </TableRow>
              ))}
              {data.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(data.reduce((s, r) => s + r.d0_30, 0))}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(data.reduce((s, r) => s + r.d31_60, 0))}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(data.reduce((s, r) => s + r.d61_90, 0))}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(data.reduce((s, r) => s + r.d90plus, 0))}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(data.reduce((s, r) => s + r.total, 0))}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
};

export const ARAgingReport = () => <AgingReport type="receivable" />;
export const APAgingReport = () => <AgingReport type="payable" />;
