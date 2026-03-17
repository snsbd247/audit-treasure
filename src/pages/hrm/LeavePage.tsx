import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";

interface LeaveType { id: string; name: string; days_per_year: number; }
interface Employee { id: string; employee_code: string; first_name: string; last_name: string; }
interface LeaveRequest {
  id: string; employee_id: string; leave_type_id: string;
  start_date: string; end_date: string; reason: string | null;
  status: string; approved_by: string | null; created_at: string;
}

export default function LeavePage() {
  const { hasPermission, user } = useAuth();
  const isAdmin = hasPermission("hrm", "can_edit");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" });

  const fetchData = useCallback(async () => {
    const [ltRes, empRes, reqRes] = await Promise.all([
      supabase.from("leave_types" as any).select("*").order("name"),
      supabase.from("employees" as any).select("id, employee_code, first_name, last_name").eq("status", "active"),
      supabase.from("leave_requests" as any).select("*").order("created_at", { ascending: false }),
    ]);
    if (ltRes.data) setLeaveTypes(ltRes.data as any);
    if (empRes.data) setEmployees(empRes.data as any);
    if (reqRes.data) setRequests(reqRes.data as any);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.employee_id || !form.leave_type_id || !form.start_date || !form.end_date) {
      toast.error("All fields are required"); return;
    }
    const { error } = await supabase.from("leave_requests" as any).insert({
      employee_id: form.employee_id, leave_type_id: form.leave_type_id,
      start_date: form.start_date, end_date: form.end_date, reason: form.reason || null,
    });
    if (error) toast.error(error.message); else { toast.success("Leave request submitted"); setDialogOpen(false); fetchData(); }
  };

  const handleAction = async (id: string, status: string) => {
    const { error } = await supabase.from("leave_requests" as any).update({ status, approved_by: user?.id }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Leave ${status}`); fetchData(); }
  };

  const getEmpName = (id: string) => { const e = employees.find(e => e.id === id); return e ? `${e.first_name} ${e.last_name}` : "-"; };
  const getLeaveName = (id: string) => leaveTypes.find(l => l.id === id)?.name || "-";
  const statusColors: Record<string, "default" | "secondary" | "destructive"> = { pending: "secondary", approved: "default", rejected: "destructive" };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Leave Management</h1><p className="text-muted-foreground">Manage leave requests</p></div>
        {isAdmin && <Button onClick={() => { setForm({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />New Leave Request</Button>}
      </div>

      <Tabs defaultValue="requests">
        <TabsList><TabsTrigger value="requests">Leave Requests</TabsTrigger><TabsTrigger value="types">Leave Types</TabsTrigger></TabsList>
        <TabsContent value="requests">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{getEmpName(r.employee_id)}</TableCell>
                    <TableCell>{getLeaveName(r.leave_type_id)}</TableCell>
                    <TableCell>{r.start_date}</TableCell><TableCell>{r.end_date}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{r.reason || "-"}</TableCell>
                    <TableCell><Badge variant={statusColors[r.status] || "secondary"} className="capitalize">{r.status}</Badge></TableCell>
                    {isAdmin && (
                      <TableCell className="text-right space-x-1">
                        {r.status === "pending" && <>
                          <Button variant="ghost" size="icon" onClick={() => handleAction(r.id, "approved")}><Check className="w-4 h-4 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleAction(r.id, "rejected")}><X className="w-4 h-4 text-destructive" /></Button>
                        </>}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {requests.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No leave requests</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="types">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Leave Type</TableHead><TableHead>Days Per Year</TableHead></TableRow></TableHeader>
              <TableBody>
                {leaveTypes.map(lt => (
                  <TableRow key={lt.id}><TableCell className="font-medium">{lt.name}</TableCell><TableCell>{lt.days_per_year}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={v => setForm({...form, employee_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Leave Type *</Label>
              <Select value={form.leave_type_id} onValueChange={v => setForm({...form, leave_type_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{leaveTypes.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>From *</Label><Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
              <div><Label>To *</Label><Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
            </div>
            <div><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
