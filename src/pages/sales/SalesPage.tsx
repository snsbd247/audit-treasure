import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { createSalesInvoice, createSalesReturn } from "@/lib/transaction-service";
import { logEditAudit } from "@/lib/audit-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Receipt, Trash2, RotateCcw, Pencil, Printer, Check, X, Lock, ShieldAlert } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PrintLayout } from "@/components/PrintLayout";
import { useDocumentRules, getDocumentStatusConfig } from "@/hooks/useDocumentRules";
import { documentApi } from "@/lib/document-api";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product { id: string; product_name: string; product_code: string; selling_price: number; }
interface Customer { id: string; name: string; }
interface Branch { id: string; name: string; }
interface ItemRow { id: string; product_id: string; quantity: number; price: number; discount: number; total: number; }

interface SalesInvoice {
  id: string; invoice_number: string; invoice_date: string; customer_id: string | null;
  total_amount: number; discount: number; net_amount: number; status: string; notes: string | null;
  customer_name?: string; branch_id?: string | null;
}
interface SalesReturnRow {
  id: string; return_number: string; return_date: string; customer_id: string | null;
  total_amount: number; reason: string | null; customer_name?: string;
}

const SalesPage = () => {
  const { user, profile, hasPermission, isSuperAdmin } = useAuth();
  const { userBranchId } = useBranch();
  const { toast } = useToast();
  const { fc } = useCurrency();
  const [tab, setTab] = useState("invoices");
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [returns, setReturns] = useState<SalesReturnRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);

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

  // Print state
  const [printInvoice, setPrintInvoice] = useState<SalesInvoice | null>(null);
  const [printItems, setPrintItems] = useState<any[]>([]);

  const canAdd = hasPermission("sales", "can_add") || isSuperAdmin;
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "cancel" | "delete" | null>(null);
  const [actionTarget, setActionTarget] = useState<SalesInvoice | null>(null);
  const [actionReason, setActionReason] = useState("");

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

  const openCreate = () => {
    setEditingInvoice(null);
    setFormDate(new Date().toISOString().slice(0, 10)); setFormCustomer(""); setFormBranch(""); setFormDiscount("0"); setFormNotes("");
    setItems([{ id: "1", product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }]);
    setDialogOpen(true);
  };

  const openEdit = async (inv: SalesInvoice) => {
    // Check if user can edit based on status
    const isApproved = inv.status === "approved" || inv.status === "completed";
    if (isApproved && !isSuperAdmin) {
      toast({ title: "Locked", description: "Only Super Admin can edit approved invoices", variant: "destructive" });
      return;
    }
    if (inv.status === "cancelled") {
      toast({ title: "Locked", description: "Cancelled invoices cannot be edited", variant: "destructive" });
      return;
    }
    setEditingInvoice(inv);
    setFormDate(inv.invoice_date);
    setFormCustomer(inv.customer_id || "");
    setFormBranch(inv.branch_id || "");
    setFormDiscount(String(inv.discount));
    setFormNotes(inv.notes || "");
    const { data } = await supabase.from("sales_invoice_items").select("*").eq("sales_invoice_id", inv.id);
    if (data && data.length > 0) {
      setItems(data.map((d: any, i: number) => ({
        id: String(i + 1), product_id: d.product_id, quantity: d.quantity, price: d.price, discount: d.discount, total: d.total,
      })));
    } else {
      setItems([{ id: "1", product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }]);
    }
    setDialogOpen(true);
  };

  const handleDocAction = async () => {
    if (!actionTarget || !actionType) return;
    setSaving(true);
    try {
      if (actionType === "approve") {
        await documentApi.approve("sales_invoice", actionTarget.id);
        toast({ title: `Invoice ${actionTarget.invoice_number} approved` });
      } else if (actionType === "cancel") {
        await documentApi.cancel("sales_invoice", actionTarget.id, actionReason);
        toast({ title: `Invoice ${actionTarget.invoice_number} cancelled` });
      } else if (actionType === "delete") {
        await documentApi.deleteApproved("sales_invoice", actionTarget.id, actionReason);
        toast({ title: `Invoice ${actionTarget.invoice_number} deleted` });
      }
      setActionDialogOpen(false);
      setActionTarget(null);
      setActionReason("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const openPrint = async (inv: SalesInvoice) => {
    const { data } = await supabase.from("sales_invoice_items").select("*").eq("sales_invoice_id", inv.id);
    const enriched = (data || []).map((d: any) => {
      const prod = products.find((p) => p.id === d.product_id);
      return { ...d, product_name: prod?.product_name || "—", product_code: prod?.product_code || "" };
    });
    setPrintItems(enriched);
    setPrintInvoice(inv);
  };

  const handleSaveInvoice = async () => {
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one item", variant: "destructive" }); return; }

    setSaving(true);
    try {
      if (editingInvoice) {
        const isApprovedEdit = editingInvoice.status === "approved" || editingInvoice.status === "completed";
        const total = grandTotal(validItems);
        const disc = parseFloat(formDiscount) || 0;
        const net = total - disc;

        if (isApprovedEdit && isSuperAdmin) {
          // Use document API for approved doc edits (handles stock + accounting recalc)
          await documentApi.editApproved("sales_invoice", editingInvoice.id, {
            invoice_date: formDate,
            customer_id: formCustomer || null,
            branch_id: formBranch || null,
            discount: disc,
            notes: formNotes || null,
          }, validItems.map((i) => ({
            product_id: i.product_id, quantity: i.quantity, price: i.price, discount: i.discount, total: i.total,
          })));
        } else {
          // Normal draft edit
          const oldValues = {
            invoice_date: editingInvoice.invoice_date, customer_id: editingInvoice.customer_id,
            discount: editingInvoice.discount, notes: editingInvoice.notes, total_amount: editingInvoice.total_amount,
          };
          const newValues = {
            invoice_date: formDate, customer_id: formCustomer || null,
            discount: disc, notes: formNotes || null, total_amount: total,
          };

          const { error } = await supabase.from("sales_invoices").update({
            invoice_date: formDate, customer_id: formCustomer || null, branch_id: formBranch || null,
            discount: disc, notes: formNotes || null, total_amount: total, net_amount: net,
          }).eq("id", editingInvoice.id);
          if (error) throw error;

          await supabase.from("sales_invoice_items").delete().eq("sales_invoice_id", editingInvoice.id);
          await supabase.from("sales_invoice_items").insert(
            validItems.map((i) => ({
              sales_invoice_id: editingInvoice.id, product_id: i.product_id,
              quantity: i.quantity, price: i.price, discount: i.discount, total: i.total,
            }))
          );

          await logEditAudit({
            userId: user?.id, userName: profile?.name, module: "Sales",
            action: "Edit", recordId: editingInvoice.id, oldValues, newValues,
          });
        }

        toast({ title: `Invoice ${editingInvoice.invoice_number} updated` });
      } else {
        const ctx = { date: formDate, branchId: formBranch || userBranchId || null, userId: user?.id };
        const result = await createSalesInvoice(ctx, formCustomer || null, parseFloat(formDiscount) || 0, formNotes, validItems);
        toast({ title: `Invoice ${result.invoiceNumber} created` });
      }
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
      const result = await createSalesReturn(ctx, retCustomer || null, retReason, validItems);
      toast({ title: `Return ${result.returnNumber} created` });
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
                <TableCell className="text-right tabular-nums font-medium">{fc(item.total)}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => setFn(itemList.filter((i) => i.id !== item.id))} disabled={itemList.length <= 1}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button></TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell colSpan={4} className="text-right">Grand Total</TableCell>
              <TableCell className="text-right tabular-nums">{fc(grandTotal(itemList))}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Sales</h1>
        </div>
        <div className="flex gap-2">
          {canAdd && <Button variant="outline" size="sm" onClick={() => setCustDialogOpen(true)}>Add Customer</Button>}
          {canAdd && (
            <Button variant="outline" size="sm" onClick={() => { setReturnDialogOpen(true); setRetItems([{ id: "1", product_id: "", quantity: 0, price: 0, discount: 0, total: 0 }]); }}>
              <RotateCcw className="w-4 h-4 mr-1" />Sales Return
            </Button>
          )}
          {canAdd && (
            <Button size="sm" onClick={openCreate}>
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
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : invoices.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No invoices yet</TableCell></TableRow>
                : invoices.map((inv) => {
                  const statusCfg = getDocumentStatusConfig(inv.status);
                  const isLocked = (inv.status === "approved" || inv.status === "completed") && !isSuperAdmin;
                  const isCancelled = inv.status === "cancelled";
                  return (
                  <TableRow key={inv.id} className={isCancelled ? "opacity-60" : ""}>
                    <TableCell className="font-geist-mono text-xs font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.invoice_date}</TableCell>
                    <TableCell>{inv.customer_name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(inv.total_amount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(inv.discount)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fc(inv.net_amount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!isCancelled && (inv.status === "draft" || inv.status === "completed") && (isAdmin || isSuperAdmin) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => { setActionTarget(inv); setActionType("approve"); setActionDialogOpen(true); }} title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!isCancelled && !isLocked && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inv)} title={isLocked ? "Locked" : "Edit"}>
                            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                        {isSuperAdmin && (inv.status === "approved" || inv.status === "completed") && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => openEdit(inv)} title="Super Admin Edit">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!isCancelled && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setActionTarget(inv); setActionType("cancel"); setActionDialogOpen(true); }} title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPrint(inv)} title="Print">
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
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
                    <TableCell className="text-right tabular-nums font-medium">{fc(r.total_amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Dialog (Create/Edit) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingInvoice ? `Edit Invoice ${editingInvoice.invoice_number}` : "New Sales Invoice"}</DialogTitle></DialogHeader>
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
            <Button onClick={handleSaveInvoice} disabled={saving}>{saving ? "Saving..." : editingInvoice ? "Update Invoice" : "Save Invoice"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

      {/* Print Preview */}
      {printInvoice && (
        <PrintLayout
          open={!!printInvoice}
          onClose={() => setPrintInvoice(null)}
          title="Sales Invoice"
          docNumber={printInvoice.invoice_number}
          docDate={printInvoice.invoice_date}
          branch={printInvoice.branch_id ? branchMap.get(printInvoice.branch_id) : undefined}
          partyLabel="Customer"
          partyName={printInvoice.customer_name}
          notes={printInvoice.notes || undefined}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <thead>
              <tr>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "left", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>#</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "left", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Product</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Qty</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Price</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Discount</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {printItems.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{idx + 1}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{item.product_code} — {item.product_name}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(item.price)}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(item.discount)}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 600 }}>{fc(item.total)}</td>
                </tr>
              ))}
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>Subtotal</td>
                <td style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(printInvoice.total_amount)}</td>
              </tr>
              {printInvoice.discount > 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>Discount</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>({fc(printInvoice.discount)})</td>
                </tr>
              )}
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>Net Amount</td>
                <td style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(printInvoice.net_amount)}</td>
              </tr>
            </tbody>
          </table>
        </PrintLayout>
      )}
    </div>
  );
};

export default SalesPage;
