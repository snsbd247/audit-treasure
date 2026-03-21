import { useState, useEffect, useCallback } from "react";
import { ispPackages } from "@/lib/isp-api";
import { toast } from "sonner";
import { Package, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const emptyForm = { name: "", speed: "", price: "", billing_cycle: "30", mikrotik_profile: "" };

export default function IspPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await ispPackages.list({ per_page: "100" });
    setPackages(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({ name: p.name, speed: p.speed, price: String(p.price), billing_cycle: String(p.billing_cycle), mikrotik_profile: p.mikrotik_profile || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, price: Number(form.price), billing_cycle: Number(form.billing_cycle) };
    const res = editId ? await ispPackages.update(editId, payload) : await ispPackages.create(payload);
    if (res.error) toast.error(res.error);
    else { toast.success(editId ? "Package updated" : "Package created"); setDialogOpen(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    const res = await ispPackages.delete(id);
    if (res.error) toast.error(res.error);
    else { toast.success("Package deleted"); fetchData(); }
  };

  return (
    <div className="page-container space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-primary" />ISP Packages</h1>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Package</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Price (৳)</TableHead>
                  <TableHead>Cycle (days)</TableHead>
                  <TableHead>MikroTik Profile</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                )) : packages.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No packages</TableCell></TableRow>
                ) : packages.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="secondary">{p.speed}</Badge></TableCell>
                    <TableCell>৳{Number(p.price).toLocaleString()}</TableCell>
                    <TableCell>{p.billing_cycle} days</TableCell>
                    <TableCell className="font-mono text-xs">{p.mikrotik_profile || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Package</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Speed *</Label><Input value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })} placeholder="e.g. 20Mbps" /></div>
              <div><Label>Price (৳) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Billing Cycle (days)</Label><Input type="number" value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })} /></div>
              <div><Label>MikroTik Profile</Label><Input value={form.mikrotik_profile} onChange={(e) => setForm({ ...form, mikrotik_profile: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
