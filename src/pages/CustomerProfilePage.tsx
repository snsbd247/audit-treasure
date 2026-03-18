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
  ArrowLeft, User, DollarSign, FileText, CreditCard, Printer,
  Phone, Mail, MapPin, StickyNote, Plus, Trash2, TrendingUp, Receipt, RotateCcw, Wallet
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

const CustomerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fc } = useCurrency();
  const { isSuperAdmin, user } = useAuth();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payDateFrom, setPayDateFrom] = useState("");
  const [payDateTo, setPayDateTo] = useState("");
  const [newPayment, setNewPayment] = useState({ amount: "", payment_method: "cash", reference: "", notes: "", payment_date: new Date().toISOString().split("T")[0] });

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
    setInvoices(invs);
    setReturns(rets);
    setNotes((notesRes.data as any[]) || []);
    setPayments((payRes.data as any[]) || []);
    const invs = invRes.data || [];
    const rets = retRes.data || [];
    setInvoices(invs);
    setReturns(rets);
    setNotes((notesRes.data as any[]) || []);

    // Build combined ledger: invoices (debit) + returns (credit)
    const allTxns: Array<{ date: string; type: string; ref: string; dr: number; cr: number; id: string }> = [];

    invs.forEach((inv: any) => {
      allTxns.push({
        date: inv.invoice_date,
        type: "Sales Invoice",
        ref: inv.invoice_number,
        dr: Number(inv.net_amount || inv.total_amount || 0),
        cr: 0,
        id: inv.id,
      });
    });

    rets.forEach((r: any) => {
      allTxns.push({
        date: r.return_date,
        type: "Sales Return",
        ref: r.return_number,
        dr: 0,
        cr: Number(r.total_amount || 0),
        id: r.id,
      });
    });

    // Sort by date
    allTxns.sort((a, b) => a.date.localeCompare(b.date));

    // Apply date filters & running balance
    let runBal = 0;
    const ledgerRows: LedgerRow[] = allTxns
      .filter(t => {
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        return true;
      })
      .map(t => {
        runBal += t.dr - t.cr;
        return {
          id: t.id,
          date: t.date,
          type: t.type,
          reference: t.ref,
          debit: t.dr,
          credit: t.cr,
          balance: runBal,
        };
      });

    setLedger(ledgerRows);
    setLoading(false);
  }, [id, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addNote = async () => {
    if (!newNote.trim() || !id) return;
    const { error } = await supabase.from("party_notes" as any).insert({
      party_type: "customer",
      party_id: id,
      note: newNote.trim(),
      created_by: user?.id || null,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewNote("");
      fetchData();
    }
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("party_notes" as any).delete().eq("id", noteId);
    fetchData();
  };

  const totalSales = invoices.reduce((s, i) => s + Number(i.net_amount || i.total_amount || 0), 0);
  const totalReturns = returns.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const balanceDue = totalSales - totalReturns;

  const handlePrintLedger = () => {
    const printContent = document.getElementById("customer-ledger-print");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Customer Ledger - ${customer?.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        h2 { margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .right { text-align: right; }
        .mono { font-family: monospace; }
        .sub { color: #666; font-size: 11px; }
      </style></head><body>
      <h2>${customer?.name} — Ledger</h2>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <FileText className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Invoices</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{invoices.length}</p>
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
              <DollarSign className="w-4 h-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Balance Due</p>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${balanceDue > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {fc(Math.abs(balanceDue))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm"><User className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Overview</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs sm:text-sm"><Receipt className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Ledger</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm"><FileText className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Invoices</TabsTrigger>
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
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground font-medium">Net Balance</span>
                  <span className={`font-bold ${balanceDue > 0 ? "text-destructive" : "text-emerald-600"}`}>{fc(Math.abs(balanceDue))}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity */}
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(-5).reverse().map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm">{inv.invoice_date}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fc(Number(inv.net_amount || inv.total_amount || 0))}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "completed" || inv.status === "approved" ? "default" : "secondary"} className="text-xs">{inv.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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
                        {ledger.map(row => (
                          <TableRow key={row.id + row.type}>
                            <TableCell className="text-sm">{row.date}</TableCell>
                            <TableCell className="text-sm">
                              <span className={row.type === "Sales Return" ? "text-amber-600" : ""}>{row.type}</span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{row.reference}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.debit > 0 ? fc(row.debit) : ""}</TableCell>
                            <TableCell className="text-right tabular-nums text-amber-600">{row.credit > 0 ? fc(row.credit) : ""}</TableCell>
                            <TableCell className={`text-right tabular-nums font-medium ${row.balance < 0 ? "text-emerald-600" : ""}`}>
                              {fc(Math.abs(row.balance))} {row.balance < 0 ? "Cr" : "Dr"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals row */}
                        <TableRow className="bg-muted/50 font-medium">
                          <TableCell colSpan={3} className="text-right text-sm">Totals</TableCell>
                          <TableCell className="text-right tabular-nums">{fc(ledger.reduce((s, r) => s + r.debit, 0))}</TableCell>
                          <TableCell className="text-right tabular-nums text-amber-600">{fc(ledger.reduce((s, r) => s + r.credit, 0))}</TableCell>
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
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No invoices</TableCell></TableRow>
                    ) : invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm">{inv.invoice_date}</TableCell>
                        <TableCell className="text-right tabular-nums">{fc(Number(inv.total_amount || 0))}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{Number(inv.discount || 0) > 0 ? fc(Number(inv.discount)) : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fc(Number(inv.net_amount || inv.total_amount || 0))}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "completed" || inv.status === "approved" ? "default" : "secondary"} className="text-xs">{inv.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {invoices.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={4} className="text-right text-sm">Total</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{fc(totalSales)}</TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Returns section */}
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

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Add Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Write a note about this customer..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
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
