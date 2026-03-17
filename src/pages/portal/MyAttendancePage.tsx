import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalEmployee } from "@/hooks/usePortalEmployee";
import { PortalEmployeeSelector } from "@/components/portal/PortalEmployeeSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function MyAttendancePage() {
  const { employee, loading, isHrAdmin, allEmployees, selectedEmployeeId, selectEmployee } = usePortalEmployee();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!employee) return;
    const startDate = `${month}-01`;
    const endDate = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0).toISOString().split("T")[0];
    (async () => {
      const { data } = await supabase.from("attendance").select("*")
        .eq("employee_id", employee.id).gte("date", startDate).lte("date", endDate).order("date");
      if (data) setAttendance(data as any);
    })();
  }, [employee, month]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  if (!employee) return <div className="text-center py-16 text-muted-foreground">No employee profile linked.</div>;

  const statusBadge = (s: string) => {
    const v = s === "present" ? "default" : s === "absent" ? "destructive" : "secondary";
    return <Badge variant={v} className="capitalize">{s}</Badge>;
  };

  return (
    <div className="space-y-0">
      {isHrAdmin && (
        <PortalEmployeeSelector employees={allEmployees} selectedId={selectedEmployeeId} onSelect={selectEmployee} />
      )}
      <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">My Attendance</h1></div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-44" /></div>
        </div>
        <Card><CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {attendance.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>{a.check_in || "-"}</TableCell>
                  <TableCell>{a.check_out || "-"}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
}
