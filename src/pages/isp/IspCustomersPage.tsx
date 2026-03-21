import { useState, useEffect, useCallback } from "react";
import { ispCustomers, ispPackages } from "@/lib/isp-api";
import { toast } from "sonner";
import { Users, Plus, Search, WifiOff, Wifi, UserX, MoreVertical, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  terminated: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const emptyForm = {
  name: "", phone: "", address: "", package_id: "", pppoe_username: "", pppoe_password: "", ip_address: "", mac_address: "",
};

export default function IspCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { per_page: "100" };
    if (search) params.search = search;
    if (statusFilter !== "__all__") params.status = statusFilter;
    const [custRes, pkgRes] = await Promise.all([
      ispCustomers.list(params),
      ispPackages.list({ per_page: "100" }),
    ]);
    setCustomers(custRes.data || []);
    setPackages(pkgRes.data || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, pppoe_username: `pppoe-${Date.now().toString(36)}` });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      name: c.name, phone: c.phone || "", address: c.address || "",
      package_id: c.package_id || "", pppoe_username: c.pppoe_username,
      pppoe_password: "", ip_address: c.ip_address || "", mac_address: c.mac_address || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form };
    if (editId && !payload.pppoe_password) delete (payload as any).pppoe_password;
    const res = editId ? await ispCustomers.update(editId, payload) : await ispCustomers.create(payload);
    if (res.error) { toast.error(res.error); } else {
      toast.success(editId ? "Customer updated" : "Customer created");
      setDialogOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleAction = async (id: string, action: "suspend" | "activate" | "disconnect") => {
    const fn = action === "suspend" ? ispCustomers.suspend : action === "activate" ? ispCustomers.activate : ispCustomers.disconnect;
    const res = await fn(id);
    if (res.error) toast.error(res.error);
    else { toast.success(`Customer ${action}d`); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    const res = await ispCustomers.delete(id);
    if (res.error) toast.error(res.error);
    else { toast.success("Customer deleted"); fetchData(); }
  };

  return (
    <div className="page-container space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> ISP Customers
        </h1>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Customer</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, phone, PPPoE..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>PPPoE User</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
                ) : (
                  customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{c.pppoe_username}</TableCell>
                      <TableCell>{c.package?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[c.status] || ""}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(c)}>Edit</DropdownMenuItem>
                            {c.status === "active" && <DropdownMenuItem onClick={() => handleAction(c.id, "suspend")} className="text-red-600">Suspend</DropdownMenuItem>}
                            {c.status !== "active" && <DropdownMenuItem onClick={() => handleAction(c.id, "activate")} className="text-emerald-600">Activate</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => handleAction(c.id, "disconnect")}>Disconnect Session</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Customer</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div>
              <Label>Package *</Label>
              <Select value={form.package_id} onValueChange={(v) => setForm({ ...form, package_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{packages.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.speed})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>PPPoE Username *</Label><Input value={form.pppoe_username} onChange={(e) => setForm({ ...form, pppoe_username: e.target.value })} /></div>
            <div><Label>PPPoE Password {editId ? "(leave blank to keep)" : "*"}</Label><Input type="password" value={form.pppoe_password} onChange={(e) => setForm({ ...form, pppoe_password: e.target.value })} /></div>
            <div><Label>IP Address</Label><Input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} placeholder="Auto or static" /></div>
            <div><Label>MAC Address</Label><Input value={form.mac_address} onChange={(e) => setForm({ ...form, mac_address: e.target.value })} /></div>
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
