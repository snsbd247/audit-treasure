import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Package, Search } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const ITEM_TYPES = [
  { value: "raw_material", label: "Raw Material" },
  { value: "finished_goods", label: "Finished Goods" },
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "consumable", label: "Consumable" },
];

interface Item { id: string; item_code: string; item_name: string; item_type: string; category_id: string | null; unit_id: string | null; cost_price: number; selling_price: number; min_stock_level: number; status: string; description: string | null; }
interface Category { id: string; name: string; }
interface Unit { id: string; name: string; abbreviation: string; }

const ItemMasterPage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const { fc } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("__all__");
  const { toast } = useToast();

  // Form
  const [f, setF] = useState({ item_code: "", item_name: "", item_type: "product", category_id: "", unit_id: "", cost_price: "0", selling_price: "0", min_stock_level: "0", status: "active", description: "" });
  const upd = (key: string, val: string) => setF((p) => ({ ...p, [key]: val }));

  const fetchData = async () => {
    setLoading(true);
    const [iRes, cRes, uRes] = await Promise.all([
      supabase.from("item_master" as any).select("*").order("item_code"),
      supabase.from("item_categories" as any).select("id, name").eq("is_active", true).order("name"),
      supabase.from("units" as any).select("*").order("name"),
    ]);
    setItems((iRes.data || []) as any);
    setCategories((cRes.data || []) as any);
    setUnits((uRes.data || []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setF({ item_code: "", item_name: "", item_type: "product", category_id: "", unit_id: "", cost_price: "0", selling_price: "0", min_stock_level: "0", status: "active", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (i: Item) => {
    setEditItem(i);
    setF({
      item_code: i.item_code, item_name: i.item_name, item_type: i.item_type,
      category_id: i.category_id || "", unit_id: i.unit_id || "",
      cost_price: String(i.cost_price), selling_price: String(i.selling_price),
      min_stock_level: String(i.min_stock_level), status: i.status, description: i.description || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!f.item_code.trim() || !f.item_name.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        item_code: f.item_code, item_name: f.item_name, item_type: f.item_type,
        category_id: f.category_id || null, unit_id: f.unit_id || null,
        cost_price: parseFloat(f.cost_price) || 0, selling_price: parseFloat(f.selling_price) || 0,
        min_stock_level: parseFloat(f.min_stock_level) || 0, status: f.status,
        description: f.description || null, updated_at: new Date().toISOString(),
      };
      if (editItem) {
        const { error } = await supabase.from("item_master" as any).update(payload).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("item_master" as any).insert(payload);
        if (error) throw error;
      }
      toast({ title: editItem ? "Item updated" : "Item created" });
      setDialogOpen(false); fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const unitMap = new Map(units.map((u) => [u.id, u.abbreviation]));

  const filtered = items.filter((i) => {
    if (filterType !== "__all__" && i.item_type !== filterType) return false;
    if (search && !i.item_name.toLowerCase().includes(search.toLowerCase()) && !i.item_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeLabel = (t: string) => ITEM_TYPES.find((x) => x.value === t)?.label || t;
  const typeColor = (t: string): "default" | "secondary" | "outline" | "destructive" => {
    if (t === "raw_material") return "secondary";
    if (t === "finished_goods") return "default";
    if (t === "service") return "outline";
    return "default";
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Item Master</h1></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
      </div>

      <div className="flex gap-3 items-end">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Types</SelectItem>
            {ITEM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead>
            <TableHead>Category</TableHead><TableHead>Unit</TableHead>
            <TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Selling</TableHead>
            <TableHead>Status</TableHead><TableHead className="w-16">Edit</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No items found</TableCell></TableRow>
            : filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.item_code}</TableCell>
                <TableCell className="font-medium">{i.item_name}</TableCell>
                <TableCell><Badge variant={typeColor(i.item_type)} className="text-xs">{typeLabel(i.item_type)}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{catMap.get(i.category_id || "") || "—"}</TableCell>
                <TableCell className="text-sm">{unitMap.get(i.unit_id || "") || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{i.cost_price.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{i.selling_price.toLocaleString()}</TableCell>
                <TableCell><Badge variant={i.status === "active" ? "default" : "secondary"}>{i.status}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(i)}><Pencil className="w-3.5 h-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editItem ? "Edit Item" : "Add Item"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Item Code *</Label><Input value={f.item_code} onChange={(e) => upd("item_code", e.target.value)} /></div>
            <div className="space-y-2"><Label>Item Name *</Label><Input value={f.item_name} onChange={(e) => upd("item_name", e.target.value)} /></div>
            <div className="space-y-2"><Label>Item Type</Label>
              <Select value={f.item_type} onValueChange={(v) => upd("item_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ITEM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={f.category_id || "__none__"} onValueChange={(v) => upd("category_id", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Unit</Label>
              <Select value={f.unit_id || "__none__"} onValueChange={(v) => upd("unit_id", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => upd("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cost Price</Label><Input type="number" value={f.cost_price} onChange={(e) => upd("cost_price", e.target.value)} /></div>
            <div className="space-y-2"><Label>Selling Price</Label><Input type="number" value={f.selling_price} onChange={(e) => upd("selling_price", e.target.value)} /></div>
            <div className="space-y-2"><Label>Min Stock Level</Label><Input type="number" value={f.min_stock_level} onChange={(e) => upd("min_stock_level", e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={f.description} onChange={(e) => upd("description", e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemMasterPage;
