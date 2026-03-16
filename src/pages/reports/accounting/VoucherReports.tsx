import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

interface VoucherReportProps {
  voucherType: string;
  title: string;
  icon?: React.ReactNode;
}

const VoucherTypeReport = ({ voucherType, title }: VoucherReportProps) => {
  const { branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF, accounts } = useReportData();
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("acc_vouchers")
      .select("*, voucher_entries(*, chart_of_accounts:account_id(account_name, account_code))")
      .eq("voucher_type", voucherType)
      .gte("voucher_date", dateFrom)
      .lte("voucher_date", dateTo)
      .order("voucher_date", { ascending: true });
    if (branch !== "all") query = query.eq("branch_id", branch);

    const { data: vouchers } = await query;

    const result: any[] = [];
    (vouchers || []).forEach((v: any) => {
      (v.voucher_entries || []).forEach((e: any) => {
        result.push({
          id: e.id,
          voucher_date: v.voucher_date,
          voucher_number: v.voucher_number,
          account_name: (e.chart_of_accounts as any)?.account_name || "—",
          account_code: (e.chart_of_accounts as any)?.account_code || "",
          debit: Number(e.debit),
          credit: Number(e.credit),
          description: v.description || e.narration || "—",
          status: v.status,
        });
      });
    });
    setData(result);
    setLoading(false);
  };

  const columns = [
    { key: "voucher_date", label: "Date" }, { key: "voucher_number", label: "Voucher #" },
    { key: "account_name", label: "Account" },
    { key: "debit", label: "Debit", format: "currency" as const }, { key: "credit", label: "Credit", format: "currency" as const },
    { key: "description", label: "Description" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle={title} subtitle={`${dateFrom} to ${dateTo}`} />
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
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
              <TableHead>Date</TableHead><TableHead>Voucher #</TableHead><TableHead>Account</TableHead>
              <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
              <TableHead>Description</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Click "Generate" to load data</TableCell></TableRow>
              ) : data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.voucher_date}</TableCell>
                  <TableCell className="font-mono text-xs">{e.voucher_number}</TableCell>
                  <TableCell className="font-medium text-sm">{e.account_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.debit > 0 ? fc(e.debit) : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.credit > 0 ? fc(e.credit) : ""}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{e.description}</TableCell>
                </TableRow>
              ))}
              {data.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-right">Total</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(data.reduce((s, e) => s + e.debit, 0))}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(data.reduce((s, e) => s + e.credit, 0))}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
};

export const JournalVoucherReport = () => <VoucherTypeReport voucherType="journal" title="Journal Voucher Report" />;
export const PaymentVoucherReport = () => <VoucherTypeReport voucherType="payment" title="Payment Voucher Report" />;
export const ReceiptVoucherReport = () => <VoucherTypeReport voucherType="receipt" title="Receipt Voucher Report" />;
export const ContraVoucherReport = () => <VoucherTypeReport voucherType="contra" title="Contra Voucher Report" />;
