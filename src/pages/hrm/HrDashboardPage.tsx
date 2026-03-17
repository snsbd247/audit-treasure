import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Users, UserCheck, UserX, Clock, CalendarDays, DollarSign, AlertTriangle, Bell,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(280 67% 55%)",
];

interface DeptCount { name: string; count: number; }

export default function HrDashboardPage() {
  const { fc: formatAmount } = useCurrency();
  const [stats, setStats] = useState({
    totalEmployees: 0, presentToday: 0, absentToday: 0, lateToday: 0,
    onLeave: 0, pendingLeave: 0, pendingPayroll: 0, salaryExpense: 0,
  });
  const [attendancePie, setAttendancePie] = useState<{ name: string; value: number }[]>([]);
  const [monthlySalary, setMonthlySalary] = useState<{ month: string; amount: number }[]>([]);
  const [deptData, setDeptData] = useState<DeptCount[]>([]);
  const [notifications, setNotifications] = useState<{ text: string; type: "warning" | "info" }[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    Promise.all([
      supabase.from("employees" as any).select("id, department_id", { count: "exact" }).eq("status", "active"),
      supabase.from("attendance" as any).select("status").eq("date", today),
      supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payroll" as any).select("id, net_salary, status, month, year"),
      supabase.from("departments").select("id, name"),
      supabase.from("leave_requests").select("id, status, start_date, end_date")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today),
    ]).then(([empRes, attRes, leaveRes, payRes, deptRes, onLeaveRes]) => {
      const emps = (empRes.data || []) as any[];
      const att = (attRes.data || []) as any[];
      const payAll = (payRes.data || []) as any[];
      const depts = (deptRes.data || []) as any[];
      const onLeaveCount = onLeaveRes.data?.length || 0;

      const present = att.filter(a => a.status === "present").length;
      const absent = att.filter(a => a.status === "absent").length;
      const late = att.filter(a => a.status === "late").length;
      const leave = att.filter(a => a.status === "leave").length;

      // Current month salary expense
      const currentMonthPay = payAll.filter((p: any) =>
        p.month === currentMonth && p.year === currentYear && p.status === "approved"
      );
      const salaryExpense = currentMonthPay.reduce((s: number, p: any) => s + Number(p.net_salary), 0);

      const pendingPayroll = payAll.filter((p: any) => p.status === "draft").length;

      setStats({
        totalEmployees: empRes.count || emps.length,
        presentToday: present,
        absentToday: absent,
        lateToday: late,
        onLeave: onLeaveCount + leave,
        pendingLeave: leaveRes.count || 0,
        pendingPayroll,
        salaryExpense,
      });

      // Attendance pie
      setAttendancePie([
        { name: "Present", value: present },
        { name: "Absent", value: absent },
        { name: "Late", value: late },
        { name: "On Leave", value: onLeaveCount + leave },
      ].filter(d => d.value > 0));

      // Monthly salary (last 6 months)
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const salaryByMonth: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const total = payAll
          .filter((p: any) => p.month === m && p.year === y && p.status === "approved")
          .reduce((s: number, p: any) => s + Number(p.net_salary), 0);
        salaryByMonth.push({ month: `${monthNames[m - 1]} ${y}`, amount: total });
      }
      setMonthlySalary(salaryByMonth);

      // Department-wise employees
      const deptCounts: DeptCount[] = depts.map((dept: any) => ({
        name: dept.name,
        count: emps.filter((e: any) => e.department_id === dept.id).length,
      })).filter((d: DeptCount) => d.count > 0);
      setDeptData(deptCounts);

      // Notifications
      const notifs: { text: string; type: "warning" | "info" }[] = [];
      if (leaveRes.count && leaveRes.count > 0) notifs.push({ text: `${leaveRes.count} pending leave request(s)`, type: "warning" });
      if (pendingPayroll > 0) notifs.push({ text: `${pendingPayroll} payroll record(s) awaiting approval`, type: "warning" });
      if (absent > 3) notifs.push({ text: `${absent} employees absent today - attendance anomaly`, type: "warning" });
      if (late > 0) notifs.push({ text: `${late} employee(s) arrived late today`, type: "info" });
      setNotifications(notifs);
    });
  }, []);

  const metricCards = [
    { label: "Total Employees", value: stats.totalEmployees, icon: Users, color: "text-primary" },
    { label: "Present Today", value: stats.presentToday, icon: UserCheck, color: "text-emerald-500" },
    { label: "Absent Today", value: stats.absentToday, icon: UserX, color: "text-destructive" },
    { label: "Late Today", value: stats.lateToday, icon: Clock, color: "text-amber-500" },
    { label: "On Leave", value: stats.onLeave, icon: CalendarDays, color: "text-blue-500" },
    { label: "Salary Expense", value: formatAmount(stats.salaryExpense), icon: DollarSign, color: "text-primary", isString: true },
    { label: "Pending Payroll", value: stats.pendingPayroll, icon: AlertTriangle, color: "text-amber-500" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">HR Dashboard</h1>
          <p className="text-sm text-muted-foreground">Human Resource analytics & overview</p>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <div key={i} className={`flex items-center gap-2 p-3 rounded-lg text-sm ${n.type === "warning" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-blue-500/10 text-blue-700 dark:text-blue-400"}`}>
              <Bell className="w-4 h-4 shrink-0" />
              <span>{n.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {metricCards.map(c => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <c.icon className={`w-6 h-6 mx-auto mb-1.5 ${c.color}`} />
              <p className="text-2xl font-bold text-foreground">
                {(c as any).isString ? c.value : c.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {attendancePie.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {attendancePie.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No attendance data for today</div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Salary Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Salary Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlySalary}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatAmount(value)} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department-wise */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Department-wise Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No department data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
