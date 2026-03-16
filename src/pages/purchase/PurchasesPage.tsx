import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { createPurchase, createPurchaseReturn } from "@/lib/transaction-service";
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
import { Plus, ShoppingCart, Trash2, RotateCcw, Pencil, Printer, Check, X, Lock, ShieldAlert } from "lucide-react";
import { documentApi } from "@/lib/document-api";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PrintLayout } from "@/components/PrintLayout";
import { getDocumentStatusConfig } from "@/hooks/useDocumentRules";
import { documentApi } from "@/lib/document-api";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product { id: string; product_name: string; product_code: string; cost_price: number; }
interface Supplier { id: string; name: string; }
interface Branch { id: string; name: string; }
interface ItemRow { id: string; product_id: string; quantity: number; unit_price: number; total: number; }
interface Purchase {
  id: string; purchase_number: string; purchase_date: string; supplier_id: string | null;
  total_amount: number; payment_method: string; created_at: string; supplier_name?: string;
  notes: string | null; branch_id?: string | null; status: string;
}
interface PurchaseReturn {
  id: string; return_number: string; return_date: string; supplier_id: string | null;
  total_amount: number; reason: string | null; supplier_name?: string; status: string;
}

const PurchasesPage = () => {
  const { user, profile, hasPermission, isSuperAdmin, isAdmin } = useAuth();
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
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
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

  const [printPurchase, setPrintPurchase] = useState<Purchase | null>(null);
  const [printItems, setPrintItems] = useState<any[]>([]);

  const canEdit = hasPermission("purchase", "can_edit") || isSuperAdmin;
  const canAdd = hasPermission("purchase", "can_add") || isSuperAdmin;
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "cancel" | "delete" | null>(null);
  const [actionTarget, setActionTarget] = useState<Purchase | null>(null);
  const [actionReason, setActionReason] = useState("");

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

  const openCreate = () => {
    setEditingPurchase(null);
    setFormDate(new Date().toISOString().slice(0, 10)); setFormSupplier(""); setFormBranch(""); setFormPayment("cash"); setFormNotes("");
    setItems([{ id: "1", product_id: "", quantity: 0, unit_price: 0, total: 0 }]);
    setDialogOpen(true);
  };

  const openEdit = async (p: Purchase) => {
    const isApproved = p.status === "approved" || p.status === "completed";
    if (isApproved && !isSuperAdmin) {
      toast({ title: "Locked", description: "Only Super Admin can edit approved purchases", variant: "destructive" });
      return;
    }
    if (p.status === "cancelled") {
      toast({ title: "Locked", description: "Cancelled purchases cannot be edited", variant: "destructive" });
      return;
    }
    setEditingPurchase(p);
    setFormDate(p.purchase_date);
    setFormSupplier(p.supplier_id || "");
    setFormBranch(p.branch_id || "");
    setFormPayment(p.payment_method || "cash");
    setFormNotes(p.notes || "");
    const { data } = await supabase.from("purchase_items").select("*").eq("purchase_id", p.id);
    if (data && data.length > 0) {
      setItems(data.map((d: any, i: number) => ({
        id: String(i + 1), product_id: d.product_id, quantity: d.quantity, unit_price: d.unit_price, total: d.total,
      })));
    } else {
      setItems([{ id: "1", product_id: "", quantity: 0, unit_price: 0, total: 0 }]);
    }
    setDialogOpen(true);
  };

  const handleDocAction = async () => {
    if (!actionTarget || !actionType) return;
    setSaving(true);
    try {
      if (actionType === "approve") {
        await documentApi.approve("purchase", actionTarget.id);
        toast({ title: `Purchase ${actionTarget.purchase_number} approved` });
      } else if (actionType === "cancel") {
        await documentApi.cancel("purchase", actionTarget.id, actionReason);
        toast({ title: `Purchase ${actionTarget.purchase_number} cancelled` });
      } else if (actionType === "delete") {
        await documentApi.deleteApproved("purchase", actionTarget.id, actionReason);
        toast({ title: `Purchase ${actionTarget.purchase_number} deleted` });
      }
      setActionDialogOpen(false);
      setActionTarget(null);
      setActionReason("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const openPrint = async (p: Purchase) => {
    const { data } = await supabase.from("purchase_items").select("*").eq("purchase_id", p.id);
    const enriched = (data || []).map((d: any) => {
      const prod = products.find((pr) => pr.id === d.product_id);
      return { ...d, product_name: prod?.product_name || "—", product_code: prod?.product_code || "" };
    });
    setPrintItems(enriched);
    setPrintPurchase(p);
  };

  const handleSavePurchase = async () => {
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one item", variant: "destructive" }); return; }

    setSaving(true);
    try {
      if (editingPurchase) {
        const isApprovedEdit = editingPurchase.status === "approved" || editingPurchase.status === "completed";
        const total = grandTotal(validItems);

        if (isApprovedEdit && isSuperAdmin) {
          await documentApi.editApproved("purchase", editingPurchase.id, {
            purchase_date: formDate, supplier_id: formSupplier || null,
            branch_id: formBranch || null, payment_method: formPayment, notes: formNotes || null,
          }, validItems.map((i) => ({
            product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, total: i.total,
          })));
        } else {
          const oldValues = { purchase_date: editingPurchase.purchase_date, supplier_id: editingPurchase.supplier_id, total_amount: editingPurchase.total_amount, payment_method: editingPurchase.payment_method };
          const newValues = { purchase_date: formDate, supplier_id: formSupplier || null, total_amount: total, payment_method: formPayment };

          const { error } = await supabase.from("purchases").update({
            purchase_date: formDate, supplier_id: formSupplier || null, branch_id: formBranch || null,
            total_amount: total, payment_method: formPayment, notes: formNotes || null,
          }).eq("id", editingPurchase.id);
          if (error) throw error;

          await supabase.from("purchase_items").delete().eq("purchase_id", editingPurchase.id);
          await supabase.from("purchase_items").insert(
            validItems.map((i) => ({ purchase_id: editingPurchase.id, product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, total: i.total }))
          );

          await logEditAudit({ userId: user?.id, userName: profile?.name, module: "Purchase", action: "Edit", recordId: editingPurchase.id, oldValues, newValues });
        }
        toast({ title: `Purchase ${editingPurchase.purchase_number} updated` });
      } else {
        const ctx = { date: formDate, branchId: formBranch || userBranchId || null, userId: user?.id };
        const result = await createPurchase(ctx, formSupplier || null, formPayment, formNotes, validItems);
        toast({ title: `Purchase ${result.purchaseNumber} created` });
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
          <TableHeader><TableRow>
            <TableHead className="w-[35%]">Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {itemList.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Select value={item.product_id} onValueChange={(v) => updateItem(item.id, "product_id", v, itemList, setFn)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="number" className="h-9 text-right" value={item.quantity || ""} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0, itemList, setFn)} /></TableCell>
                <TableCell><Input type="number" className="h-9 text-right" value={item.unit_price || ""} onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0, itemList, setFn)} /></TableCell>
                <TableCell className="text-right tabular-nums font-medium">{fc(item.total)}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => setFn(itemList.filter((i) => i.id !== item.id))} disabled={itemList.length <= 1}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button></TableCell>
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

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Purchase</h1>
        </div>
        <div className="flex gap-2">
          {canAdd && <Button variant="outline" size="sm" onClick={() => setSupDialogOpen(true)}>Add Supplier</Button>}
          {canAdd && (
            <Button variant="outline" size="sm" onClick={() => { setReturnDialogOpen(true); setRetItems([{ id: "1", product_id: "", quantity: 0, unit_price: 0, total: 0 }]); }}>
              <RotateCcw className="w-4 h-4 mr-1" />Purchase Return
            </Button>
          )}
          {canAdd && (
            <Button size="sm" onClick={openCreate}>
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
                <TableHead className="text-right">Amount</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : purchases.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No purchases yet</TableCell></TableRow>
                : purchases.map((p) => {
                  const statusCfg = getDocumentStatusConfig(p.status);
                  const isLocked = (p.status === "approved" || p.status === "completed") && !isSuperAdmin;
                  const isCancelled = p.status === "cancelled";
                  return (
                  <TableRow key={p.id} className={isCancelled ? "opacity-60" : ""}>
                    <TableCell className="font-geist-mono text-xs font-medium">{p.purchase_number}</TableCell>
                    <TableCell>{p.purchase_date}</TableCell>
                    <TableCell>{p.supplier_name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fc(p.total_amount)}</TableCell>
                    <TableCell className="capitalize">{p.payment_method}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!isCancelled && (p.status === "draft" || p.status === "completed") && (isAdmin || isSuperAdmin) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => { setActionTarget(p); setActionType("approve"); setActionDialogOpen(true); }} title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!isCancelled && !isLocked && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {isSuperAdmin && (p.status === "approved" || p.status === "completed") && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => openEdit(p)} title="Super Admin Edit">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!isCancelled && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setActionTarget(p); setActionType("cancel"); setActionDialogOpen(true); }} title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPrint(p)} title="Print">
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
                <TableHead>Return #</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {returns.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No returns yet</TableCell></TableRow>
                : returns.map((r) => {
                  const sCfg = getDocumentStatusConfig(r.status || "draft");
                  const rCancelled = r.status === "cancelled";
                  return (
                  <TableRow key={r.id} className={rCancelled ? "opacity-60" : ""}>
                    <TableCell className="font-geist-mono text-xs font-medium">{r.return_number}</TableCell>
                    <TableCell>{r.return_date}</TableCell>
                    <TableCell>{r.supplier_name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fc(r.total_amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.reason || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sCfg.className}`}>{sCfg.label}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!rCancelled && (r.status === "draft" || r.status === "completed") && (isAdmin || isSuperAdmin) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={async () => {
                            try { await documentApi.approve("purchase_return", r.id); toast({ title: "Return approved" }); fetchData(); } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
                          }} title="Approve"><Check className="w-3.5 h-3.5" /></Button>
                        )}
                        {isSuperAdmin && r.status === "approved" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" title="Super Admin Edit"><ShieldAlert className="w-3.5 h-3.5" /></Button>
                        )}
                        {!rCancelled && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                            try { await documentApi.cancel("purchase_return", r.id); toast({ title: "Return cancelled" }); fetchData(); } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
                          }} title="Cancel"><X className="w-3.5 h-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPurchase ? `Edit Purchase ${editingPurchase.purchase_number}` : "New Purchase"}</DialogTitle></DialogHeader>
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
            <Button onClick={handleSavePurchase} disabled={saving}>{saving ? "Saving..." : editingPurchase ? "Update Purchase" : "Save Purchase"}</Button>
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

      {/* Print Preview */}
      {printPurchase && (
        <PrintLayout
          open={!!printPurchase}
          onClose={() => setPrintPurchase(null)}
          title="Purchase Invoice"
          docNumber={printPurchase.purchase_number}
          docDate={printPurchase.purchase_date}
          branch={printPurchase.branch_id ? branchMap.get(printPurchase.branch_id) : undefined}
          partyLabel="Supplier"
          partyName={printPurchase.supplier_name}
          notes={printPurchase.notes || undefined}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <thead>
              <tr>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "left", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>#</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "left", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Product</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Qty</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Unit Price</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {printItems.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{idx + 1}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{item.product_code} — {item.product_name}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(item.unit_price)}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 600 }}>{fc(item.total)}</td>
                </tr>
              ))}
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td colSpan={4} style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>Total Amount</td>
                <td style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(printPurchase.total_amount)}</td>
              </tr>
            </tbody>
          </table>
        </PrintLayout>
      )}

      {/* Action Confirm Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Purchase" : actionType === "cancel" ? "Cancel Purchase" : "Delete Purchase"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? `Approve purchase ${actionTarget?.purchase_number}? This will lock it from normal editing.`
                : actionType === "cancel"
                ? `Cancel purchase ${actionTarget?.purchase_number}? Stock and accounting entries will be reversed.`
                : `Permanently delete purchase ${actionTarget?.purchase_number}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(actionType === "cancel" || actionType === "delete") && (
            <div className="space-y-2 px-1">
              <Label>Reason</Label>
              <Input value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Reason..." />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDocAction} disabled={saving}>
              {saving ? "Processing..." : actionType === "approve" ? "Approve" : actionType === "cancel" ? "Cancel Purchase" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchasesPage;
