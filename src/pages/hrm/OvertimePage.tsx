import { useState, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import { Plus, CheckCircle } from "lucide-react";

interface Employee { id: string; employee_code: string; first_name: string; last_name: string; }
interface OvertimeRecord { id: string; employee_id: string; date: string; hours: number; status: string; }

export default function OvertimePage() {
  const { hasPermission, user } = useAuth();
  const canManage = hasPermission("hrm", "can_add");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ employee_id: "", date: new Date().toISOString().split("T")[0], hours: 0 });

  const fetchData = useCallback(async () => {
    const [empRes, otRes] = await Promise.all([
      supabase.from("employees" as any).select("id, employee_code, first_name, last_name").eq("status", "active"),
      supabase.from("overtime_records" as any).select("*").order("date", { ascending: false }).limit(100),
    ]);
    if (empRes.data) setEmployees(empRes.data as any);
    if (otRes.data) setRecords(otRes.data as any);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    if (!form.employee_id || form.hours <= 0) { toast.error("Select employee and enter hours"); return; }
    const { error } = await supabase.from("overtime_records" as any).insert(form as any);
    if (error) toast.error(error.message); else { toast.success("Overtime recorded"); setDialog(false); fetchData(); }
  };

  const approve = async (id: string) => {
    await supabase.from("overtime_records" as any).update({ status: "approved", approved_by: user?.id } as any).eq("id", id);
    toast.success("Overtime approved");
    fetchData();
  };

  const getEmpName = (id: string) => { const e = employees.find(e => e.id === id); return e ? `${e.first_name} ${e.last_name}` : "-"; };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overtime Management</h1>
          <p className="text-muted-foreground">Track and approve employee overtime hours</p>
        </div>
        {isAdmin && <Button onClick={() => { setForm({ employee_id: "", date: new Date().toISOString().split("T")[0], hours: 0 }); setDialog(true); }}><Plus className="w-4 h-4 mr-2" />Record Overtime</Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{getEmpName(r.employee_id)}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="text-right font-mono">{r.hours}</TableCell>
                  <TableCell><Badge variant={r.status === "approved" ? "default" : "secondary"} className="capitalize">{r.status}</Badge></TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {r.status === "pending" && <Button variant="ghost" size="sm" onClick={() => approve(r.id)}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {records.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No overtime records</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Overtime</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Hours</Label><Input type="number" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
