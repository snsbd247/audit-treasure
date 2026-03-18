import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
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
  ArrowLeft, User, DollarSign, FileText, Printer,
  Phone, Mail, MapPin, StickyNote, Plus, Trash2, TrendingDown, Receipt, RotateCcw, Wallet, CheckCircle
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

interface PurchaseDue {
  id: string;
  purchase_number: string;
  purchase_date: string;
  total: number;
  paid: number;
  due: number;
  allocateInput: string;
}

const SupplierProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fc } = useCurrency();
  const { isSuperAdmin, user } = useAuth();
  const { toast } = useToast();

  const [supplier, setSupplier] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
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
  const [purchaseDues, setPurchaseDues] = useState<PurchaseDue[]>([]);
  const [showAllocation, setShowAllocation] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [supRes, purRes, retRes, notesRes, payRes] = await Promise.all([
      supabase.from("suppliers").select("*").eq("id", id).single(),
      supabase.from("purchases").select("*").eq("supplier_id", id).order("purchase_date", { ascending: true }),
      supabase.from("purchase_returns").select("*").eq("supplier_id", id).order("return_date", { ascending: true }),
      supabase.from("party_notes" as any).select("*").eq("party_type", "supplier").eq("party_id", id).order("created_at", { ascending: false }),
      supabase.from("party_payments" as any).select("*").eq("party_type", "supplier").eq("party_id", id).order("payment_date", { ascending: false }),
    ]);

    setSupplier(supRes.data);
    const purs = purRes.data || [];
    const rets = retRes.data || [];
    const pays = (payRes.data as any[]) || [];
    setPurchases(purs);
    setReturns(rets);
    setNotes((notesRes.data as any[]) || []);
    setPayments(pays);

    // Fetch allocations
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

    // Build purchase dues
    const dueList: PurchaseDue[] = purs.map((p: any) => {
      const purAmount = Number(p.total_amount || 0);
      const paidForPur = allocs
        .filter((a: any) => a.invoice_id === p.id && a.invoice_type === "purchase")
        .reduce((s: number, a: any) => s + Number(a.allocated_amount || 0), 0);
      return {
        id: p.id,
        purchase_number: p.purchase_number,
        purchase_date: p.purchase_date,
        total: purAmount,
        paid: paidForPur,
        due: Math.max(0, purAmount - paidForPur),
        allocateInput: "",
      };
    });
    setPurchaseDues(dueList);

    // Build combined ledger
    const allTxns: Array<{ date: string; type: string; ref: string; dr: number; cr: number; id: string }> = [];
    purs.forEach((p: any) => {
      allTxns.push({ date: p.purchase_date, type: "Purchase", ref: p.purchase_number, dr: 0, cr: Number(p.total_amount || 0), id: p.id });
    });
    rets.forEach((r: any) => {
      allTxns.push({ date: r.return_date, type: "Purchase Return", ref: r.return_number, dr: Number(r.total_amount || 0), cr: 0, id: r.id });
    });
    pays.forEach((p: any) => {
      allTxns.push({ date: p.payment_date, type: "Payment", ref: p.reference || p.payment_method, dr: Number(p.amount || 0), cr: 0, id: p.id });
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
        runBal += t.cr - t.dr;
        return { id: t.id, date: t.date, type: t.type, reference: t.ref, debit: t.dr, credit: t.cr, balance: runBal };
      });

    setLedger(ledgerRows);
    setLoading(false);
  }, [id, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addNote = async () => {
    if (!newNote.trim() || !id) return;
    const { error } = await supabase.from("party_notes" as any).insert({ party_type: "supplier", party_id: id, note: newNote.trim(), created_by: user?.id || null } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setNewNote(""); fetchData(); }
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("party_notes" as any).delete().eq("id", noteId);
    fetchData();
  };

  const totalPurchases = purchases.reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const totalReturns = returns.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const balanceDue = totalPurchases - totalReturns - totalPaid;
  const advanceBalance = balanceDue < 0 ? Math.abs(balanceDue) : 0;

  const filteredPayments = payments.filter(p => {
    if (payDateFrom && p.payment_date < payDateFrom) return false;
    if (payDateTo && p.payment_date > payDateTo) return false;
    return true;
  });

  const totalAllocInput = purchaseDues.reduce((s, d) => s + (Number(d.allocateInput) || 0), 0);
  const paymentAmount = Number(newPayment.amount) || 0;
  const unallocated = paymentAmount - totalAllocInput;

  const updateAllocInput = (purId: string, val: string) => {
    setPurchaseDues(prev => prev.map(d => {
      if (d.id !== purId) return d;
      const num = Number(val) || 0;
      if (num < 0) return d;
      if (num > d.due) return { ...d, allocateInput: String(d.due) };
      return { ...d, allocateInput: val };
    }));
  };

  const addPayment = async () => {
    if (!id || paymentAmount <= 0) return;
    if (totalAllocInput > paymentAmount) {
      toast({ title: "Error", description: "Total allocation exceeds payment amount", variant: "destructive" });
      return;
    }

    const { data: payData, error } = await supabase.from("party_payments" as any).insert({
      party_type: "supplier", party_id: id, payment_date: newPayment.payment_date,
      amount: paymentAmount, payment_method: newPayment.payment_method,
      reference: newPayment.reference || null, notes: newPayment.notes || null, created_by: user?.id || null,
    } as any).select().single();

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    const allocsToInsert = purchaseDues
      .filter(d => Number(d.allocateInput) > 0)
      .map(d => ({ payment_id: (payData as any).id, invoice_type: "purchase", invoice_id: d.id, allocated_amount: Number(d.allocateInput) }));

    if (allocsToInsert.length > 0) {
      await supabase.from("payment_allocations" as any).insert(allocsToInsert as any);
    }

    setNewPayment({ amount: "", payment_method: "cash", reference: "", notes: "", payment_date: new Date().toISOString().split("T")[0] });
    setShowAllocation(false);
    toast({ title: "Payment recorded with allocations" });
    fetchData();
  };

  const deletePayment = async (payId: string) => {
    await supabase.from("party_payments" as any).delete().eq("id", payId);
    toast({ title: "Payment deleted" });
    fetchData();
  };

  const getPaymentAllocations = (payId: string) => allocations.filter((a: any) => a.payment_id === payId);

  const getPurchaseStatus = (pur: any) => {
    const purAmount = Number(pur.total_amount || 0);
    const paidForPur = allocations
      .filter((a: any) => a.invoice_id === pur.id && a.invoice_type === "purchase")
      .reduce((s: number, a: any) => s + Number(a.allocated_amount || 0), 0);
    if (paidForPur >= purAmount) return "paid";
    if (paidForPur > 0) return "partial";
    return "due";
  };

  const handlePrintPaymentReceipt = (pay: any) => {
    const payAllocs = getPaymentAllocations(pay.id);
    const allocRows = payAllocs.map((a: any) => {
      const pur = purchases.find(p => p.id === a.invoice_id);
      return `<tr><td>${pur?.purchase_number || "—"}</td><td>${pur?.purchase_date || ""}</td><td style="text-align:right">${fc(Number(a.allocated_amount))}</td></tr>`;
    }).join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Payment Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; font-size: 13px; }
        h2 { margin-bottom: 5px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; } .val { font-weight: 600; }
        .amount { font-size: 22px; font-weight: 700; margin: 20px 0; text-align: center; }
        .sub { color: #888; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 12px; }
        th { background: #f5f5f5; }
      </style></head><body>
      <h2>Payment Receipt</h2>
      <p class="sub">Supplier: ${supplier?.name}</p>
      <hr/>
      <div class="amount">${fc(Number(pay.amount))}</div>
      <div class="row"><span class="label">Date</span><span class="val">${pay.payment_date}</span></div>
      <div class="row"><span class="label">Method</span><span class="val">${pay.payment_method}</span></div>
      <div class="row"><span class="label">Reference</span><span class="val">${pay.reference || "—"}</span></div>
      <div class="row"><span class="label">Notes</span><span class="val">${pay.notes || "—"}</span></div>
      ${payAllocs.length > 0 ? `
        <h3 style="margin-top:20px;">Purchase Allocations</h3>
        <table><thead><tr><th>Purchase #</th><th>Date</th><th style="text-align:right">Allocated</th></tr></thead>
        <tbody>${allocRows}</tbody></table>
      ` : ""}
      <br/><p class="sub">Printed: ${new Date().toLocaleString()}</p>
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  const handlePrintLedger = () => {
    const printContent = document.getElementById("supplier-ledger-print");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Supplier Ledger - ${supplier?.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        h2 { margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .sub { color: #666; font-size: 11px; }
      </style></head><body>
      <h2>${supplier?.name} — Ledger</h2>
      <p class="sub">${dateFrom ? `From: ${dateFrom}` : ""} ${dateTo ? `To: ${dateTo}` : ""} ${!dateFrom && !dateTo ? "All dates" : ""}</p>
      ${printContent.innerHTML}
      <script>window.print(); window.close();</script>
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

  if (!supplier) return <div className="p-6 text-center text-muted-foreground">Supplier not found</div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/suppliers")} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{supplier.name}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            {supplier.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{supplier.phone}</span>}
            {supplier.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{supplier.email}</span>}
            {supplier.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{supplier.address}</span>}
          </div>
        </div>
        <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
          {supplier.status}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Total Purchases</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{fc(totalPurchases)}</p>
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
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{purchases.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm"><User className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Overview</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs sm:text-sm"><Receipt className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Ledger</TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs sm:text-sm"><FileText className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Purchases</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm"><Wallet className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Payments</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm"><StickyNote className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{supplier.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{supplier.phone || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{supplier.email || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right max-w-[200px]">{supplier.address || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                  <Badge variant={supplier.status === "active" ? "default" : "secondary"} className="text-xs">{supplier.status}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Financial Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-medium">{purchases.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Purchases</span><span className="font-medium">{fc(totalPurchases)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Returns</span><span className="text-amber-600">{fc(totalReturns)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="text-emerald-600">{fc(totalPaid)}</span></div>
                {advanceBalance > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Advance Balance</span><span className="text-blue-600 font-medium">{fc(advanceBalance)}</span></div>
                )}
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground font-medium">Net Payable</span>
                  <span className={`font-bold ${balanceDue > 0 ? "text-destructive" : "text-emerald-600"}`}>{fc(Math.abs(balanceDue))}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Purchases</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.slice(-5).reverse().map(p => {
                      const status = getPurchaseStatus(p);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.purchase_number}</TableCell>
                          <TableCell className="text-sm">{p.purchase_date}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{fc(Number(p.total_amount || 0))}</TableCell>
                          <TableCell>
                            <Badge variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"} className="text-xs">{status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {purchases.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No purchases yet</TableCell></TableRow>
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
              <div className="overflow-x-auto" id="supplier-ledger-print">
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
                              <span className={row.type === "Purchase Return" ? "text-amber-600" : row.type === "Payment" ? "text-emerald-600" : ""}>{row.type}</span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{row.reference}</TableCell>
                            <TableCell className="text-right tabular-nums text-emerald-600">{row.debit > 0 ? fc(row.debit) : ""}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.credit > 0 ? fc(row.credit) : ""}</TableCell>
                            <TableCell className={`text-right tabular-nums font-medium ${row.balance < 0 ? "text-amber-600" : ""}`}>
                              {fc(Math.abs(row.balance))} {row.balance > 0 ? "Cr" : "Dr"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-medium">
                          <TableCell colSpan={3} className="text-right text-sm">Totals</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{fc(ledger.reduce((s, r) => s + r.debit, 0))}</TableCell>
                          <TableCell className="text-right tabular-nums">{fc(ledger.reduce((s, r) => s + r.credit, 0))}</TableCell>
                          <TableCell className="text-right tabular-nums font-bold">
                            {ledger.length > 0 ? `${fc(Math.abs(ledger[ledger.length - 1].balance))} ${ledger[ledger.length - 1].balance > 0 ? "Cr" : "Dr"}` : ""}
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

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-3">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No purchases</TableCell></TableRow>
                    ) : purchases.map(p => {
                      const status = getPurchaseStatus(p);
                      const purDue = purchaseDues.find(d => d.id === p.id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.purchase_number}</TableCell>
                          <TableCell className="text-sm">{p.purchase_date}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{fc(Number(p.total_amount || 0))}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{fc(purDue?.paid || 0)}</TableCell>
                          <TableCell className={`text-right tabular-nums font-medium ${(purDue?.due || 0) > 0 ? "text-destructive" : ""}`}>{fc(purDue?.due || 0)}</TableCell>
                          <TableCell>
                            <Badge variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"} className="text-xs">{status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {purchases.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={2} className="text-right text-sm">Total</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{fc(totalPurchases)}</TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600 font-bold">{fc(purchaseDues.reduce((s, d) => s + d.paid, 0))}</TableCell>
                        <TableCell className="text-right tabular-nums text-destructive font-bold">{fc(purchaseDues.reduce((s, d) => s + d.due, 0))}</TableCell>
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
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" />Purchase Returns</CardTitle></CardHeader>
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

                {paymentAmount > 0 && purchaseDues.some(d => d.due > 0) && (
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => setShowAllocation(!showAllocation)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      {showAllocation ? "Hide" : "Allocate to Purchases"}
                    </Button>
                  </div>
                )}

                {showAllocation && paymentAmount > 0 && (
                  <div className="mt-3 border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Purchase #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Due</TableHead>
                          <TableHead className="text-right w-32">Allocate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseDues.filter(d => d.due > 0).map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="font-mono text-xs">{d.purchase_number}</TableCell>
                            <TableCell className="text-sm">{d.purchase_date}</TableCell>
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
                                  <span className="text-xs">{fc(totalAlloc)} ({payAllocs.length} pur)</span>
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
              <Textarea placeholder="Write a note about this supplier..." value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} className="resize-none" />
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

export default SupplierProfilePage;
