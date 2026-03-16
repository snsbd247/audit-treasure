import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Calendar } from "lucide-react";

interface Employee { id: string; employee_code: string; first_name: string; last_name: string; }
interface AttendanceRecord { id: string; employee_id: string; date: string; check_in: string | null; check_out: string | null; status: string; }

export default function AttendancePage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [entries, setEntries] = useState<Record<string, { check_in: string; check_out: string; status: string }>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [empRes, attRes] = await Promise.all([
      supabase.from("employees" as any).select("id, employee_code, first_name, last_name").eq("status", "active").order("employee_code"),
      supabase.from("attendance" as any).select("*").eq("date", date),
    ]);
    const emps = (empRes.data || []) as any as Employee[];
    const atts = (attRes.data || []) as any as AttendanceRecord[];
    setEmployees(emps);
    setAttendance(atts);

    const map: Record<string, { check_in: string; check_out: string; status: string }> = {};
    emps.forEach(emp => {
      const existing = atts.find(a => a.employee_id === emp.id);
      map[emp.id] = {
        check_in: existing?.check_in || "",
        check_out: existing?.check_out || "",
        status: existing?.status || "present",
      };
    });
    setEntries(map);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateEntry = (empId: string, field: string, value: string) => {
    setEntries(prev => ({ ...prev, [empId]: { ...prev[empId], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const upserts = employees.map(emp => ({
      employee_id: emp.id,
      date,
      check_in: entries[emp.id]?.check_in || null,
      check_out: entries[emp.id]?.check_out || null,
      status: entries[emp.id]?.status || "present",
    }));

    for (const rec of upserts) {
      const existing = attendance.find(a => a.employee_id === rec.employee_id);
      if (existing) {
        await supabase.from("attendance" as any).update({ check_in: rec.check_in, check_out: rec.check_out, status: rec.status }).eq("id", existing.id);
      } else {
        await supabase.from("attendance" as any).insert(rec);
      }
    }
    toast.success("Attendance saved");
    setSaving(false);
    fetchData();
  };

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    present: "default", absent: "destructive", late: "secondary", leave: "outline",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Attendance</h1><p className="text-muted-foreground">Daily attendance management</p></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
          </div>
          {isAdmin && <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Attendance"}</Button>}
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead><TableHead>Employee</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-mono">{emp.employee_code}</TableCell>
                  <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                  <TableCell><Input type="time" value={entries[emp.id]?.check_in || ""} onChange={e => updateEntry(emp.id, "check_in", e.target.value)} className="w-32" disabled={!isAdmin} /></TableCell>
                  <TableCell><Input type="time" value={entries[emp.id]?.check_out || ""} onChange={e => updateEntry(emp.id, "check_out", e.target.value)} className="w-32" disabled={!isAdmin} /></TableCell>
                  <TableCell>
                    <Select value={entries[emp.id]?.status || "present"} onValueChange={v => updateEntry(emp.id, "status", v)} disabled={!isAdmin}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No active employees</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
