import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Users, Eye, EyeOff, KeyRound, Wand2 } from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  national_id: string | null;
  department_id: string | null;
  designation_id: string | null;
  branch_id: string | null;
  user_id: string | null;
  joining_date: string;
  salary: number;
  employment_type: string;
  status: string;
  photo_url: string | null;
}

interface Department { id: string; name: string; }
interface Designation { id: string; name: string; }
interface Branch { id: string; name: string; }

const defaultForm = {
  employee_code: "", first_name: "", last_name: "", mobile: "", email: "",
  address: "", national_id: "", department_id: "", designation_id: "",
  branch_id: "", joining_date: new Date().toISOString().split("T")[0],
  salary: 0, employment_type: "permanent", status: "active",
  // Login fields
  create_login: false, username: "", password: "",
};

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("hrm.edit");
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [linkedUsers, setLinkedUsers] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const fetchAll = useCallback(async () => {
    const [empRes, deptRes, desigRes, branchRes] = await Promise.all([
      supabase.from("employees" as any).select("*").order("employee_code"),
      supabase.from("departments" as any).select("id, name").eq("status", "active"),
      supabase.from("designations" as any).select("id, name").eq("status", "active"),
      supabase.from("branches").select("id, name").eq("status", "active"),
    ]);
    if (empRes.data) setEmployees(empRes.data as any);
    if (deptRes.data) setDepartments(deptRes.data as any);
    if (desigRes.data) setDesignations(desigRes.data as any);
    if (branchRes.data) setBranches(branchRes.data as any);

    // Fetch which employees have linked user accounts
    const { data: profiles } = await supabase.from("profiles").select("id, employee_id, username").not("employee_id", "is", null);
    if (profiles) {
      const map: Record<string, string> = {};
      (profiles as any[]).forEach(p => {
        if (p.employee_id) map[p.employee_id] = p.username || "linked";
      });
      setLinkedUsers(map);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (e.first_name + " " + e.last_name + " " + e.employee_code).toLowerCase().includes(q);
  });

  const openAdd = () => { setEditId(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    const hasLogin = !!linkedUsers[emp.id];
    setForm({
      employee_code: emp.employee_code, first_name: emp.first_name, last_name: emp.last_name,
      mobile: emp.mobile || "", email: emp.email || "", address: emp.address || "",
      national_id: emp.national_id || "", department_id: emp.department_id || "",
      designation_id: emp.designation_id || "", branch_id: emp.branch_id || "",
      joining_date: emp.joining_date, salary: emp.salary,
      employment_type: emp.employment_type, status: emp.status,
      create_login: hasLogin, username: hasLogin ? linkedUsers[emp.id] : "", password: "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_code || !form.first_name || !form.last_name) {
      toast.error("Employee code, first name and last name are required");
      return;
    }

    // Validate login fields only when toggle is ON
    if (form.create_login) {
      if (!form.username) { toast.error("Username is required for login"); return; }
      // Password required for new employees or new login accounts
      const isNewLogin = !editId || !linkedUsers[editId!];
      if (isNewLogin && (!form.password || form.password.length < 6)) {
        toast.error("Password must be at least 6 characters"); return;
      }
      if (form.password && form.password.length > 0 && form.password.length < 6) {
        toast.error("Password must be at least 6 characters"); return;
      }
    }

    setLoading(true);
    const payload: any = {
      employee_code: form.employee_code,
      first_name: form.first_name,
      last_name: form.last_name,
      mobile: form.mobile || null,
      email: form.email || null,
      address: form.address || null,
      national_id: form.national_id || null,
      department_id: form.department_id || null,
      designation_id: form.designation_id || null,
      branch_id: form.branch_id || null,
      joining_date: form.joining_date,
      salary: form.salary,
      employment_type: form.employment_type,
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editId) {
        const { error } = await supabase.from("employees" as any).update(payload).eq("id", editId);
        if (error) { toast.error(error.message); setLoading(false); return; }

        // Handle login account changes
        if (form.create_login) {
          const { data: existingProfile } = await supabase.from("profiles").select("id, username").eq("employee_id", editId).single();
          if (existingProfile) {
            // Update existing profile
            const updateData: any = { username: form.username };
            await supabase.from("profiles").update(updateData).eq("id", existingProfile.id);
            // If password provided, update via edge function
            if (form.password) {
              const { error: fnError } = await supabase.functions.invoke("admin-create-user", {
                body: {
                  email: form.email || `${form.username}@erp.local`,
                  password: form.password,
                  name: `${form.first_name} ${form.last_name}`,
                  username: form.username,
                  employee_id: editId,
                  branch_id: form.branch_id || null,
                },
              });
              if (fnError) toast.error("Password update failed: " + fnError.message);
            }
          } else {
            // Create new login for existing employee
            const { data: fnData, error: fnError } = await supabase.functions.invoke("admin-create-user", {
              body: {
                email: form.email || `${form.username}@erp.local`,
                password: form.password,
                name: `${form.first_name} ${form.last_name}`,
                username: form.username,
                employee_id: editId,
                branch_id: form.branch_id || null,
              },
            });
            if (fnError) {
              toast.error("Login account creation failed: " + fnError.message);
            } else if (fnData?.user_id) {
              await supabase.from("employees" as any).update({ user_id: fnData.user_id }).eq("id", editId);
            }
          }
        } else {
          // Toggle OFF: disable login by setting profile status to inactive
          const { data: existingProfile } = await supabase.from("profiles").select("id").eq("employee_id", editId).single();
          if (existingProfile) {
            await supabase.from("profiles").update({ status: "inactive", username: null }).eq("id", existingProfile.id);
            await supabase.from("employees" as any).update({ user_id: null }).eq("id", editId);
          }
        }

        toast.success("Employee updated");
        setDialogOpen(false);
        fetchAll();
      } else {
        const { data, error } = await supabase.from("employees" as any).insert(payload).select().single();
        if (error) { toast.error(error.message); setLoading(false); return; }

        // Create login account if toggle is ON
        if (form.create_login && data) {
          try {
            const { data: fnData, error: fnError } = await supabase.functions.invoke("admin-create-user", {
              body: {
                email: form.email || `${form.username}@erp.local`,
                password: form.password,
                name: `${form.first_name} ${form.last_name}`,
                username: form.username,
                employee_id: (data as any).id,
                branch_id: form.branch_id || null,
              },
            });
            if (fnError) throw fnError;
            if (fnData?.user_id) {
              await supabase.from("employees" as any).update({ user_id: fnData.user_id }).eq("id", (data as any).id);
            }
          } catch (err: any) {
            toast.error("Employee created but login account failed: " + (err.message || "Unknown error"));
          }
        }
        toast.success("Employee created");
        setDialogOpen(false);
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    const { error } = await supabase.from("employees" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Employee deleted"); fetchAll(); }
  };

  const getDeptName = (id: string | null) => departments.find(d => d.id === id)?.name || "-";
  const getDesigName = (id: string | null) => designations.find(d => d.id === id)?.name || "-";
  const getBranchName = (id: string | null) => branches.find(b => b.id === id)?.name || "-";

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">Manage employee records</p>
        </div>
        {isAdmin && <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Employee</Button>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />{filtered.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(emp => (
                <TableRow key={emp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/hrm/employees/${emp.id}`)}>
                  <TableCell className="font-mono">{emp.employee_code}</TableCell>
                  <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                  <TableCell>{getDeptName(emp.department_id)}</TableCell>
                  <TableCell>{getDesigName(emp.designation_id)}</TableCell>
                  <TableCell>{getBranchName(emp.branch_id)}</TableCell>
                  <TableCell>
                    {linkedUsers[emp.id] ? (
                      <Badge variant="outline" className="text-xs gap-1"><KeyRound className="w-3 h-3" />{linkedUsers[emp.id]}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">No login</span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant={emp.status === "active" ? "default" : "secondary"} className="capitalize">{emp.status}</Badge></TableCell>
                  {isAdmin && (
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/hrm/employees/${emp.id}`); }}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(emp); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No employees found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Employee Code *</Label><Input value={form.employee_code} onChange={e => setForm({...form, employee_code: e.target.value})} /></div>
            <div><Label>First Name *</Label><Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} /></div>
            <div><Label>Last Name *</Label><Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} /></div>
            <div><Label>Mobile</Label><Input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><Label>National ID</Label><Input value={form.national_id} onChange={e => setForm({...form, national_id: e.target.value})} /></div>
            <div className="col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
            <div>
              <Label>Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Designation</Label>
              <Select value={form.designation_id} onValueChange={v => setForm({...form, designation_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{designations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={form.branch_id} onValueChange={v => setForm({...form, branch_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={e => setForm({...form, joining_date: e.target.value})} /></div>
            <div><Label>Salary</Label><Input type="number" value={form.salary} onChange={e => setForm({...form, salary: Number(e.target.value)})} /></div>
            <div>
              <Label>Employment Type</Label>
              <Select value={form.employment_type} onValueChange={v => setForm({...form, employment_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Login Account Section */}
          <div className="border-t pt-4 mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Employee Login Account
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {form.create_login
                    ? "This employee can login to the Employee Portal"
                    : "Enable to allow this employee to login"}
                </p>
              </div>
              <Switch
                checked={form.create_login}
                onCheckedChange={v => {
                  setForm({
                    ...form,
                    create_login: v,
                    // Clear login fields when toggling OFF
                    ...(!v ? { username: "", password: "" } : {}),
                    // Auto-fill username from employee code when toggling ON
                    ...(v && !form.username ? { username: form.employee_code } : {}),
                  });
                }}
              />
            </div>
            {form.create_login && (
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg border border-border/50">
                <div>
                  <Label>Username *</Label>
                  <Input
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                    placeholder={form.employee_code || "username"}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label>{editId && linkedUsers[editId!] ? "New Password (leave blank to keep)" : "Password *"}</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder={editId && linkedUsers[editId!] ? "Leave blank to keep current" : "Min 6 characters"}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}
            {!form.create_login && editId && linkedUsers[editId!] && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                ⚠️ Turning off will disable this employee's login access
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
