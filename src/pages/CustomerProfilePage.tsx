import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, User, DollarSign, FileText, CreditCard, Printer, Download,
  Phone, Mail, MapPin, StickyNote, Plus, Trash2, TrendingUp, Receipt, RotateCcw, Wallet, CheckCircle
} from "lucide-react";

interface LedgerRow {
  id: string;
  date: string;
  type: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface InvoiceDue {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total: number;
  paid: number;
  due: number;
  allocateInput: string;
}

const CustomerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fc } = useCurrency();
  const { isSuperAdmin, user } = useAuth();
  const { settings } = useCompanySettings();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payDateFrom, setPayDateFrom] = useState("");
  const [payDateTo, setPayDateTo] = useState("");
  const [newPayment, setNewPayment] = useState({ amount: "", payment_method: "cash", reference: "", notes: "", payment_date: new Date().toISOString().split("T")[0] });
  const [invoiceDues, setInvoiceDues] = useState<InvoiceDue[]>([]);
  const [showAllocation, setShowAllocation] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [custRes, invRes, retRes, notesRes, payRes] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("sales_invoices").select("*").eq("customer_id", id).order("invoice_date", { ascending: true }),
      supabase.from("sales_returns").select("*").eq("customer_id", id).order("return_date", { ascending: true }),
      supabase.from("party_notes" as any).select("*").eq("party_type", "customer").eq("party_id", id).order("created_at", { ascending: false }),
      supabase.from("party_payments" as any).select("*").eq("party_type", "customer").eq("party_id", id).order("payment_date", { ascending: false }),
    ]);

    setCustomer(custRes.data);
    const invs = invRes.data || [];
    const rets = retRes.data || [];
    const pays = (payRes.data as any[]) || [];
    setInvoices(invs);
    setReturns(rets);
    setNotes((notesRes.data as any[]) || []);
    setPayments(pays);

    // Fetch all allocations for this customer's payments
    const payIds = pays.map((p: any) => p.id);
    let allocs: any[] = [];
    if (payIds.length > 0) {
      const { data: allocData } = await supabase
        .from("payment_allocations" as any)
        .select("*")
        .in("payment_id", payIds);
      allocs = (allocData as any[]) || [];
    }
    setAllocations(allocs);

    // Build invoice dues
    const dueList: InvoiceDue[] = invs.map((inv: any) => {
      const invAmount = Number(inv.net_amount || inv.total_amount || 0);
      const paidForInv = allocs
        .filter((a: any) => a.invoice_id === inv.id && a.invoice_type === "sales_invoice")
        .reduce((s: number, a: any) => s + Number(a.allocated_amount || 0), 0);
      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        total: invAmount,
        paid: paidForInv,
        due: Math.max(0, invAmount - paidForInv),
        allocateInput: "",
      };
    });
    setInvoiceDues(dueList);

    // Build combined ledger
    const allTxns: Array<{ date: string; type: string; ref: string; dr: number; cr: number; id: string }> = [];
    invs.forEach((inv: any) => {
      allTxns.push({ date: inv.invoice_date, type: "Sales Invoice", ref: inv.invoice_number, dr: Number(inv.net_amount || inv.total_amount || 0), cr: 0, id: inv.id });
    });
    rets.forEach((r: any) => {
      allTxns.push({ date: r.return_date, type: "Sales Return", ref: r.return_number, dr: 0, cr: Number(r.total_amount || 0), id: r.id });
    });
    pays.forEach((p: any) => {
      allTxns.push({ date: p.payment_date, type: "Payment", ref: p.reference || p.payment_method, dr: 0, cr: Number(p.amount || 0), id: p.id });
    });
    allTxns.sort((a, b) => a.date.localeCompare(b.date));

    let runBal = 0;
    const ledgerRows: LedgerRow[] = allTxns
      .filter(t => {
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        return true;
      })
      .map(t => {
        runBal += t.dr - t.cr;
        return { id: t.id, date: t.date, type: t.type, reference: t.ref, debit: t.dr, credit: t.cr, balance: runBal };
      });

    setLedger(ledgerRows);
    setLoading(false);
  }, [id, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addNote = async () => {
    if (!newNote.trim() || !id) return;
    const { error } = await supabase.from("party_notes" as any).insert({ party_type: "customer", party_id: id, note: newNote.trim(), created_by: user?.id || null } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setNewNote(""); fetchData(); }
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("party_notes" as any).delete().eq("id", noteId);
    fetchData();
  };

  const totalSales = invoices.reduce((s, i) => s + Number(i.net_amount || i.total_amount || 0), 0);
  const totalReturns = returns.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const balanceDue = totalSales - totalReturns - totalPaid;
  const advanceBalance = balanceDue < 0 ? Math.abs(balanceDue) : 0;

  const filteredPayments = payments.filter(p => {
    if (payDateFrom && p.payment_date < payDateFrom) return false;
    if (payDateTo && p.payment_date > payDateTo) return false;
    return true;
  });

  // Allocation helpers
  const totalAllocInput = invoiceDues.reduce((s, d) => s + (Number(d.allocateInput) || 0), 0);
  const paymentAmount = Number(newPayment.amount) || 0;
  const unallocated = paymentAmount - totalAllocInput;

  const updateAllocInput = (invId: string, val: string) => {
    setInvoiceDues(prev => prev.map(d => {
      if (d.id !== invId) return d;
      const num = Number(val) || 0;
      if (num < 0) return d;
      if (num > d.due) return { ...d, allocateInput: String(d.due) };
      return { ...d, allocateInput: val };
    }));
  };

  const addPayment = async () => {
    if (!id || paymentAmount <= 0) return;

    // Validate allocations
    if (totalAllocInput > paymentAmount) {
      toast({ title: "Error", description: "Total allocation exceeds payment amount", variant: "destructive" });
      return;
    }

    // Insert payment
    const { data: payData, error } = await supabase.from("party_payments" as any).insert({
      party_type: "customer",
      party_id: id,
      payment_date: newPayment.payment_date,
      amount: paymentAmount,
      payment_method: newPayment.payment_method,
      reference: newPayment.reference || null,
      notes: newPayment.notes || null,
      created_by: user?.id || null,
    } as any).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Insert allocations
    const allocsToInsert = invoiceDues
      .filter(d => Number(d.allocateInput) > 0)
      .map(d => ({
        payment_id: (payData as any).id,
        invoice_type: "sales_invoice",
        invoice_id: d.id,
        allocated_amount: Number(d.allocateInput),
      }));

    if (allocsToInsert.length > 0) {
      await supabase.from("payment_allocations" as any).insert(allocsToInsert as any);
    }

    setNewPayment({ amount: "", payment_method: "cash", reference: "", notes: "", payment_date: new Date().toISOString().split("T")[0] });
    setShowAllocation(false);
    toast({ title: "Payment recorded with allocations" });
    fetchData();
  };

  const deletePayment = async (payId: string) => {
    // Allocations cascade-deleted via FK
    await supabase.from("party_payments" as any).delete().eq("id", payId);
    toast({ title: "Payment deleted" });
    fetchData();
  };

  const getPaymentAllocations = (payId: string) => {
    return allocations.filter((a: any) => a.payment_id === payId);
  };

  const getInvoiceStatus = (inv: any) => {
    const invAmount = Number(inv.net_amount || inv.total_amount || 0);
    const paidForInv = allocations
      .filter((a: any) => a.invoice_id === inv.id && a.invoice_type === "sales_invoice")
      .reduce((s: number, a: any) => s + Number(a.allocated_amount || 0), 0);
    if (paidForInv >= invAmount) return "paid";
    if (paidForInv > 0) return "partial";
    return "due";
  };

  const companyHeader = () => `
    <div style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;margin-bottom:16px;">
      ${settings?.company_logo_url ? `<img src="${settings.company_logo_url}" alt="Logo" style="height:48px;margin:0 auto 8px;display:block;">` : ""}
      <h1 style="font-size:18px;font-weight:700;margin-bottom:2px;">${settings?.company_name || "Company"}</h1>
      ${settings?.address ? `<p style="font-size:11px;color:#666;">${settings.address}</p>` : ""}
      <p style="font-size:11px;color:#666;">${[settings?.phone && `Phone: ${settings.phone}`, settings?.email && `Email: ${settings.email}`].filter(Boolean).join(" | ")}</p>
    </div>`;

  const printStyles = `
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 24px; font-size: 12px; color: #1a1a1a; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f0f0f0; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; }
    td { padding: 6px 10px; border: 1px solid #ddd; font-size: 12px; }
    .right { text-align: right; }
    .mono { font-family: monospace; font-size: 11px; }
    .sub { color: #666; font-size: 11px; }
    .doc-title { font-size: 14px; font-weight: 600; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; text-align: center; }
    .doc-info { display: flex; justify-content: space-between; margin-bottom: 16px; padding: 8px 12px; background: #f8f8f8; border-radius: 4px; }
    .doc-info .label { font-weight: 600; }
    .total-row { background: #f0f0f0; font-weight: 700; }
    .amount-big { font-size: 22px; font-weight: 700; margin: 16px 0; text-align: center; color: #166534; }
    .signatures { display: flex; justify-content: space-between; margin-top: 48px; }
    .sig-block { text-align: center; min-width: 140px; }
    .sig-line { border-top: 1px solid #666; padding-top: 4px; font-size: 11px; color: #666; }
    .timestamp { font-size: 10px; color: #999; text-align: center; margin-top: 20px; }
    @media print { body { margin: 0; } }`;

  const printFooter = () => `
    <div style="margin-top:36px;border-top:1px solid #ddd;padding-top:16px;">
      <div class="signatures">
        ${["Prepared By", "Checked By", "Authorized By"].map(l => `<div class="sig-block"><div class="sig-line">${l}</div></div>`).join("")}
      </div>
      <p class="timestamp">${settings?.company_name || "Company"} | Generated: ${new Date().toLocaleString()}</p>
    </div>`;

  const handlePrintPaymentReceipt = (pay: any) => {
    const payAllocs = getPaymentAllocations(pay.id);
    const allocRows = payAllocs.map((a: any) => {
      const inv = invoices.find(i => i.id === a.invoice_id);
      return `<tr><td class="mono">${inv?.invoice_number || "—"}</td><td>${inv?.invoice_date || ""}</td><td class="right">${fc(Number(a.allocated_amount))}</td></tr>`;
    }).join("");
    const totalAlloc = payAllocs.reduce((s: number, a: any) => s + Number(a.allocated_amount || 0), 0);
    const unallocatedAmt = Number(pay.amount) - totalAlloc;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Payment Receipt — ${pay.reference || pay.id}</title>
      <style>${printStyles}</style></head><body>
      ${companyHeader()}
      <div class="doc-title">Payment Receipt</div>
      <div class="doc-info">
        <div><span class="label">Receipt #:</span> ${pay.reference || pay.id}</div>
        <div><span class="label">Date:</span> ${pay.payment_date}</div>
        <div><span class="label">Customer:</span> ${customer?.name}</div>
      </div>
      <div class="amount-big">${fc(Number(pay.amount))}</div>
      <div class="doc-info">
        <div><span class="label">Method:</span> ${pay.payment_method}</div>
        <div><span class="label">Reference:</span> ${pay.reference || "—"}</div>
        ${pay.notes ? `<div><span class="label">Notes:</span> ${pay.notes}</div>` : ""}
      </div>
      ${payAllocs.length > 0 ? `
        <h3 style="font-size:13px;font-weight:600;margin:16px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px;">Payment Allocation</h3>
        <table><thead><tr><th>Invoice #</th><th>Date</th><th class="right">Allocated</th></tr></thead>
        <tbody>${allocRows}
          <tr class="total-row"><td colspan="2" class="right">Total Allocated</td><td class="right">${fc(totalAlloc)}</td></tr>
          ${unallocatedAmt > 0.01 ? `<tr><td colspan="2" class="right" style="color:#92400e;">Unallocated (Advance)</td><td class="right" style="color:#92400e;">${fc(unallocatedAmt)}</td></tr>` : ""}
        </tbody></table>
      ` : ""}
      <div style="margin-top:24px;text-align:center;font-size:12px;color:#555;">Thank you for your payment.</div>
      ${printFooter()}
      <script>setTimeout(function(){window.print();window.close();},300);</script>
      </body></html>
    `);
    win.document.close();
  };

  const handlePrintLedger = () => {
    const rows = ledger.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.type}</td>
        <td class="mono">${r.reference}</td>
        <td class="right">${r.debit > 0 ? fc(r.debit) : "—"}</td>
        <td class="right">${r.credit > 0 ? fc(r.credit) : "—"}</td>
        <td class="right" style="font-weight:600;">${fc(Math.abs(r.balance))} ${r.balance < 0 ? "Cr" : "Dr"}</td>
      </tr>
    `).join("");
    const totalDr = ledger.reduce((s, r) => s + r.debit, 0);
    const totalCr = ledger.reduce((s, r) => s + r.credit, 0);
    const closingBal = ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Customer Ledger — ${customer?.name}</title>
      <style>${printStyles}</style></head><body>
      ${companyHeader()}
      <div class="doc-title">Customer Ledger</div>
      <div class="doc-info">
        <div><span class="label">Customer:</span> ${customer?.name}</div>
        ${dateFrom ? `<div><span class="label">From:</span> ${dateFrom}</div>` : ""}
        ${dateTo ? `<div><span class="label">To:</span> ${dateTo}</div>` : ""}
        <div><span class="label">Entries:</span> ${ledger.length}</div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Reference</th><th class="right">Debit</th><th class="right">Credit</th><th class="right">Balance</th></tr></thead>
        <tbody>
          <tr style="background:#f8f8f8;font-weight:600;"><td colspan="5">Opening Balance</td><td class="right">0.00</td></tr>
          ${rows}
          <tr class="total-row">
            <td colspan="3" class="right">Closing Balance</td>
            <td class="right">${fc(totalDr)}</td>
            <td class="right">${fc(totalCr)}</td>
            <td class="right" style="font-size:13px;color:${closingBal >= 0 ? "#991b1b" : "#166534"};">${fc(Math.abs(closingBal))} ${closingBal < 0 ? "Cr" : "Dr"}</td>
          </tr>
        </tbody>
      </table>
      ${printFooter()}
      <script>setTimeout(function(){window.print();window.close();},300);</script>
      </body></html>
    `);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="page-container">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!customer) return <div className="p-6 text-center text-muted-foreground">Customer not found</div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{customer.name}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
            {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>}
            {customer.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{customer.address}</span>}
          </div>
        </div>
        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
          {customer.status}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Total Sales</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{fc(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Returns</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-600">{fc(totalReturns)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Total Paid</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-600">{fc(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Balance Due</p>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${balanceDue > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {fc(Math.abs(balanceDue))}
              {advanceBalance > 0 && <span className="text-xs font-normal ml-1">(Advance)</span>}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Invoices</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{invoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm"><User className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Overview</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs sm:text-sm"><Receipt className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Ledger</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm"><FileText className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Invoices</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm"><Wallet className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Payments</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm"><StickyNote className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{customer.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{customer.phone || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{customer.email || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right max-w-[200px]">{customer.address || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                  <Badge variant={customer.status === "active" ? "default" : "secondary"} className="text-xs">{customer.status}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Financial Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Invoices</span><span className="font-medium">{invoices.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Sales</span><span className="font-medium">{fc(totalSales)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Returns</span><span className="text-amber-600">{fc(totalReturns)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="text-emerald-600">{fc(totalPaid)}</span></div>
                {advanceBalance > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Advance Balance</span><span className="text-blue-600 font-medium">{fc(advanceBalance)}</span></div>
                )}
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground font-medium">Net Balance</span>
                  <span className={`font-bold ${balanceDue > 0 ? "text-destructive" : "text-emerald-600"}`}>{fc(Math.abs(balanceDue))}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Invoices</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(-5).reverse().map(inv => {
                      const status = getInvoiceStatus(inv);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                          <TableCell className="text-sm">{inv.invoice_date}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{fc(Number(inv.net_amount || inv.total_amount || 0))}</TableCell>
                          <TableCell>
                            <Badge variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"} className="text-xs">
                              {status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {invoices.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No invoices yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger" className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-36" />
            </div>
            {(dateFrom || dateTo) && (
              <Button size="sm" variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>
            )}
            <Button size="sm" variant="outline" onClick={handlePrintLedger}>
              <Printer className="w-3.5 h-3.5 mr-1" />Print
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto" id="customer-ledger-print">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>
                    ) : (
                      <>
                        {ledger.map((row, idx) => (
                          <TableRow key={row.id + row.type + idx}>
                            <TableCell className="text-sm">{row.date}</TableCell>
                            <TableCell className="text-sm">
                              <span className={row.type === "Sales Return" ? "text-amber-600" : row.type === "Payment" ? "text-emerald-600" : ""}>{row.type}</span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{row.reference}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.debit > 0 ? fc(row.debit) : ""}</TableCell>
                            <TableCell className="text-right tabular-nums text-emerald-600">{row.credit > 0 ? fc(row.credit) : ""}</TableCell>
                            <TableCell className={`text-right tabular-nums font-medium ${row.balance < 0 ? "text-emerald-600" : ""}`}>
                              {fc(Math.abs(row.balance))} {row.balance < 0 ? "Cr" : "Dr"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-medium">
                          <TableCell colSpan={3} className="text-right text-sm">Totals</TableCell>
                          <TableCell className="text-right tabular-nums">{fc(ledger.reduce((s, r) => s + r.debit, 0))}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{fc(ledger.reduce((s, r) => s + r.credit, 0))}</TableCell>
                          <TableCell className="text-right tabular-nums font-bold">
                            {ledger.length > 0 ? `${fc(Math.abs(ledger[ledger.length - 1].balance))} ${ledger[ledger.length - 1].balance < 0 ? "Cr" : "Dr"}` : ""}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-3">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No invoices</TableCell></TableRow>
                    ) : invoices.map(inv => {
                      const status = getInvoiceStatus(inv);
                      const invDue = invoiceDues.find(d => d.id === inv.id);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                          <TableCell className="text-sm">{inv.invoice_date}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{fc(Number(inv.net_amount || inv.total_amount || 0))}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{fc(invDue?.paid || 0)}</TableCell>
                          <TableCell className={`text-right tabular-nums font-medium ${(invDue?.due || 0) > 0 ? "text-destructive" : ""}`}>{fc(invDue?.due || 0)}</TableCell>
                          <TableCell>
                            <Badge variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"} className="text-xs">
                              {status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {invoices.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={2} className="text-right text-sm">Total</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{fc(totalSales)}</TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600 font-bold">{fc(invoiceDues.reduce((s, d) => s + d.paid, 0))}</TableCell>
                        <TableCell className="text-right tabular-nums text-destructive font-bold">{fc(invoiceDues.reduce((s, d) => s + d.due, 0))}</TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {returns.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" />Sales Returns</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Return #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returns.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.return_number}</TableCell>
                          <TableCell className="text-sm">{r.return_date}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-amber-600">{fc(Number(r.total_amount || 0))}</TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{r.reason || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "approved" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-3">
          {/* Add Payment Form with Allocation */}
          {isSuperAdmin && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Record Payment</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={newPayment.payment_date} onChange={e => setNewPayment(p => ({ ...p, payment_date: e.target.value }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" value={newPayment.amount} onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Method</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={newPayment.payment_method} onChange={e => setNewPayment(p => ({ ...p, payment_method: e.target.value }))}>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="mobile">Mobile Payment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reference</Label>
                    <Input placeholder="Ref # / Cheque #" value={newPayment.reference} onChange={e => setNewPayment(p => ({ ...p, reference: e.target.value }))} className="h-9" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Notes</Label>
                    <Input placeholder="Payment notes..." value={newPayment.notes} onChange={e => setNewPayment(p => ({ ...p, notes: e.target.value }))} className="h-9" />
                  </div>
                </div>

                {/* Invoice Allocation Toggle */}
                {paymentAmount > 0 && invoiceDues.some(d => d.due > 0) && (
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => setShowAllocation(!showAllocation)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      {showAllocation ? "Hide" : "Allocate to Invoices"}
                    </Button>
                  </div>
                )}

                {/* Invoice Allocation Table */}
                {showAllocation && paymentAmount > 0 && (
                  <div className="mt-3 border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Due</TableHead>
                          <TableHead className="text-right w-32">Allocate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceDues.filter(d => d.due > 0).map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="font-mono text-xs">{d.invoice_number}</TableCell>
                            <TableCell className="text-sm">{d.invoice_date}</TableCell>
                            <TableCell className="text-right tabular-nums">{fc(d.total)}</TableCell>
                            <TableCell className="text-right tabular-nums text-emerald-600">{fc(d.paid)}</TableCell>
                            <TableCell className="text-right tabular-nums text-destructive font-medium">{fc(d.due)}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number" min="0" max={d.due} step="0.01"
                                value={d.allocateInput}
                                onChange={e => updateAllocInput(d.id, e.target.value)}
                                className="h-8 w-28 text-right ml-auto"
                                placeholder="0.00"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-medium">
                          <TableCell colSpan={5} className="text-right text-sm">Allocated / Unallocated</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {fc(totalAllocInput)} / <span className={unallocated < 0 ? "text-destructive" : "text-muted-foreground"}>{fc(unallocated)}</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    {unallocated > 0 && (
                      <p className="text-xs text-muted-foreground px-3 py-2">
                        {fc(unallocated)} will be stored as advance payment.
                      </p>
                    )}
                  </div>
                )}

                <Button size="sm" className="mt-3" onClick={addPayment} disabled={paymentAmount <= 0 || totalAllocInput > paymentAmount}>
                  <Plus className="w-3.5 h-3.5 mr-1" />Record Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Filter */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={payDateFrom} onChange={e => setPayDateFrom(e.target.value)} className="h-9 w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={payDateTo} onChange={e => setPayDateTo(e.target.value)} className="h-9 w-36" />
            </div>
            {(payDateFrom || payDateTo) && (
              <Button size="sm" variant="ghost" onClick={() => { setPayDateFrom(""); setPayDateTo(""); }}>Clear</Button>
            )}
          </div>

          {/* Payments Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payments recorded</TableCell></TableRow>
                    ) : (
                      <>
                        {filteredPayments.map(pay => {
                          const payAllocs = getPaymentAllocations(pay.id);
                          const totalAlloc = payAllocs.reduce((s: number, a: any) => s + Number(a.allocated_amount || 0), 0);
                          return (
                            <TableRow key={pay.id}>
                              <TableCell className="text-sm">{pay.payment_date}</TableCell>
                              <TableCell className="text-right tabular-nums font-medium text-emerald-600">{fc(Number(pay.amount))}</TableCell>
                              <TableCell className="text-sm capitalize">{pay.payment_method}</TableCell>
                              <TableCell className="font-mono text-xs">{pay.reference || "—"}</TableCell>
                              <TableCell className="text-sm">
                                {totalAlloc > 0 ? (
                                  <span className="text-xs">{fc(totalAlloc)} ({payAllocs.length} inv)</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Unallocated</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">{pay.notes || "—"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePrintPaymentReceipt(pay)}>
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
                                  {isSuperAdmin && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deletePayment(pay.id)}>
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted/50 font-medium">
                          <TableCell className="text-right text-sm">Total</TableCell>
                          <TableCell className="text-right tabular-nums font-bold text-emerald-600">{fc(filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0))}</TableCell>
                          <TableCell colSpan={5} />
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Add Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Write a note about this customer..." value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} className="resize-none" />
              <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add Note
              </Button>
            </CardContent>
          </Card>
          {notes.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No notes yet</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n: any) => (
                <Card key={n.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      {isSuperAdmin && (
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => deleteNote(n.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerProfilePage;
