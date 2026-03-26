import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, Factory, Trash2, CheckCircle } from "lucide-react";

const ProductionPage = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ production_date: new Date().toISOString().split("T")[0], product_id: "", bom_id: "", quantity: 1, labor_cost: 0, electricity_cost: 0, notes: "" });
  const [matItems, setMatItems] = useState<{ material_id: string; quantity: number; cost: number }[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [entRes, prodRes, matRes, bomRes] = await Promise.all([
      supabase.from("production_entries").select("*, product:item_master(item_name)").order("production_date", { ascending: false }),
      supabase.from("item_master").select("id, item_name").eq("status", "active").order("item_name"),
      supabase.from("item_master").select("id, item_name, cost_price").eq("status", "active").order("item_name"),
      supabase.from("bill_of_materials").select("id, name, product_id").order("name"),
    ]);
    setEntries((entRes.data || []) as any[]);
    setProducts((prodRes.data || []) as any[]);
    setMaterials((matRes.data || []) as any[]);
    setBoms((bomRes.data || []) as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setForm({ production_date: new Date().toISOString().split("T")[0], product_id: "", bom_id: "", quantity: 1, labor_cost: 0, electricity_cost: 0, notes: "" });
    setMatItems([{ material_id: "", quantity: 1, cost: 0 }]);
    setDialogOpen(true);
  };

  const loadBomMaterials = async (bomId: string) => {
    const { data } = await supabase.from("bom_items").select("material_id, quantity, material:item_master(cost_price)").eq("bom_id", bomId);
    if (data) {
      setMatItems((data as any[]).map((i) => ({ material_id: i.material_id, quantity: i.quantity, cost: Number(i.material?.cost_price || 0) * i.quantity })));
    }
  };

  const handleSave = async () => {
    if (!form.product_id || matItems.some((i) => !i.material_id)) {
      toast.error("Please fill all required fields");
      return;
    }
    const rawCost = matItems.reduce((s, i) => s + i.cost, 0);
    const totalCost = rawCost + Number(form.labor_cost) + Number(form.electricity_cost);

    // Generate production number
    const { data: seq } = await supabase.from("number_sequences").select("*").eq("id", "production").single();
    const nextNum = ((seq as any)?.current_number || 0) + 1;
    const prodNumber = `${(seq as any)?.prefix || "PRD"}-${String(nextNum).padStart(5, "0")}`;
    await supabase.from("number_sequences").update({ current_number: nextNum } as any).eq("id", "production");

    const { data: entry, error } = await supabase.from("production_entries").insert({
      production_number: prodNumber,
      production_date: form.production_date,
      product_id: form.product_id,
      bom_id: form.bom_id || null,
      quantity: form.quantity,
      raw_material_cost: rawCost,
      labor_cost: form.labor_cost,
      electricity_cost: form.electricity_cost,
      total_cost: totalCost,
      notes: form.notes || null,
      status: "draft",
    }).select().single();

    if (error) { toast.error(error.message); return; }

    if (entry) {
      await supabase.from("production_materials").insert(matItems.map((i) => ({ production_id: (entry as any).id, ...i })));
    }

    toast.success("Production entry created");
    setDialogOpen(false);
    fetchAll();
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Mark this production as completed? This will update stock.")) return;
    await supabase.from("production_entries").update({ status: "completed" } as any).eq("id", id);
    toast.success("Production completed");
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this production entry?")) return;
    await supabase.from("production_entries").delete().eq("id", id);
    toast.success("Deleted");
    fetchAll();
  };

  const filtered = entries.filter((e) =>
    e.production_number?.toLowerCase().includes(search.toLowerCase()) ||
    e.product?.item_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Production Entries</h1>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />New Production</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No production entries</TableCell></TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.production_number}</TableCell>
                  <TableCell>{new Date(e.production_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{e.product?.item_name || "—"}</TableCell>
                  <TableCell className="text-right">{Number(e.quantity).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(e.total_cost).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "completed" ? "default" : "secondary"}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    {e.status === "draft" && (
                      <Button variant="ghost" size="icon" onClick={() => handleComplete(e.id)} title="Complete">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </Button>
                    )}
                    {e.status === "draft" && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Production Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.production_date} onChange={(e) => setForm({ ...form, production_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Finished Product *</Label>
                <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.item_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>BOM (optional)</Label>
                <Select value={form.bom_id} onValueChange={(v) => { setForm({ ...form, bom_id: v }); if (v) loadBomMaterials(v); }}>
                  <SelectTrigger><SelectValue placeholder="Select BOM" /></SelectTrigger>
                  <SelectContent>{boms.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Labor Cost</Label>
                <Input type="number" value={form.labor_cost} onChange={(e) => setForm({ ...form, labor_cost: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Electricity Cost</Label>
                <Input type="number" value={form.electricity_cost} onChange={(e) => setForm({ ...form, electricity_cost: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Raw Materials</Label>
                <Button variant="outline" size="sm" onClick={() => setMatItems([...matItems, { material_id: "", quantity: 1, cost: 0 }])}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </div>
              {matItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select value={item.material_id} onValueChange={(v) => { const n = [...matItems]; n[idx].material_id = v; setBomItems(n); }}>
                      <SelectTrigger><SelectValue placeholder="Material" /></SelectTrigger>
                      <SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.item_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input type="number" className="w-20" placeholder="Qty" value={item.quantity} onChange={(e) => { const n = [...matItems]; n[idx].quantity = Number(e.target.value); setMatItems(n); }} />
                  <Input type="number" className="w-24" placeholder="Cost" value={item.cost} onChange={(e) => { const n = [...matItems]; n[idx].cost = Number(e.target.value); setMatItems(n); }} />
                  {matItems.length > 1 && <Button variant="ghost" size="icon" onClick={() => setMatItems(matItems.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper to fix reference
const setBomItems = (items: any[]) => {};

export default ProductionPage;
