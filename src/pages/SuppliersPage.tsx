import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logEditAudit } from "@/lib/audit-utils";
import { documentApi } from "@/lib/document-api";
import { getDocumentStatusConfig } from "@/hooks/useDocumentRules";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Check, X, ShieldAlert, Eye } from "lucide-react";

const SuppliersPage = () => {
  const navigate = useNavigate();
  const { user, profile, hasPermission, isSuperAdmin } = useAuth();
  const isAdmin = hasPermission("purchase", "can_edit");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const canEdit = hasPermission("purchase", "can_edit") || isSuperAdmin;
  const canAdd = hasPermission("purchase", "can_add") || isSuperAdmin;

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "cancel" | null>(null);
  const [actionTarget, setActionTarget] = useState<any | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setSuppliers(data || []);
  };

  const openCreate = () => {
    setEditingSupplier(null);
    setForm({ name: "", email: "", phone: "", address: "" });
    setOpen(true);
  };

  const openEdit = (s: any) => {
    if (s.status === "approved" && !isSuperAdmin) {
      toast({ title: "Locked", description: "Only Super Admin can edit approved suppliers", variant: "destructive" });
      return;
    }
    if (s.status === "cancelled") {
      toast({ title: "Locked", description: "Cancelled records cannot be edited", variant: "destructive" });
      return;
    }
    setEditingSupplier(s);
    setForm({ name: s.name, email: s.email || "", phone: s.phone || "", address: s.address || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingSupplier) {
        const isApprovedEdit = editingSupplier.status === "approved";
        if (isApprovedEdit && isSuperAdmin) {
          await documentApi.editApproved("supplier", editingSupplier.id, {
            name: form.name, email: form.email || null, phone: form.phone || null, address: form.address || null,
          });
        } else {
          const oldValues = { name: editingSupplier.name, email: editingSupplier.email, phone: editingSupplier.phone, address: editingSupplier.address };
          const newValues = { name: form.name, email: form.email || null, phone: form.phone || null, address: form.address || null };
          const { error } = await supabase.from("suppliers").update(newValues).eq("id", editingSupplier.id);
          if (error) throw error;
          await logEditAudit({ userId: user?.id, userName: profile?.name, module: "Purchase", action: "Edit Supplier", recordId: editingSupplier.id, oldValues, newValues });
        }
        toast({ title: "Supplier updated" });
      } else {
        const { error } = await supabase.from("suppliers").insert({ ...form, status: "active" });
        if (error) throw error;
        toast({ title: "Supplier added" });
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDocAction = async () => {
    if (!actionTarget || !actionType) return;
    setSaving(true);
    try {
      if (actionType === "approve") {
        await documentApi.approve("supplier", actionTarget.id);
        toast({ title: `Supplier ${actionTarget.name} approved` });
      } else if (actionType === "cancel") {
        await documentApi.cancel("supplier", actionTarget.id);
        toast({ title: `Supplier ${actionTarget.name} cancelled` });
      }
      setActionDialogOpen(false);
      setActionTarget(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Suppliers</h1>
        {canAdd && <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Supplier</Button>}
      </div>
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const statusCfg = getDocumentStatusConfig(s.status);
                const isLocked = s.status === "approved" && !isSuperAdmin;
                const isCancelled = s.status === "cancelled";
                return (
                  <TableRow key={s.id} className={isCancelled ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.email || "—"}</TableCell>
                    <TableCell>{s.phone || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/suppliers/${s.id}`)} title="View Profile">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        {(s.status === "active" || s.status === "draft") && (isAdmin || isSuperAdmin) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => { setActionTarget(s); setActionType("approve"); setActionDialogOpen(true); }} title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!isCancelled && !isLocked && canEdit && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {isSuperAdmin && s.status === "approved" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => openEdit(s)} title="Super Admin Edit">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!isCancelled && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setActionTarget(s); setActionType("cancel"); setActionDialogOpen(true); }} title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No suppliers found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSupplier ? "Edit Supplier" : "New Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : editingSupplier ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionType === "approve" ? "Approve Supplier" : "Cancel Supplier"}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? `Approve supplier "${actionTarget?.name}"? This will lock editing for normal users.`
                : `Cancel supplier "${actionTarget?.name}"? This record will be deactivated.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDocAction} disabled={saving}>
              {saving ? "Processing..." : actionType === "approve" ? "Approve" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuppliersPage;
