import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock, CalendarDays, DollarSign } from "lucide-react";

export default function HrDashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0, presentToday: 0, absentToday: 0, lateToday: 0,
    pendingLeave: 0, pendingPayroll: 0,
  });

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      supabase.from("employees" as any).select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("attendance" as any).select("status").eq("date", today),
      supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payroll" as any).select("id", { count: "exact", head: true }).eq("status", "draft"),
    ]).then(([empRes, attRes, leaveRes, payRes]) => {
      const att = (attRes.data || []) as any[];
      setStats({
        totalEmployees: empRes.count || 0,
        presentToday: att.filter(a => a.status === "present").length,
        absentToday: att.filter(a => a.status === "absent").length,
        lateToday: att.filter(a => a.status === "late").length,
        pendingLeave: leaveRes.count || 0,
        pendingPayroll: payRes.count || 0,
      });
    });
  }, []);

  const cards = [
    { label: "Total Employees", value: stats.totalEmployees, icon: Users, color: "text-primary" },
    { label: "Present Today", value: stats.presentToday, icon: UserCheck, color: "text-success" },
    { label: "Absent Today", value: stats.absentToday, icon: UserX, color: "text-destructive" },
    { label: "Late Today", value: stats.lateToday, icon: Clock, color: "text-warning" },
    { label: "Pending Leave", value: stats.pendingLeave, icon: CalendarDays, color: "text-accent-foreground" },
    { label: "Pending Payroll", value: stats.pendingPayroll, icon: DollarSign, color: "text-muted-foreground" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">HR Dashboard</h1>
          <p className="text-sm text-muted-foreground">Human Resource overview</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="pt-6 text-center">
              <c.icon className={`w-8 h-8 mx-auto mb-2 ${c.color}`} />
              <p className="text-3xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
