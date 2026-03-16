import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";

interface Product { id: string; product_name: string; product_code: string; }
interface RawMaterial { id: string; material_name: string; material_code: string; unit: string; cost_price: number; }
interface BOMItemRow { id: string; material_id: string; quantity: number; unit: string; }
interface BOM { id: string; product_id: string; name: string; notes: string | null; product_name?: string; }

const BOMPage = () => {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBom, setEditBom] = useState<BOM | null>(null);
  const [saving, setSaving] = useState(false);

  const [formProduct, setFormProduct] = useState("");
  const [formName, setFormName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [items, setItems] = useState<BOMItemRow[]>([{ id: "1", material_id: "", quantity: 1, unit: "pcs" }]);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [bRes, pRes, mRes] = await Promise.all([
      supabase.from("bill_of_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("item_master").select("id, item_name, item_code").eq("status", "active").in("item_type", ["product", "finished_goods"]),
      supabase.from("item_master").select("id, item_name, item_code, cost_price, item_type").eq("status", "active").eq("item_type", "raw_material"),
    ]);
    const prods = (pRes.data || []).map((i: any) => ({ id: i.id, product_name: i.item_name, product_code: i.item_code })) as Product[];
    setProducts(prods);
    setMaterials((mRes.data || []).map((i: any) => ({ id: i.id, material_name: i.item_name, material_code: i.item_code, unit: "pcs", cost_price: i.cost_price })) as RawMaterial[]);
    setBoms((bRes.data || []).map((b: any) => ({ ...b, product_name: prods.find((p) => p.id === b.product_id)?.product_name })));
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditBom(null); setFormProduct(""); setFormName(""); setFormNotes("");
    setItems([{ id: "1", material_id: "", quantity: 1, unit: "pcs" }]);
    setDialogOpen(true);
  };

  const openEdit = async (bom: BOM) => {
    setEditBom(bom); setFormProduct(bom.product_id); setFormName(bom.name); setFormNotes(bom.notes || "");
    const { data } = await supabase.from("bom_items").select("*").eq("bom_id", bom.id);
    setItems((data || []).map((i: any) => ({ id: i.id, material_id: i.material_id, quantity: Number(i.quantity), unit: i.unit })));
    if (!data || data.length === 0) setItems([{ id: "1", material_id: "", quantity: 1, unit: "pcs" }]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formProduct || !formName.trim()) return;
    const validItems = items.filter((i) => i.material_id && i.quantity > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one material", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let bomId: string;
      if (editBom) {
        const { error } = await supabase.from("bill_of_materials").update({ product_id: formProduct, name: formName, notes: formNotes, updated_at: new Date().toISOString() }).eq("id", editBom.id);
        if (error) throw error;
        bomId = editBom.id;
        await supabase.from("bom_items").delete().eq("bom_id", bomId);
      } else {
        const { data, error } = await supabase.from("bill_of_materials").insert({ product_id: formProduct, name: formName, notes: formNotes }).select().single();
        if (error) throw error;
        bomId = (data as any).id;
      }
      const rows = validItems.map((i) => ({ bom_id: bomId, material_id: i.material_id, quantity: i.quantity, unit: i.unit }));
      await supabase.from("bom_items").insert(rows);
      toast({ title: editBom ? "BOM updated" : "BOM created" });
      setDialogOpen(false); fetchData();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this BOM?")) return;
    const { error } = await supabase.from("bill_of_materials").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchData();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Bill of Materials</h1></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Create BOM</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>BOM Name</TableHead><TableHead>Product</TableHead><TableHead>Notes</TableHead><TableHead className="w-24"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : boms.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No BOMs yet</TableCell></TableRow>
            : boms.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.product_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{b.notes || "—"}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editBom ? "Edit BOM" : "Create BOM"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Product</Label>
                <Select value={formProduct} onValueChange={setFormProduct}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>BOM Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Standard Chair BOM" /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} /></div>
            <Card>
              <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Materials Required</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-[45%]">Material</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead>Unit</TableHead><TableHead className="w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select value={item.material_id} onValueChange={(v) => {
                            const mat = materials.find((m) => m.id === v);
                            setItems(items.map((i) => i.id === item.id ? { ...i, material_id: v, unit: mat?.unit || i.unit } : i));
                          }}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select material" /></SelectTrigger>
                            <SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.material_code} — {m.material_name}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input type="number" className="h-9 text-right" value={item.quantity || ""} onChange={(e) => setItems(items.map((i) => i.id === item.id ? { ...i, quantity: parseFloat(e.target.value) || 0 } : i))} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => setItems(items.filter((i) => i.id !== item.id))} disabled={items.length <= 1}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { id: String(Date.now()), material_id: "", quantity: 1, unit: "pcs" }])}><Plus className="w-4 h-4 mr-1" />Add Material</Button>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default BOMPage;
