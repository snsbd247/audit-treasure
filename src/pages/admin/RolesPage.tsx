import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";

/** All permission modules — must match backend seeder & route middleware */
const MODULES: { key: string; label: string; group: string }[] = [
  // Core
  { key: "dashboard", label: "Dashboard", group: "Core" },
  // Accounting
  { key: "accounts", label: "Chart of Accounts", group: "Accounting" },
  { key: "journal", label: "Journal Voucher", group: "Accounting" },
  { key: "payment", label: "Payment Voucher", group: "Accounting" },
  { key: "receipt", label: "Receipt Voucher", group: "Accounting" },
  { key: "contra", label: "Contra Voucher", group: "Accounting" },
  // Business
  { key: "sales", label: "Sales", group: "Business" },
  { key: "purchase", label: "Purchase", group: "Business" },
  { key: "inventory", label: "Inventory", group: "Business" },
  { key: "manufacturing", label: "Manufacturing", group: "Business" },
  { key: "bank", label: "Bank & Cash", group: "Business" },
  // HRM
  { key: "hrm", label: "HRM & Payroll", group: "HRM" },
  // Reports
  { key: "reports", label: "Reports", group: "Reports" },
  // Administration
  { key: "branches", label: "Branches", group: "Administration" },
  { key: "users", label: "Users", group: "Administration" },
  { key: "roles", label: "Roles", group: "Administration" },
  { key: "financial_years", label: "Financial Years", group: "Administration" },
  { key: "settings", label: "Settings", group: "Administration" },
  { key: "audit_log", label: "Audit Log", group: "Administration" },
  { key: "backup", label: "Backup", group: "Administration" },
];

const PERMISSION_KEYS = ["can_view", "can_add", "can_edit", "can_delete"] as const;

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
}

interface Permission {
  module: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const defaultPermissions = (): Permission[] =>
  MODULES.map((m) => ({ module: m.key, can_view: false, can_add: false, can_edit: false, can_delete: false }));

const RolesPage = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<CustomRole | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(defaultPermissions());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete } = usePermission();

  const fetchRoles = async () => {
    setLoading(true);
    const { data } = await supabase.from("custom_roles").select("*").order("name");
    setRoles((data || []) as CustomRole[]);
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const openCreate = () => {
    setEditRole(null);
    setFormName("");
    setFormDesc("");
    setPermissions(defaultPermissions());
    setDialogOpen(true);
  };

  const openEdit = async (role: CustomRole) => {
    setEditRole(role);
    setFormName(role.name);
    setFormDesc(role.description || "");
    const { data } = await supabase.from("role_permissions").select("*").eq("custom_role_id", role.id);
    const perms = defaultPermissions();
    (data || []).forEach((p: any) => {
      const idx = perms.findIndex((pm) => pm.module === p.module);
      if (idx >= 0) {
        perms[idx] = { module: p.module, can_view: p.can_view, can_add: p.can_add, can_edit: p.can_edit, can_delete: p.can_delete };
      }
    });
    setPermissions(perms);
    setDialogOpen(true);
  };

  const togglePerm = (moduleIdx: number, key: typeof PERMISSION_KEYS[number]) => {
    setPermissions((prev) =>
      prev.map((p, i) => (i === moduleIdx ? { ...p, [key]: !p[key] } : p))
    );
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      let roleId: string;
      if (editRole) {
        const { error } = await supabase.from("custom_roles").update({ name: formName, description: formDesc }).eq("id", editRole.id);
        if (error) throw error;
        roleId = editRole.id;
        await supabase.from("role_permissions").delete().eq("custom_role_id", roleId);
      } else {
        const { data, error } = await supabase.from("custom_roles").insert({ name: formName, description: formDesc }).select().single();
        if (error) throw error;
        roleId = (data as any).id;
      }

      const permRows = permissions.map((p) => ({
        custom_role_id: roleId,
        module: p.module,
        can_view: p.can_view,
        can_add: p.can_add,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }));
      const { error: permErr } = await supabase.from("role_permissions").insert(permRows);
      if (permErr) throw permErr;

      toast({ title: editRole ? "Role updated" : "Role created" });
      setDialogOpen(false);
      fetchRoles();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this role?")) return;
    const { error } = await supabase.from("custom_roles").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchRoles();
  };

  // Group modules for display
  const groups = Array.from(new Set(MODULES.map((m) => m.group)));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Roles & Permissions</h1>
        {canCreate("roles") && (
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Add Role</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : roles.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No custom roles yet</TableCell></TableRow>
              ) : roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />{r.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.description || "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    {canEdit("roles") && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                    )}
                    {canDelete("roles") && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRole ? "Edit Role" : "Create Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Accountant" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optional description" />
              </div>
            </div>

            {groups.map((groupName) => {
              const groupModules = MODULES.filter((m) => m.group === groupName);
              const groupPermissions = permissions.filter((p) => groupModules.some((m) => m.key === p.module));
              return (
                <Card key={groupName}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">{groupName}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Module</TableHead>
                          <TableHead className="text-center w-20">View</TableHead>
                          <TableHead className="text-center w-20">Add</TableHead>
                          <TableHead className="text-center w-20">Edit</TableHead>
                          <TableHead className="text-center w-20">Delete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupPermissions.map((p) => {
                          const globalIdx = permissions.findIndex((pp) => pp.module === p.module);
                          const mod = MODULES.find((m) => m.key === p.module);
                          return (
                            <TableRow key={p.module}>
                              <TableCell className="font-medium text-sm">{mod?.label || p.module}</TableCell>
                              {PERMISSION_KEYS.map((key) => (
                                <TableCell key={key} className="text-center">
                                  <Checkbox
                                    checked={p[key]}
                                    onCheckedChange={() => togglePerm(globalIdx, key)}
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPage;