import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, ClipboardList, Pencil, Trash2 } from "lucide-react";

interface BomRow {
  id: string;
  name: string;
  product_id: string;
  notes: string | null;
  created_at: string;
  product?: { item_name: string; item_code: string };
  items?: { id: string; material_id: string; quantity: number; unit: string; material?: { item_name: string } }[];
}

const BOMPage = () => {
  const [boms, setBoms] = useState<BomRow[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", product_id: "", notes: "" });
  const [bomItems, setBomItems] = useState<{ material_id: string; quantity: number; unit: string }[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [bomRes, prodRes, matRes] = await Promise.all([
      supabase.from("bill_of_materials").select("*, product:item_master(item_name, item_code)").order("created_at", { ascending: false }),
      supabase.from("item_master").select("id, item_name, item_code").eq("status", "active").order("item_name"),
      supabase.from("item_master").select("id, item_name, item_code").eq("status", "active").order("item_name"),
    ]);
    const bomsData = (bomRes.data || []) as any[];
    // fetch items for each bom
    for (const bom of bomsData) {
      const { data: items } = await supabase.from("bom_items").select("*, material:item_master(item_name)").eq("bom_id", bom.id);
      bom.items = items || [];
    }
    setBoms(bomsData);
    setProducts((prodRes.data || []) as any[]);
    setMaterials((matRes.data || []) as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", product_id: "", notes: "" });
    setBomItems([{ material_id: "", quantity: 1, unit: "pcs" }]);
    setDialogOpen(true);
  };

  const openEdit = (bom: BomRow) => {
    setEditId(bom.id);
    setForm({ name: bom.name, product_id: bom.product_id, notes: bom.notes || "" });
    setBomItems((bom.items || []).map((i) => ({ material_id: i.material_id, quantity: i.quantity, unit: i.unit })));
    setDialogOpen(true);
  };

  const addItem = () => setBomItems([...bomItems, { material_id: "", quantity: 1, unit: "pcs" }]);
  const removeItem = (idx: number) => setBomItems(bomItems.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!form.name || !form.product_id || bomItems.some((i) => !i.material_id)) {
      toast.error("Please fill all required fields");
      return;
    }
    if (editId) {
      await supabase.from("bill_of_materials").update({ name: form.name, product_id: form.product_id, notes: form.notes || null } as any).eq("id", editId);
      await supabase.from("bom_items").delete().eq("bom_id", editId);
      await supabase.from("bom_items").insert(bomItems.map((i) => ({ bom_id: editId, ...i })));
      toast.success("BOM updated");
    } else {
      const { data } = await supabase.from("bill_of_materials").insert({ name: form.name, product_id: form.product_id, notes: form.notes || null }).select().single();
      if (data) {
        await supabase.from("bom_items").insert(bomItems.map((i) => ({ bom_id: (data as any).id, ...i })));
      }
      toast.success("BOM created");
    }
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this BOM?")) return;
    await supabase.from("bill_of_materials").delete().eq("id", id);
    toast.success("BOM deleted");
    fetchAll();
  };

  const filtered = boms.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Bill of Materials</h1>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />New BOM</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search BOMs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BOM Name</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No BOMs found</TableCell></TableRow>
              ) : filtered.map((bom) => (
                <TableRow key={bom.id}>
                  <TableCell className="font-medium">{bom.name}</TableCell>
                  <TableCell>{bom.product?.item_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{(bom.items || []).map((i) => i.material?.item_name).join(", ") || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">{bom.notes || "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(bom)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(bom.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit BOM" : "Create BOM"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>BOM Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Widget Assembly" />
              </div>
              <div className="space-y-2">
                <Label>Finished Product *</Label>
                <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.item_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Materials</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add Material</Button>
              </div>
              {bomItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select value={item.material_id} onValueChange={(v) => { const n = [...bomItems]; n[idx].material_id = v; setBomItems(n); }}>
                      <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                      <SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.item_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input type="number" className="w-24" value={item.quantity} onChange={(e) => { const n = [...bomItems]; n[idx].quantity = Number(e.target.value); setBomItems(n); }} />
                  <Input className="w-20" value={item.unit} onChange={(e) => { const n = [...bomItems]; n[idx].unit = e.target.value; setBomItems(n); }} />
                  {bomItems.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
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

export default BOMPage;
