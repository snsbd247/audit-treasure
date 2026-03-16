import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { nextNumber } from "@/lib/db-utils";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { validateFinancialYear } from "@/lib/financial-year-utils";
import { autoPostAccounting, findAccountByName } from "@/lib/accounting-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Receipt, Trash2, RotateCcw } from "lucide-react";

interface Product { id: string; product_name: string; product_code: string; selling_price: number; }
interface Customer { id: string; name: string; }
interface Branch { id: string; name: string; }
interface ItemRow { id: string; product_id: string; quantity: number; price: number; discount: number; total: number; }

interface SalesInvoice {
  id: string; invoice_number: string; invoice_date: string; customer_id: string | null;
  total_amount: number; discount: number; net_amount: number; customer_name?: string;
}
interface SalesReturn {
  id: string; return_number: string; return_date: string; customer_id: string | null;
  total_amount: number; reason: string | null; customer_name?: string;
}

const SalesPage = () => {
  const { user, hasPermission } = useAuth();
  const { userBranchId, canAccessAllBranches } = useBranch();
  const { toast } = useToast();
  const [tab, setTab] = useState("invoices");
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formCustomer, setFormCustomer] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formDiscount, setFormDiscount] = useState("0");
  const [formNotes, setFormNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ id: "1", product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }]);

  const [retDate, setRetDate] = useState(new Date().toISOString().slice(0, 10));
  const [retCustomer, setRetCustomer] = useState("");
  const [retBranch, setRetBranch] = useState("");
  const [retReason, setRetReason] = useState("");
  const [retItems, setRetItems] = useState<ItemRow[]>([{ id: "1", product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }]);

  const [custDialogOpen, setCustDialogOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes, bRes, sRes, srRes] = await Promise.all([
      supabase.from("products").select("id, product_name, product_code, selling_price").eq("status", "active"),
      supabase.from("customers").select("*").eq("status", "active"),
      supabase.from("branches").select("id, name").eq("status", "active"),
      supabase.from("sales_invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("sales_returns").select("*").order("created_at", { ascending: false }),
    ]);
    const custList = (cRes.data || []) as Customer[];
    setProducts((pRes.data || []) as Product[]);
    setCustomers(custList);
    setBranches((bRes.data || []) as Branch[]);
    setInvoices((sRes.data || []).map((s: any) => ({ ...s, customer_name: custList.find((c) => c.id === s.customer_id)?.name })));
    setReturns((srRes.data || []).map((r: any) => ({ ...r, customer_name: custList.find((c) => c.id === r.customer_id)?.name })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateItem = (id: string, field: keyof ItemRow, value: any, itemList: ItemRow[], setFn: Function) => {
    setFn(itemList.map((i) => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      if (field === "product_id") {
        const prod = products.find((p) => p.id === value);
        if (prod) updated.price = prod.selling_price;
      }
      updated.total = (updated.quantity * updated.price) - updated.discount;
      return updated;
    }));
  };

  const grandTotal = (list: ItemRow[]) => list.reduce((s, i) => s + i.total, 0);

  const handleSaveInvoice = async () => {
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one item", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const numData = await nextNumber("sales");
      const totalAmt = grandTotal(validItems);
      const disc = parseFloat(formDiscount) || 0;
      const { data, error } = await supabase.from("sales_invoices").insert({
        invoice_number: numData as string,
        invoice_date: formDate, customer_id: formCustomer || null, branch_id: formBranch || null,
        total_amount: totalAmt, discount: disc, net_amount: totalAmt - disc, notes: formNotes,
        created_by: user?.id,
      }).select().single();
      if (error) throw error;

      const rows = validItems.map((i) => ({ sales_invoice_id: (data as any).id, product_id: i.product_id, quantity: i.quantity, price: i.price, discount: i.discount, total: i.total }));
      await supabase.from("sales_invoice_items").insert(rows);

      const movements = validItems.map((i) => ({
        product_id: i.product_id, branch_id: formBranch || null,
        movement_type: "sale" as const, reference_type: "sales_invoice", reference_id: (data as any).id, quantity: -i.quantity,
      }));
      await supabase.from("stock_movements").insert(movements);

      toast({ title: `Invoice ${numData} created` });
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
      const numData = await nextNumber("sales_return");
      const { data, error } = await supabase.from("sales_returns").insert({
        return_number: numData as string,
        return_date: retDate, customer_id: retCustomer || null, branch_id: retBranch || null,
        total_amount: grandTotal(validItems), reason: retReason, created_by: user?.id,
      }).select().single();
      if (error) throw error;

      const rows = validItems.map((i) => ({ sales_return_id: (data as any).id, product_id: i.product_id, quantity: i.quantity, price: i.price, total: i.total }));
      await supabase.from("sales_return_items").insert(rows);

      const movements = validItems.map((i) => ({
        product_id: i.product_id, branch_id: retBranch || null,
        movement_type: "sale_return" as const, reference_type: "sales_return", reference_id: (data as any).id, quantity: i.quantity,
      }));
      await supabase.from("stock_movements").insert(movements);

      toast({ title: `Return ${numData} created` });
      setReturnDialogOpen(false); fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleAddCustomer = async () => {
    if (!custName.trim()) return;
    const { error } = await supabase.from("customers").insert({ name: custName, phone: custPhone });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setCustDialogOpen(false); setCustName(""); setCustPhone(""); fetchData(); toast({ title: "Customer added" }); }
  };

  const renderItemsGrid = (itemList: ItemRow[], setFn: Function) => (
    <Card>
      <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Items</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-[30%]">Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {itemList.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Select value={item.product_id} onValueChange={(v) => updateItem(item.id, "product_id", v, itemList, setFn)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="number" className="h-9 text-right" value={item.quantity || ""} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0, itemList, setFn)} /></TableCell>
                <TableCell><Input type="number" className="h-9 text-right" value={item.price || ""} onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0, itemList, setFn)} /></TableCell>
                <TableCell><Input type="number" className="h-9 text-right" value={item.discount || ""} onChange={(e) => updateItem(item.id, "discount", parseFloat(e.target.value) || 0, itemList, setFn)} /></TableCell>
                <TableCell className="text-right tabular-nums font-medium">{item.total.toLocaleString()}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => setFn(itemList.filter((i) => i.id !== item.id))} disabled={itemList.length <= 1}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button></TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell colSpan={4} className="text-right">Grand Total</TableCell>
              <TableCell className="text-right tabular-nums">{grandTotal(itemList).toLocaleString()}</TableCell>
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
          <Receipt className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Sales</h1>
        </div>
        <div className="flex gap-2">
          {hasPermission("Sales", "can_add") && (
            <Button variant="outline" size="sm" onClick={() => setCustDialogOpen(true)}>Add Customer</Button>
          )}
          {hasPermission("Sales", "can_add") && (
            <Button variant="outline" size="sm" onClick={() => { setReturnDialogOpen(true); setRetItems([{ id: "1", product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }]); }}>
              <RotateCcw className="w-4 h-4 mr-1" />Sales Return
            </Button>
          )}
          {hasPermission("Sales", "can_add") && (
            <Button size="sm" onClick={() => { setDialogOpen(true); setItems([{ id: "1", product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }]); }}>
              <Plus className="w-4 h-4 mr-1" />New Invoice
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="invoices">Sales Invoices</TabsTrigger>
          <TabsTrigger value="returns">Sales Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Discount</TableHead><TableHead className="text-right">Net</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : invoices.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No invoices yet</TableCell></TableRow>
                : invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-geist-mono text-xs font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.invoice_date}</TableCell>
                    <TableCell>{inv.customer_name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{inv.total_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{inv.discount.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{inv.net_amount.toLocaleString()}</TableCell>
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
                <TableHead>Return #</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Reason</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {returns.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No returns yet</TableCell></TableRow>
                : returns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-geist-mono text-xs font-medium">{r.return_number}</TableCell>
                    <TableCell>{r.return_date}</TableCell>
                    <TableCell>{r.customer_name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{r.total_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{r.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Sales Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Customer</Label>
                <Select value={formCustomer} onValueChange={setFormCustomer}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Branch</Label>
                <Select value={formBranch} onValueChange={setFormBranch}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Overall Discount</Label><Input type="number" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} /></div>
              <div className="space-y-2"><Label>Notes</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} /></div>
            </div>
            {renderItemsGrid(items, setItems)}
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { id: String(Date.now()), product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }])}>
              <Plus className="w-4 h-4 mr-1" />Add Item
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveInvoice} disabled={saving}>{saving ? "Saving..." : "Save Invoice"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Sales Return</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={retDate} onChange={(e) => setRetDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Customer</Label>
                <Select value={retCustomer} onValueChange={setRetCustomer}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Branch</Label>
                <Select value={retBranch} onValueChange={setRetBranch}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Input value={retReason} onChange={(e) => setRetReason(e.target.value)} /></div>
            {renderItemsGrid(retItems, setRetItems)}
            <Button variant="outline" size="sm" onClick={() => setRetItems([...retItems, { id: String(Date.now()), product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }])}>
              <Plus className="w-4 h-4 mr-1" />Add Item
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveReturn} disabled={saving}>{saving ? "Saving..." : "Save Return"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={custDialogOpen} onOpenChange={setCustDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={custName} onChange={(e) => setCustName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCustDialogOpen(false)}>Cancel</Button><Button onClick={handleAddCustomer}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPage;
