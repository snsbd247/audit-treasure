import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Package } from "lucide-react";

interface Category { id: string; name: string; }
interface Product {
  id: string; product_name: string; product_code: string; category_id: string | null;
  unit: string; selling_price: number; cost_price: number; status: string; low_stock_threshold: number;
  category_name?: string;
}

const ProductsPage = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [catName, setCatName] = useState("");

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formUnit, setFormUnit] = useState("pcs");
  const [formSellPrice, setFormSellPrice] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [formThreshold, setFormThreshold] = useState("10");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from("products").select("*").order("product_name"),
      supabase.from("product_categories").select("*").order("name"),
    ]);
    const cats = (cRes.data || []) as Category[];
    setCategories(cats);
    setProducts((pRes.data || []).map((p: any) => ({
      ...p,
      category_name: cats.find((c) => c.id === p.category_id)?.name,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditProduct(null);
    setFormName(""); setFormCode(""); setFormCategory(""); setFormUnit("pcs");
    setFormSellPrice("0"); setFormCostPrice("0"); setFormStatus("active"); setFormThreshold("10");
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setFormName(p.product_name); setFormCode(p.product_code); setFormCategory(p.category_id || "");
    setFormUnit(p.unit); setFormSellPrice(String(p.selling_price)); setFormCostPrice(String(p.cost_price));
    setFormStatus(p.status); setFormThreshold(String(p.low_stock_threshold));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) return;
    setSaving(true);
    try {
      const payload = {
        product_name: formName, product_code: formCode, category_id: formCategory || null,
        unit: formUnit, selling_price: parseFloat(formSellPrice) || 0,
        cost_price: parseFloat(formCostPrice) || 0, status: formStatus,
        low_stock_threshold: parseInt(formThreshold) || 10,
        updated_at: new Date().toISOString(),
      };
      if (editProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
      toast({ title: editProduct ? "Product updated" : "Product created" });
      setDialogOpen(false); fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleAddCategory = async () => {
    if (!catName.trim()) return;
    const { error } = await supabase.from("product_categories").insert({ name: catName });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setCatDialogOpen(false); setCatName(""); fetchData(); toast({ title: "Category added" }); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Products</h1>
        </div>
        <div className="flex gap-2">
          {hasPermission("Inventory", "can_add") && (
            <Button variant="outline" size="sm" onClick={() => setCatDialogOpen(true)}>Add Category</Button>
          )}
          {hasPermission("Inventory", "can_add") && (
            <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Product</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Sell Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No products yet</TableCell></TableRow>
              ) : products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.product_name}</TableCell>
                  <TableCell className="font-geist-mono text-xs">{p.product_code}</TableCell>
                  <TableCell className="text-muted-foreground">{p.category_name || "—"}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.cost_price.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{p.selling_price.toLocaleString()}</TableCell>
                  <TableCell><Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell>
                    {hasPermission("Inventory", "can_edit") && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Product Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Product Code</Label><Input value={formCode} onChange={(e) => setFormCode(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pcs", "kg", "ltr", "mtr", "box", "set", "pair"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Cost Price</Label><Input type="number" value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value)} /></div>
              <div className="space-y-2"><Label>Selling Price</Label><Input type="number" value={formSellPrice} onChange={(e) => setFormSellPrice(e.target.value)} /></div>
              <div className="space-y-2"><Label>Low Stock Threshold</Label><Input type="number" value={formThreshold} onChange={(e) => setFormThreshold(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Category Name</Label><Input value={catName} onChange={(e) => setCatName(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
