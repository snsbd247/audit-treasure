import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { createPurchase, createPurchaseReturn } from "@/lib/transaction-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShoppingCart, Trash2, RotateCcw } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Product { id: string; product_name: string; product_code: string; cost_price: number; }
interface Supplier { id: string; name: string; }
interface Branch { id: string; name: string; }
interface ItemRow { id: string; product_id: string; quantity: number; unit_price: number; total: number; }
interface Purchase {
  id: string; purchase_number: string; purchase_date: string; supplier_id: string | null;
  total_amount: number; payment_method: string; created_at: string; supplier_name?: string;
}
interface PurchaseReturn {
  id: string; return_number: string; return_date: string; supplier_id: string | null;
  total_amount: number; reason: string | null; supplier_name?: string;
}

const PurchasesPage = () => {
  const { user, hasPermission } = useAuth();
  const { userBranchId } = useBranch();
  const { toast } = useToast();
  const { fc } = useCurrency();
  const [tab, setTab] = useState("purchases");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formSupplier, setFormSupplier] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formPayment, setFormPayment] = useState("cash");
  const [formNotes, setFormNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ id: "1", product_id: "", quantity: 0, unit_price: 0, total: 0 }]);

  const [retDate, setRetDate] = useState(new Date().toISOString().slice(0, 10));
  const [retSupplier, setRetSupplier] = useState("");
  const [retBranch, setRetBranch] = useState("");
  const [retReason, setRetReason] = useState("");
  const [retItems, setRetItems] = useState<ItemRow[]>([{ id: "1", product_id: "", quantity: 0, unit_price: 0, total: 0 }]);

  const [supDialogOpen, setSupDialogOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [pRes, sRes, bRes, purRes, prRes] = await Promise.all([
      supabase.from("products").select("id, product_name, product_code, cost_price").eq("status", "active"),
      supabase.from("suppliers").select("*").eq("status", "active"),
      supabase.from("branches").select("id, name").eq("status", "active"),
      supabase.from("purchases").select("*").order("created_at", { ascending: false }),
      supabase.from("purchase_returns").select("*").order("created_at", { ascending: false }),
    ]);
    const supList = (sRes.data || []) as Supplier[];
    setProducts((pRes.data || []) as Product[]);
    setSuppliers(supList);
    setBranches((bRes.data || []) as Branch[]);
    setPurchases((purRes.data || []).map((p: any) => ({ ...p, supplier_name: supList.find((s) => s.id === p.supplier_id)?.name })));
    setReturns((prRes.data || []).map((r: any) => ({ ...r, supplier_name: supList.find((s) => s.id === r.supplier_id)?.name })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateItem = (id: string, field: keyof ItemRow, value: any, itemList: ItemRow[], setFn: Function) => {
    setFn(itemList.map((i) => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      if (field === "product_id") {
        const prod = products.find((p) => p.id === value);
        if (prod) updated.unit_price = prod.cost_price;
      }
      updated.total = updated.quantity * updated.unit_price;
      return updated;
    }));
  };

  const grandTotal = (list: ItemRow[]) => list.reduce((s, i) => s + i.total, 0);

  const handleSavePurchase = async () => {
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one item", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const ctx = { date: formDate, branchId: formBranch || userBranchId || null, userId: user?.id };
      const result = await createPurchase(ctx, formSupplier || null, formPayment, formNotes, validItems);
      toast({ title: `Purchase ${result.purchaseNumber} created` });
      setDialogOpen(false); fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleSaveReturn = async () => {
    const validItems = retItems.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one item", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const ctx = { date: retDate, branchId: retBranch || userBranchId || null, userId: user?.id };
      const result = await createPurchaseReturn(ctx, retSupplier || null, retReason, validItems);
      toast({ title: `Return ${result.returnNumber} created` });
      setReturnDialogOpen(false); fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleAddSupplier = async () => {
    if (!supName.trim()) return;
    const { error } = await supabase.from("suppliers").insert({ name: supName, phone: supPhone });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setSupDialogOpen(false); setSupName(""); setSupPhone(""); fetchData(); toast({ title: "Supplier added" }); }
  };

  const renderItemsGrid = (itemList: ItemRow[], setFn: Function) => (
    <Card>
      <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Items</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemList.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Select value={item.product_id} onValueChange={(v) => updateItem(item.id, "product_id", v, itemList, setFn)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="number" className="h-9 text-right" value={item.quantity || ""} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0, itemList, setFn)} /></TableCell>
                <TableCell><Input type="number" className="h-9 text-right" value={item.unit_price || ""} onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0, itemList, setFn)} /></TableCell>
                <TableCell className="text-right tabular-nums font-medium">{fc(item.total)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setFn(itemList.filter((i) => i.id !== item.id))} disabled={itemList.length <= 1}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell colSpan={3} className="text-right">Grand Total</TableCell>
              <TableCell className="text-right tabular-nums">{fc(grandTotal(itemList))}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Purchase</h1>
        </div>
        <div className="flex gap-2">
          {hasPermission("Purchase", "can_add") && (
            <Button variant="outline" size="sm" onClick={() => setSupDialogOpen(true)}>Add Supplier</Button>
          )}
          {hasPermission("Purchase", "can_add") && (
            <Button variant="outline" size="sm" onClick={() => { setReturnDialogOpen(true); setRetItems([{ id: "1", product_id: "", quantity: 0, unit_price: 0, total: 0 }]); }}>
              <RotateCcw className="w-4 h-4 mr-1" />Purchase Return
            </Button>
          )}
          {hasPermission("Purchase", "can_add") && (
            <Button size="sm" onClick={() => { setDialogOpen(true); setItems([{ id: "1", product_id: "", quantity: 0, unit_price: 0, total: 0 }]); }}>
              <Plus className="w-4 h-4 mr-1" />New Purchase
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="returns">Purchase Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Purchase #</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Payment</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : purchases.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No purchases yet</TableCell></TableRow>
                : purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-geist-mono text-xs font-medium">{p.purchase_number}</TableCell>
                    <TableCell>{p.purchase_date}</TableCell>
                    <TableCell>{p.supplier_name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fc(p.total_amount)}</TableCell>
                    <TableCell className="capitalize">{p.payment_method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Return #</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Reason</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {returns.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No returns yet</TableCell></TableRow>
                : returns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-geist-mono text-xs font-medium">{r.return_number}</TableCell>
                    <TableCell>{r.return_date}</TableCell>
                    <TableCell>{r.supplier_name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{r.total_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{r.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Purchase</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Supplier</Label>
                <Select value={formSupplier} onValueChange={setFormSupplier}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Branch</Label>
                <Select value={formBranch} onValueChange={setFormBranch}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Payment Method</Label>
                <Select value={formPayment} onValueChange={setFormPayment}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Notes</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} /></div>
            </div>
            {renderItemsGrid(items, setItems)}
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { id: String(Date.now()), product_id: "", quantity: 0, unit_price: 0, total: 0 }])}>
              <Plus className="w-4 h-4 mr-1" />Add Item
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePurchase} disabled={saving}>{saving ? "Saving..." : "Save Purchase"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Purchase Return</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={retDate} onChange={(e) => setRetDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Supplier</Label>
                <Select value={retSupplier} onValueChange={setRetSupplier}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Branch</Label>
                <Select value={retBranch} onValueChange={setRetBranch}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Input value={retReason} onChange={(e) => setRetReason(e.target.value)} /></div>
            {renderItemsGrid(retItems, setRetItems)}
            <Button variant="outline" size="sm" onClick={() => setRetItems([...retItems, { id: String(Date.now()), product_id: "", quantity: 0, unit_price: 0, total: 0 }])}>
              <Plus className="w-4 h-4 mr-1" />Add Item
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveReturn} disabled={saving}>{saving ? "Saving..." : "Save Return"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={supDialogOpen} onOpenChange={setSupDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={supName} onChange={(e) => setSupName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={supPhone} onChange={(e) => setSupPhone(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSupDialogOpen(false)}>Cancel</Button><Button onClick={handleAddSupplier}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
