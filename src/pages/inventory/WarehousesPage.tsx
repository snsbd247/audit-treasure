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
import { Plus, Pencil, Warehouse as WarehouseIcon } from "lucide-react";

interface WH { id: string; warehouse_code: string; warehouse_name: string; branch_id: string | null; description: string | null; status: string; }
interface Branch { id: string; name: string; }

const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editWH, setEditWH] = useState<WH | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [f, setF] = useState({ warehouse_code: "", warehouse_name: "", branch_id: "", description: "", status: "active" });
  const upd = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const fetchData = async () => {
    setLoading(true);
    const [wRes, bRes] = await Promise.all([
      supabase.from("warehouses" as any).select("*").order("warehouse_name"),
      supabase.from("branches").select("id, name").eq("status", "active"),
    ]);
    setWarehouses((wRes.data || []) as any);
    setBranches((bRes.data || []) as Branch[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  const openCreate = () => { setEditWH(null); setF({ warehouse_code: "", warehouse_name: "", branch_id: "", description: "", status: "active" }); setDialogOpen(true); };
  const openEdit = (w: WH) => { setEditWH(w); setF({ warehouse_code: w.warehouse_code, warehouse_name: w.warehouse_name, branch_id: w.branch_id || "", description: w.description || "", status: w.status }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!f.warehouse_code.trim() || !f.warehouse_name.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        warehouse_code: f.warehouse_code, warehouse_name: f.warehouse_name,
        branch_id: f.branch_id || null, description: f.description || null,
        status: f.status, updated_at: new Date().toISOString(),
      };
      if (editWH) {
        const { error } = await supabase.from("warehouses" as any).update(payload).eq("id", editWH.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("warehouses" as any).insert(payload);
        if (error) throw error;
      }
      toast({ title: editWH ? "Warehouse updated" : "Warehouse created" });
      setDialogOpen(false); fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><WarehouseIcon className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Warehouses</h1></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Warehouse</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Branch</TableHead>
            <TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead className="w-16">Edit</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : warehouses.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No warehouses</TableCell></TableRow>
            : warehouses.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-xs">{w.warehouse_code}</TableCell>
                <TableCell className="font-medium">{w.warehouse_name}</TableCell>
                <TableCell className="text-muted-foreground">{branchMap.get(w.branch_id || "") || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{w.description || "—"}</TableCell>
                <TableCell><Badge variant={w.status === "active" ? "default" : "secondary"}>{w.status}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(w)}><Pencil className="w-3.5 h-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editWH ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Code *</Label><Input value={f.warehouse_code} onChange={(e) => upd("warehouse_code", e.target.value)} placeholder="WH-001" /></div>
              <div className="space-y-2"><Label>Name *</Label><Input value={f.warehouse_name} onChange={(e) => upd("warehouse_name", e.target.value)} placeholder="Main Warehouse" /></div>
            </div>
            <div className="space-y-2"><Label>Branch</Label>
              <Select value={f.branch_id || "__none__"} onValueChange={(v) => upd("branch_id", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Branch</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={f.description} onChange={(e) => upd("description", e.target.value)} /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => upd("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehousesPage;
