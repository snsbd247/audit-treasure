import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalEmployee } from "@/hooks/usePortalEmployee";
import { PortalEmployeeSelector } from "@/components/portal/PortalEmployeeSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, XCircle, AlertCircle, CalendarDays } from "lucide-react";

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

  const present = attendance.filter(a => a.status === "present").length;
  const absent = attendance.filter(a => a.status === "absent").length;
  const late = attendance.filter(a => a.status === "late").length;
  const leave = attendance.filter(a => a.status === "leave").length;

  const summaryCards = [
    { label: "Present", count: present, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Absent", count: absent, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Late", count: late, icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Leave", count: leave, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="space-y-0">
      {isHrAdmin && (
        <PortalEmployeeSelector employees={allEmployees} selectedId={selectedEmployeeId} onSelect={selectEmployee} />
      )}
      <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-2xl font-bold text-foreground">My Attendance</h1></div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-44" /></div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map(({ label, count, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
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
