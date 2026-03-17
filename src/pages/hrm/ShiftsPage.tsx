import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";

interface Shift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  late_after_minutes: number;
}

export default function ShiftsPage() {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("hrm", "can_edit");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState({ shift_name: "", start_time: "09:00", end_time: "17:00", late_after_minutes: 15 });

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("shifts" as any).select("*").order("shift_name");
    if (data) setShifts(data as any);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => {
    setEditing(null);
    setForm({ shift_name: "", start_time: "09:00", end_time: "17:00", late_after_minutes: 15 });
    setDialog(true);
  };

  const openEdit = (s: Shift) => {
    setEditing(s);
    setForm({ shift_name: s.shift_name, start_time: s.start_time, end_time: s.end_time, late_after_minutes: s.late_after_minutes });
    setDialog(true);
  };

  const save = async () => {
    if (!form.shift_name) { toast.error("Shift name required"); return; }
    if (editing) {
      const { error } = await supabase.from("shifts" as any).update(form as any).eq("id", editing.id);
      if (error) toast.error(error.message); else { toast.success("Shift updated"); setDialog(false); fetch(); }
    } else {
      const { error } = await supabase.from("shifts" as any).insert(form as any);
      if (error) toast.error(error.message); else { toast.success("Shift created"); setDialog(false); fetch(); }
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this shift?")) return;
    await supabase.from("shifts" as any).delete().eq("id", id);
    toast.success("Shift deleted");
    fetch();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Management</h1>
          <p className="text-muted-foreground">Configure employee work shifts</p>
        </div>
        {isAdmin && <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Shift</Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Late After (min)</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />{s.shift_name}</TableCell>
                  <TableCell>{s.start_time}</TableCell>
                  <TableCell>{s.end_time}</TableCell>
                  <TableCell>{s.late_after_minutes}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {shifts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No shifts configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Shift" : "Add Shift"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Shift Name *</Label><Input value={form.shift_name} onChange={e => setForm({ ...form, shift_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
              <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div><Label>Late After (minutes)</Label><Input type="number" value={form.late_after_minutes} onChange={e => setForm({ ...form, late_after_minutes: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
