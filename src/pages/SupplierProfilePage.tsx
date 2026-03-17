import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";

const SupplierProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fc } = useCurrency();

  const [supplier, setSupplier] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [supRes, purRes] = await Promise.all([
      supabase.from("suppliers").select("*").eq("id", id).single(),
      supabase.from("purchases").select("*").eq("supplier_id", id).order("purchase_date", { ascending: true }),
    ]);

    setSupplier(supRes.data);
    const purs = purRes.data || [];
    setPurchases(purs);

    let runBal = 0;
    const ledgerRows = purs
      .filter((p: any) => {
        if (dateFrom && p.purchase_date < dateFrom) return false;
        if (dateTo && p.purchase_date > dateTo) return false;
        return true;
      })
      .map((p: any) => {
        const cr = Number(p.total_amount || 0);
        runBal += cr;
        return {
          id: p.id,
          date: p.purchase_date,
          type: "Purchase",
          reference: p.purchase_number,
          debit: 0,
          credit: cr,
          balance: runBal,
        };
      });
    setLedger(ledgerRows);
    setLoading(false);
  }, [id, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPurchases = purchases.reduce((s, p) => s + Number(p.total_amount || 0), 0);

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

  if (!supplier) return <div className="p-6 text-center text-muted-foreground">Supplier not found</div>;

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/suppliers")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{supplier.name}</h1>
          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
            {supplier.phone && <span>{supplier.phone}</span>}
            {supplier.email && <span>• {supplier.email}</span>}
            {supplier.address && <span>• {supplier.address}</span>}
          </div>
        </div>
        <Badge variant={supplier.status === "active" || supplier.status === "approved" ? "default" : "secondary"}>
          {supplier.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Total Purchases</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1">{fc(totalPurchases)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1">{purchases.length}</p>
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
            <p className="text-lg sm:text-xl font-bold text-destructive mt-1">{fc(totalPurchases)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ledger">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="ledger" className="text-xs sm:text-sm">Ledger</TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs sm:text-sm">Purchases</TabsTrigger>
        </TabsList>

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

        <TabsContent value="purchases">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No purchases</TableCell></TableRow>
                    ) : purchases.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.purchase_number}</TableCell>
                        <TableCell className="text-sm">{p.purchase_date}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fc(Number(p.total_amount || 0))}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "completed" || p.status === "approved" ? "default" : "secondary"} className="text-xs">
                            {p.status}
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

export default SupplierProfilePage;
