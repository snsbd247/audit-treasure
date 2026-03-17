import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalEmployee } from "@/hooks/usePortalEmployee";
import { PortalEmployeeSelector } from "@/components/portal/PortalEmployeeSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function MyLeavePage() {
  const { employee, loading, isHrAdmin, allEmployees, selectedEmployeeId, selectEmployee } = usePortalEmployee();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("leave_types").select("*");
      if (data) setLeaveTypes(data as any);
    })();
  }, []);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const { data } = await supabase.from("leave_requests").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false });
      if (data) setRequests(data as any);
    })();
  }, [employee]);

  const handleSubmit = async () => {
    if (!employee || !form.leave_type_id || !form.start_date || !form.end_date) { toast.error("All fields required"); return; }
    const { error } = await supabase.from("leave_requests").insert({
      employee_id: employee.id, leave_type_id: form.leave_type_id,
      start_date: form.start_date, end_date: form.end_date, reason: form.reason || null,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Leave request submitted");
      setDialogOpen(false);
      const { data } = await supabase.from("leave_requests").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false });
      if (data) setRequests(data as any);
    }
  };

  const getLeaveName = (id: string) => leaveTypes.find((l: any) => l.id === id)?.name || "-";
  const statusColors: Record<string, "default" | "secondary" | "destructive"> = { pending: "secondary", approved: "default", rejected: "destructive" };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  if (!employee) return <div className="text-center py-16 text-muted-foreground">No employee profile linked.</div>;

  return (
    <div className="space-y-0">
      {isHrAdmin && (
        <PortalEmployeeSelector employees={allEmployees} selectedId={selectedEmployeeId} onSelect={selectEmployee} />
      )}
      <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">My Leave</h1></div>
          <Button onClick={() => { setForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Apply Leave</Button>
        </div>
        <Card><CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{getLeaveName(r.leave_type_id)}</TableCell>
                  <TableCell>{r.start_date}</TableCell><TableCell>{r.end_date}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{r.reason || "-"}</TableCell>
                  <TableCell><Badge variant={statusColors[r.status] || "secondary"} className="capitalize">{r.status}</Badge></TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No leave requests</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent><DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Leave Type *</Label>
                <Select value={form.leave_type_id} onValueChange={v => setForm({...form, leave_type_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{leaveTypes.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name} ({l.days_per_year} days/yr)</SelectItem>)}</SelectContent>
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
    </div>
  );
}
