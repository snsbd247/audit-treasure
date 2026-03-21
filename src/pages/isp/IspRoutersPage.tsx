import { useState, useEffect, useCallback } from "react";
import { ispRouters } from "@/lib/isp-api";
import { toast } from "sonner";
import { Router, Plus, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const emptyForm = { name: "", ip_address: "", username: "admin", password: "", port: "8728", is_active: true, notes: "" };

export default function IspRoutersPage() {
  const [routers, setRouters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await ispRouters.list({ per_page: "50" });
    setRouters(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ name: r.name, ip_address: r.ip_address, username: r.username, password: "", port: String(r.port), is_active: r.is_active, notes: r.notes || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, port: Number(form.port) };
    if (editId && !payload.password) delete payload.password;
    const res = editId ? await ispRouters.update(editId, payload) : await ispRouters.create(payload);
    if (res.error) toast.error(res.error);
    else { toast.success(editId ? "Router updated" : "Router added"); setDialogOpen(false); fetchData(); }
    setSaving(false);
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    const res = await ispRouters.test({ router_id: id });
    if (res.error) toast.error("Connection failed: " + res.error);
    else toast.success("Connection successful!");
    setTesting(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this router?")) return;
    const res = await ispRouters.delete(id);
    if (res.error) toast.error(res.error);
    else { toast.success("Router deleted"); fetchData(); }
  };

  return (
    <div className="page-container space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Router className="w-6 h-6 text-primary" />MikroTik Routers</h1>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Router</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                )) : routers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No routers configured</TableCell></TableRow>
                ) : routers.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-sm">{r.ip_address}</TableCell>
                    <TableCell>{r.port}</TableCell>
                    <TableCell>
                      {r.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><Wifi className="w-3 h-3 mr-1" />Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground"><WifiOff className="w-3 h-3 mr-1" />Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>{r.customers_count ?? "—"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleTest(r.id)} disabled={testing === r.id}>
                        {testing === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Test"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(r.id)}>Delete</Button>
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
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Router</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>IP Address *</Label><Input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} placeholder="192.168.1.1" /></div>
              <div><Label>API Port</Label><Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
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
