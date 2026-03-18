import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { printReport } from "@/lib/report-utils";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, User } from "lucide-react";
import * as XLSX from "xlsx";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const CustomerStatementPage = () => {
  const { fc } = useCurrency();
  const { settings } = useCompanySettings();
  const printRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const [dateFrom, setDateFrom] = useState(`${now.getFullYear()}-01-01`);
  const [dateTo, setDateTo] = useState(now.toISOString().slice(0, 10));
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    supabase.from("customers").select("id, name, phone, email, address").order("name").then(({ data }) => {
      setCustomers((data || []) as Customer[]);
    });
  }, []);

  const generateStatement = useCallback(async () => {
    if (selectedCustomer === "all") return;
    setLoading(true);

    const cust = customers.find(c => c.id === selectedCustomer) || null;
    setCustomer(cust);

    // Fetch invoices
    const { data: invoices } = await supabase
      .from("sales_invoices")
      .select("id, invoice_number, invoice_date, net_amount, total_amount, discount")
      .eq("customer_id", selectedCustomer)
      .gte("invoice_date", dateFrom)
      .lte("invoice_date", dateTo)
      .order("invoice_date");

    // Fetch payments
    const { data: payments } = await supabase
      .from("party_payments")
      .select("id, payment_date, amount, payment_method, reference")
      .eq("party_id", selectedCustomer)
      .eq("party_type", "customer")
      .gte("payment_date", dateFrom)
      .lte("payment_date", dateTo)
      .order("payment_date");

    // Fetch sales returns
    const { data: returns } = await supabase
      .from("sales_returns")
      .select("id, return_number, return_date, total_amount")
      .eq("customer_id", selectedCustomer)
      .gte("return_date", dateFrom)
      .lte("return_date", dateTo)
      .order("return_date");

    // Combine and sort by date
    const all: { date: string; type: string; ref: string; desc: string; debit: number; credit: number; id: string }[] = [];

    (invoices || []).forEach(inv => {
      all.push({ date: inv.invoice_date, type: "Invoice", ref: inv.invoice_number, desc: `Sales Invoice ${inv.invoice_number}`, debit: Number(inv.net_amount || inv.total_amount), credit: 0, id: inv.id });
    });

    (payments || []).forEach(pay => {
      all.push({ date: pay.payment_date, type: "Payment", ref: pay.reference || pay.id.slice(0, 8), desc: `Payment received (${pay.payment_method})`, debit: 0, credit: Number(pay.amount), id: pay.id });
    });

    (returns || []).forEach(ret => {
      all.push({ date: ret.return_date, type: "Return", ref: ret.return_number, desc: `Sales Return ${ret.return_number}`, debit: 0, credit: Number(ret.total_amount), id: ret.id });
    });

    all.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance
    let balance = 0;
    const ledger: LedgerEntry[] = all.map(e => {
      balance += e.debit - e.credit;
      return { id: e.id, date: e.date, type: e.type, reference: e.ref, description: e.desc, debit: e.debit, credit: e.credit, balance };
    });

    setEntries(ledger);
    setLoading(false);
  }, [selectedCustomer, dateFrom, dateTo, customers]);

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;

  const handlePrint = () => {
    printReport(printRef, `Customer Statement — ${customer?.name || ""}`, settings?.company_name, {
      address: settings?.address || undefined,
      phone: settings?.phone || undefined,
      email: settings?.email || undefined,
    });
  };

  const handleExcel = () => {
    const headers = ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"];
    const rows = entries.map(e => [e.date, e.type, e.reference, e.description, e.debit, e.credit, e.balance]);
    rows.push(["", "", "", "Total", totalDebit, totalCredit, closingBalance]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement");
    XLSX.writeFile(wb, `Customer_Statement_${customer?.name || "report"}.xlsx`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="Customer Statement" />
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Customer Statement</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="w-56 h-9 text-sm"><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">— Select Customer —</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ReportFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onSearch={generateStatement}
            onPrint={handlePrint}
            onExportExcel={handleExcel}
            onExportPDF={handlePrint}
            loading={loading}
          />
        </CardContent>
      </Card>

      {customer && entries.length > 0 && (
        <div ref={printRef}>
          {/* Customer Info */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{customer.name}</span>
              </div>
              {customer.phone && <p className="text-xs text-muted-foreground">Phone: {customer.phone}</p>}
              {customer.email && <p className="text-xs text-muted-foreground">Email: {customer.email}</p>}
              {customer.address && <p className="text-xs text-muted-foreground">Address: {customer.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Period: {dateFrom} to {dateTo}</p>
              <p className="text-sm font-semibold text-foreground mt-1">Closing Balance: <span className={closingBalance >= 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}>{fc(Math.abs(closingBalance))}</span> {closingBalance >= 0 ? "Dr" : "Cr"}</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs w-24">Date</TableHead>
                  <TableHead className="text-xs w-20">Type</TableHead>
                  <TableHead className="text-xs w-28">Reference</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right w-28">Debit</TableHead>
                  <TableHead className="text-xs text-right w-28">Credit</TableHead>
                  <TableHead className="text-xs text-right w-28">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs tabular-nums">{e.date}</TableCell>
                    <TableCell>
                      <Badge variant={e.type === "Invoice" ? "default" : e.type === "Payment" ? "secondary" : "outline"} className="text-[10px]">{e.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{e.reference}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.description}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{e.debit > 0 ? fc(e.debit) : "—"}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{e.credit > 0 ? fc(e.credit) : "—"}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-medium">{fc(Math.abs(e.balance))} {e.balance >= 0 ? "Dr" : "Cr"}</TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4} className="text-xs font-bold">Total / Closing Balance</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-bold">{fc(totalDebit)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-bold">{fc(totalCredit)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-bold">{fc(Math.abs(closingBalance))} {closingBalance >= 0 ? "Dr" : "Cr"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-between items-end">
            <div className="text-xs text-muted-foreground">
              <p>Generated: {new Date().toLocaleString()}</p>
              <p>This is a system-generated statement.</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-foreground/30 mt-8 pt-1">
                <p className="text-xs text-muted-foreground">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer !== "all" && entries.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No transactions found for the selected period. Click "Generate" to load data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerStatementPage;
