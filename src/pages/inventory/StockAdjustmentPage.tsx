import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { nextNumber } from "@/lib/db-utils";
import { validateFinancialYear } from "@/lib/financial-year-utils";
import { postAccounting, recordStockMovement } from "@/lib/transaction-service";
import { updateWarehouseStock } from "@/lib/stock-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardCheck } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Product { id: string; product_name: string; product_code: string; cost_price: number; }
interface WH { id: string; warehouse_name: string; warehouse_code: string; }
interface Adjustment {
  id: string; adjustment_number: string; adjustment_date: string; adjustment_type: string;
  product_id: string; quantity: number; unit_cost: number; total_value: number;
  reason: string | null; created_at: string; product_name?: string;
}

const REASONS = [
  "Physical count correction",
  "Damaged goods",
  "Expired items",
  "Found items",
  "Opening stock",
  "Other",
];

const StockAdjustmentPage = () => {
  const { user } = useAuth();
  const { userBranchId } = useBranch();
  const { toast } = useToast();
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formType, setFormType] = useState("increase");
  const [formProduct, setFormProduct] = useState("");
  const [formWarehouse, setFormWarehouse] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [aRes, pRes, wRes] = await Promise.all([
      supabase.from("stock_adjustments" as any).select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("products").select("id, product_name, product_code, cost_price").eq("status", "active"),
      supabase.from("warehouses" as any).select("id, warehouse_name, warehouse_code").eq("status", "active"),
    ]);
    const prods = (pRes.data || []) as Product[];
    setProducts(prods);
    setWarehouses((wRes.data || []) as any);
    setAdjustments((aRes.data || []).map((a: any) => ({
      ...a,
      product_name: prods.find((p) => p.id === a.product_id)?.product_name,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const qty = parseFloat(formQty) || 0;
  const cost = parseFloat(formCost) || 0;
  const totalValue = qty * cost;

  const handleSave = async () => {
    if (!formProduct || qty <= 0) {
      toast({ title: "Select a product and enter quantity", variant: "destructive" });
      return;
    }

    const fyResult = await validateFinancialYear(formDate);
    if (!fyResult.valid) {
      toast({ title: "Financial Year Error", description: fyResult.error, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const adjNumber = await nextNumber("stock_adjustment");
      const branchId = userBranchId || null;

      // Insert adjustment record
      const { error } = await supabase.from("stock_adjustments" as any).insert({
        adjustment_number: adjNumber,
        adjustment_date: formDate,
        adjustment_type: formType,
        product_id: formProduct,
        warehouse_id: formWarehouse || null,
        branch_id: branchId,
        quantity: qty,
        unit_cost: cost,
        total_value: totalValue,
        reason: formReason || null,
        notes: formNotes || null,
        created_by: user?.id,
      } as any);
      if (error) throw error;

      // Stock movement
      const movementQty = formType === "increase" ? qty : -qty;
      await recordStockMovement({
        product_id: formProduct,
        quantity: movementQty,
        movement_type: "adjustment",
        reference_type: "stock_adjustment",
        reference_id: adjNumber,
        branchId,
        warehouseId: formWarehouse || undefined,
      });

      // Audit log
      await supabase.from("audit_log").insert({
        action: `Stock ${formType}`,
        module: "Stock Adjustment",
        record_id: adjNumber,
        user_id: user?.id,
        details: `${formType === "increase" ? "+" : "-"}${qty} of product, reason: ${formReason || "N/A"}`,
      });

      // Accounting entry
      const ctx = { date: formDate, branchId, userId: user?.id, financialYearId: fyResult.yearId };
      if (formType === "increase") {
        await postAccounting({
          debitAccountName: "Inventory",
          creditAccountName: "Stock Adjustment",
          amount: totalValue,
          description: `Stock Adjustment ${adjNumber} (Increase)`,
          voucherType: "journal",
          ctx,
        });
      } else {
        await postAccounting({
          debitAccountName: "Stock Adjustment",
          creditAccountName: "Inventory",
          amount: totalValue,
          description: `Stock Adjustment ${adjNumber} (Decrease)`,
          voucherType: "journal",
          ctx,
        });
      }

      toast({ title: `Adjustment ${adjNumber} recorded` });
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const openDialog = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormType("increase"); setFormProduct(""); setFormWarehouse("");
    setFormQty(""); setFormCost(""); setFormReason(""); setFormNotes("");
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Stock Adjustments</h1>
        </div>
        <Button size="sm" onClick={openDialog}><Plus className="w-4 h-4 mr-1" />New Adjustment</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Adjustment #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : adjustments.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No adjustments yet</TableCell></TableRow>
            ) : adjustments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs font-medium">{a.adjustment_number}</TableCell>
                <TableCell>{a.adjustment_date}</TableCell>
                <TableCell>
                  <Badge variant={a.adjustment_type === "increase" ? "default" : "destructive"}>
                    {a.adjustment_type === "increase" ? "↑ Increase" : "↓ Decrease"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{a.product_name || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{a.quantity}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{a.total_value.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{a.reason || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Stock Adjustment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2"><Label>Adjustment Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">Increase (Stock In)</SelectItem>
                    <SelectItem value="decrease">Decrease (Stock Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Product *</Label>
              <Select value={formProduct} onValueChange={(v) => {
                setFormProduct(v);
                const prod = products.find((p) => p.id === v);
                if (prod) setFormCost(String(prod.cost_price));
              }}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Warehouse (optional)</Label>
              <Select value={formWarehouse} onValueChange={setFormWarehouse}>
                <SelectTrigger><SelectValue placeholder="All warehouses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No specific warehouse</SelectItem>
                  {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.warehouse_code} — {w.warehouse_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Quantity *</Label>
                <Input type="number" min="0" value={formQty} onChange={(e) => setFormQty(e.target.value)} />
              </div>
              <div className="space-y-2"><Label>Unit Cost</Label>
                <Input type="number" min="0" value={formCost} onChange={(e) => setFormCost(e.target.value)} />
              </div>
              <div className="space-y-2"><Label>Total Value</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-muted text-foreground font-medium tabular-nums">
                  {totalValue.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="space-y-2"><Label>Reason</Label>
              <Select value={formReason} onValueChange={setFormReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Adjustment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockAdjustmentPage;
