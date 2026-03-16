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
import { Plus, Pencil, Layers } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Supplier { id: string; name: string; }
interface RawMaterial {
  id: string; material_name: string; material_code: string; unit: string;
  cost_price: number; supplier_id: string | null; status: string; supplier_name?: string;
}

const RawMaterialsPage = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const { fc } = useCurrency();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMat, setEditMat] = useState<RawMaterial | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formUnit, setFormUnit] = useState("pcs");
  const [formCost, setFormCost] = useState("0");
  const [formSupplier, setFormSupplier] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [mRes, sRes] = await Promise.all([
      supabase.from("raw_materials").select("*").order("material_name"),
      supabase.from("suppliers").select("id, name").eq("status", "active"),
    ]);
    const sups = (sRes.data || []) as Supplier[];
    setSuppliers(sups);
    setMaterials((mRes.data || []).map((m: any) => ({ ...m, supplier_name: sups.find((s) => s.id === m.supplier_id)?.name })));
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditMat(null); setFormName(""); setFormCode(""); setFormUnit("pcs"); setFormCost("0"); setFormSupplier(""); setFormStatus("active");
    setDialogOpen(true);
  };
  const openEdit = (m: RawMaterial) => {
    setEditMat(m); setFormName(m.material_name); setFormCode(m.material_code); setFormUnit(m.unit);
    setFormCost(String(m.cost_price)); setFormSupplier(m.supplier_id || ""); setFormStatus(m.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) return;
    setSaving(true);
    try {
      const payload = { material_name: formName, material_code: formCode, unit: formUnit, cost_price: parseFloat(formCost) || 0, supplier_id: formSupplier || null, status: formStatus, updated_at: new Date().toISOString() };
      if (editMat) {
        const { error } = await supabase.from("raw_materials").update(payload).eq("id", editMat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("raw_materials").insert(payload);
        if (error) throw error;
      }
      toast({ title: editMat ? "Material updated" : "Material created" });
      setDialogOpen(false); fetchData();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Raw Materials</h1></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Material</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Material</TableHead><TableHead>Code</TableHead><TableHead>Unit</TableHead>
            <TableHead className="text-right">Cost Price</TableHead><TableHead>Supplier</TableHead><TableHead>Status</TableHead><TableHead className="w-12"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : materials.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No materials yet</TableCell></TableRow>
            : materials.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.material_name}</TableCell>
                <TableCell className="font-geist-mono text-xs">{m.material_code}</TableCell>
                <TableCell>{m.unit}</TableCell>
                <TableCell className="text-right tabular-nums">{m.cost_price.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{m.supplier_name || "—"}</TableCell>
                <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMat ? "Edit Material" : "Add Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Material Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Material Code</Label><Input value={formCode} onChange={(e) => setFormCode(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Unit</Label>
                <Select value={formUnit} onValueChange={setFormUnit}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["pcs", "kg", "ltr", "mtr", "box", "set", "sqft", "cuft"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Cost Price</Label><Input type="number" value={formCost} onChange={(e) => setFormCost(e.target.value)} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Supplier</Label>
              <Select value={formSupplier} onValueChange={setFormSupplier}><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default RawMaterialsPage;
