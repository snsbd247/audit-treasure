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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, DollarSign, FileText, CreditCard, Printer } from "lucide-react";

const CustomerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fc } = useCurrency();
  const { isSuperAdmin } = useAuth();

  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [custRes, invRes] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("sales_invoices").select("*").eq("customer_id", id).order("invoice_date", { ascending: true }),
    ]);

    setCustomer(custRes.data);
    const invs = invRes.data || [];
    setInvoices(invs);

    // Build ledger from invoices
    let runBal = 0;
    const ledgerRows = invs
      .filter((inv: any) => {
        if (dateFrom && inv.invoice_date < dateFrom) return false;
        if (dateTo && inv.invoice_date > dateTo) return false;
        return true;
      })
      .map((inv: any) => {
        const dr = Number(inv.net_amount || inv.total_amount || 0);
        runBal += dr;
        return {
          id: inv.id,
          date: inv.invoice_date,
          type: "Sales Invoice",
          reference: inv.invoice_number,
          debit: dr,
          credit: 0,
          balance: runBal,
        };
      });
    setLedger(ledgerRows);
    setLoading(false);
  }, [id, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalSales = invoices.reduce((s, i) => s + Number(i.net_amount || i.total_amount || 0), 0);
  const totalDue = totalSales; // Simplified — no payment tracking table yet

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!customer) return <div className="p-6 text-center text-muted-foreground">Customer not found</div>;

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{customer.name}</h1>
          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
            {customer.phone && <span>{customer.phone}</span>}
            {customer.email && <span>• {customer.email}</span>}
            {customer.address && <span>• {customer.address}</span>}
          </div>
        </div>
        <Badge variant={customer.status === "active" || customer.status === "approved" ? "default" : "secondary"}>
          {customer.status}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1">{fc(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Invoices</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1">{fc(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Balance Due</p>
            <p className="text-lg sm:text-xl font-bold text-destructive mt-1">{fc(totalDue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ledger">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="ledger" className="text-xs sm:text-sm">Ledger</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm">Invoices</TabsTrigger>
        </TabsList>

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
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-1" />Print
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
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
                    ) : ledger.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm">{row.date}</TableCell>
                        <TableCell className="text-sm">{row.type}</TableCell>
                        <TableCell className="font-mono text-xs">{row.reference}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.debit > 0 ? fc(row.debit) : ""}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.credit > 0 ? fc(row.credit) : ""}</TableCell>
                        <TableCell className={`text-right tabular-nums font-medium ${row.balance < 0 ? "text-destructive" : ""}`}>
                          {fc(Math.abs(row.balance))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
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
                    {invoices.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No invoices</TableCell></TableRow>
                    ) : invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm">{inv.invoice_date}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fc(Number(inv.net_amount || inv.total_amount || 0))}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "completed" || inv.status === "approved" ? "default" : "secondary"} className="text-xs">
                            {inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerProfilePage;
