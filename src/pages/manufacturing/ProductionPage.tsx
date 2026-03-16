import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { createProductionEntry } from "@/lib/transaction-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Factory } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Product { id: string; product_name: string; product_code: string; }
interface Branch { id: string; name: string; }
interface RawMaterial { id: string; material_name: string; material_code: string; unit: string; cost_price: number; }
interface BOM { id: string; product_id: string; name: string; }
interface MatRow { id: string; material_id: string; quantity: number; cost: number; unit: string; }

interface ProdEntry {
  id: string; production_number: string; production_date: string; product_id: string;
  quantity: number; raw_material_cost: number; labor_cost: number; electricity_cost: number;
  total_cost: number; notes: string | null; product_name?: string;
}

const ProductionPage = () => {
  const { user } = useAuth();
  const { userBranchId } = useBranch();
  const { toast } = useToast();
  const { fc } = useCurrency();
  const [entries, setEntries] = useState<ProdEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formProduct, setFormProduct] = useState("");
  const [formBom, setFormBom] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formBranch, setFormBranch] = useState("");
  const [formLabor, setFormLabor] = useState("0");
  const [formElec, setFormElec] = useState("0");
  const [formNotes, setFormNotes] = useState("");
  const [matRows, setMatRows] = useState<MatRow[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [eRes, pRes, bRes, mRes, bomRes] = await Promise.all([
      supabase.from("production_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, product_name, product_code").eq("status", "active"),
      supabase.from("branches").select("id, name").eq("status", "active"),
      supabase.from("raw_materials").select("*").eq("status", "active"),
      supabase.from("bill_of_materials").select("*"),
    ]);
    const prods = (pRes.data || []) as Product[];
    setProducts(prods);
    setBranches((bRes.data || []) as Branch[]);
    setMaterials((mRes.data || []) as RawMaterial[]);
    setBoms((bomRes.data || []) as BOM[]);
    setEntries((eRes.data || []).map((e: any) => ({ ...e, product_name: prods.find((p) => p.id === e.product_id)?.product_name })));
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const productBoms = boms.filter((b) => b.product_id === formProduct);

  const loadBomMaterials = async (bomId: string) => {
    const { data } = await supabase.from("bom_items").select("*").eq("bom_id", bomId);
    const qty = parseFloat(formQty) || 1;
    const rows: MatRow[] = (data || []).map((i: any) => {
      const mat = materials.find((m) => m.id === i.material_id);
      const neededQty = Number(i.quantity) * qty;
      return {
        id: i.id, material_id: i.material_id, quantity: neededQty,
        cost: neededQty * (mat?.cost_price || 0), unit: mat?.unit || "pcs",
      };
    });
    setMatRows(rows);
  };

  useEffect(() => {
    if (formBom) loadBomMaterials(formBom);
  }, [formBom, formQty]);

  const rawMaterialCost = matRows.reduce((s, r) => s + r.cost, 0);
  const totalCost = rawMaterialCost + (parseFloat(formLabor) || 0) + (parseFloat(formElec) || 0);

  const openCreate = () => {
    setFormDate(new Date().toISOString().slice(0, 10)); setFormProduct(""); setFormBom("");
    setFormQty("1"); setFormBranch(""); setFormLabor("0"); setFormElec("0"); setFormNotes(""); setMatRows([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formProduct || matRows.length === 0) { toast({ title: "Select product and BOM", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const ctx = { date: formDate, branchId: formBranch || userBranchId || null, userId: user?.id };
      const result = await createProductionEntry(
        ctx, formProduct, formBom || null, parseFloat(formQty) || 1,
        parseFloat(formLabor) || 0, parseFloat(formElec) || 0, rawMaterialCost, formNotes,
        matRows.map((r) => ({ material_id: r.material_id, quantity: r.quantity, cost: r.cost }))
      );
      toast({ title: `Production ${result.productionNumber} recorded` });
      setDialogOpen(false); fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Factory className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Production</h1></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />New Production</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Production #</TableHead><TableHead>Date</TableHead><TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Material Cost</TableHead>
            <TableHead className="text-right">Labor</TableHead><TableHead className="text-right">Total Cost</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : entries.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No production entries</TableCell></TableRow>
            : entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-geist-mono text-xs font-medium">{e.production_number}</TableCell>
                <TableCell>{e.production_date}</TableCell>
                <TableCell className="font-medium">{e.product_name}</TableCell>
                <TableCell className="text-right tabular-nums">{e.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">{fc(e.raw_material_cost)}</TableCell>
                <TableCell className="text-right tabular-nums">{fc(e.labor_cost)}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{fc(e.total_cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Production Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Product</Label>
                <Select value={formProduct} onValueChange={(v) => { setFormProduct(v); setFormBom(""); setMatRows([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Quantity to Produce</Label><Input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Bill of Materials</Label>
                <Select value={formBom} onValueChange={setFormBom}><SelectTrigger><SelectValue placeholder="Select BOM" /></SelectTrigger>
                  <SelectContent>{productBoms.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Branch</Label>
                <Select value={formBranch} onValueChange={setFormBranch}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>

            {matRows.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Materials to Consume</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Material</TableHead><TableHead className="text-right">Qty Needed</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Cost</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {matRows.map((r) => {
                        const mat = materials.find((m) => m.id === r.material_id);
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{mat?.material_name || "—"}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                            <TableCell>{r.unit}</TableCell>
                            <TableCell className="text-right tabular-nums">{fc(r.cost)}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={3} className="text-right">Raw Material Cost</TableCell>
                        <TableCell className="text-right tabular-nums">{fc(rawMaterialCost)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Labor Cost</Label><Input type="number" value={formLabor} onChange={(e) => setFormLabor(e.target.value)} /></div>
              <div className="space-y-2"><Label>Electricity Cost</Label><Input type="number" value={formElec} onChange={(e) => setFormElec(e.target.value)} /></div>
              <div className="space-y-2"><Label>Total Production Cost</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-muted text-foreground font-medium tabular-nums">{fc(totalCost)}</div></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Production"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ProductionPage;
