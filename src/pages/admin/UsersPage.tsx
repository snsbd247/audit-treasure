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
import { Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  branch_id: string | null;
  status: string;
  roles: string[];
  branch_name?: string;
}

interface Branch {
  id: string;
  name: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  // New user form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<string>("staff");
  const [formBranch, setFormBranch] = useState<string>("");
  const [formStatus, setFormStatus] = useState<string>("active");

  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, branchesRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase.from("branches").select("id, name"),
    ]);

    const branchList = (branchesRes.data || []) as Branch[];
    setBranches(branchList);

    const profiles = profilesRes.data || [];
    const rolesList = rolesRes.data || [];

    const mapped: UserRow[] = profiles.map((p: any) => ({
      ...p,
      roles: rolesList.filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      branch_name: branchList.find((b) => b.id === p.branch_id)?.name,
    }));
    setUsers(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("");
    setFormRole("staff");
    setFormBranch("");
    setFormStatus("active");
    setDialogOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setFormName(u.name);
    setFormEmail(u.email || "");
    setFormPhone(u.phone || "");
    setFormPassword("");
    setFormRole(u.roles[0] || "staff");
    setFormBranch(u.branch_id || "");
    setFormStatus(u.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setCreating(true);
    try {
      if (editUser) {
        // Update profile
        const { error } = await supabase.from("profiles").update({
          name: formName,
          email: formEmail,
          phone: formPhone,
          branch_id: formBranch || null,
          status: formStatus,
          updated_at: new Date().toISOString(),
        }).eq("id", editUser.id);
        if (error) throw error;

        // Update role
        await supabase.from("user_roles").delete().eq("user_id", editUser.id);
        await supabase.from("user_roles").insert({ user_id: editUser.id, role: formRole as any });

        toast({ title: "User updated" });
      } else {
        // Create user via edge function or signUp (we'll use signUp here)
        const { data, error } = await supabase.auth.signUp({
          email: formEmail,
          password: formPassword,
          options: { data: { name: formName } },
        });
        if (error) throw error;
        if (data.user) {
          // Set branch and phone
          await supabase.from("profiles").update({
            phone: formPhone,
            branch_id: formBranch || null,
            status: formStatus,
          }).eq("id", data.user.id);

          // Set role
          await supabase.from("user_roles").insert({ user_id: data.user.id, role: formRole as any });
        }
        toast({ title: "User created", description: "They may need to verify their email." });
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const roleColor = (role: string) => {
    if (role === "super_admin") return "destructive" as const;
    if (role === "admin") return "default" as const;
    return "secondary" as const;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">User Management</h1>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Add User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No users found</TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell>
                    {u.roles.map((r) => (
                      <Badge key={r} variant={roleColor(r)} className="mr-1 text-xs">{r}</Badge>
                    ))}
                  </TableCell>
                  <TableCell>{u.branch_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "active" ? "default" : "secondary"}>{u.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} disabled={!!editUser} />
            </div>
            {!editUser && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} minLength={6} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
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
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={formBranch} onValueChange={setFormBranch}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={creating}>{creating ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
