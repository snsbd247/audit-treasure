import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalEmployee } from "@/hooks/usePortalEmployee";
import { PortalEmployeeSelector } from "@/components/portal/PortalEmployeeSelector";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  User, Clock, CalendarDays, DollarSign, FileText,
  CheckCircle2, XCircle, AlertCircle, TrendingUp,
} from "lucide-react";

export default function MyDashboardPage() {
  const { employee, loading, isHrAdmin, allEmployees, selectedEmployeeId, selectEmployee } = usePortalEmployee();
  const { settings } = useCompanySettings();
  const { fc } = useCurrency();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    presentDays: 0, absentDays: 0, lateDays: 0, leaveDays: 0,
    pendingLeaves: 0, approvedLeaves: 0,
    lastPayroll: null as any,
    totalDocuments: 0,
  });

  useEffect(() => {
    if (!employee) return;
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    (async () => {
      const [attRes, leaveRes, payRes, docRes] = await Promise.all([
        supabase.from("attendance").select("status").eq("employee_id", employee.id)
          .gte("date", monthStart).lte("date", monthEnd),
        supabase.from("leave_requests").select("status").eq("employee_id", employee.id),
        supabase.from("payroll").select("*").eq("employee_id", employee.id)
          .order("year", { ascending: false }).order("month", { ascending: false }).limit(1),
        supabase.from("employee_documents").select("id").eq("employee_id", employee.id),
      ]);

      const att = attRes.data || [];
      const leaves = leaveRes.data || [];

      setStats({
        presentDays: att.filter((a: any) => a.status === "present").length,
        absentDays: att.filter((a: any) => a.status === "absent").length,
        lateDays: att.filter((a: any) => a.status === "late").length,
        leaveDays: att.filter((a: any) => a.status === "leave").length,
        pendingLeaves: leaves.filter((l: any) => l.status === "pending").length,
        approvedLeaves: leaves.filter((l: any) => l.status === "approved").length,
        lastPayroll: payRes.data?.[0] || null,
        totalDocuments: docRes.data?.length || 0,
      });
    })();
  }, [employee]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  if (!employee) return (
    <div className="text-center py-16 text-muted-foreground">
      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No employee profile linked to your account.</p>
      <p className="text-sm mt-1">Contact your administrator to link your employee record.</p>
    </div>
  );

  const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const currentMonth = `${months[now.getMonth() + 1]} ${now.getFullYear()}`;

  const quickLinks = [
    { label: "My Profile", icon: User, to: "/portal/profile", color: "text-blue-500" },
    { label: "My Attendance", icon: Clock, to: "/portal/attendance", color: "text-green-500" },
    { label: "My Leave", icon: CalendarDays, to: "/portal/leave", color: "text-orange-500" },
    { label: "My Payslips", icon: DollarSign, to: "/portal/payslips", color: "text-purple-500" },
    { label: "My Documents", icon: FileText, to: "/portal/documents", color: "text-pink-500" },
  ];

  return (
    <div className="space-y-0">
      {isHrAdmin && (
        <PortalEmployeeSelector employees={allEmployees} selectedId={selectedEmployeeId} onSelect={selectEmployee} />
      )}
      <div className="p-4 lg:p-6 space-y-6 max-w-[1200px] mx-auto">
        {/* Welcome Header */}
        <div className="flex items-center gap-4">
          {employee.photo_url ? (
            <img src={employee.photo_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary border-2 border-primary/30">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {employee.first_name}!
            </h1>
            <p className="text-muted-foreground text-sm">
              {employee.employee_code} • {settings?.company_name || "Company"}
            </p>
          </div>
          <Badge variant={employee.status === "active" ? "default" : "secondary"} className="capitalize ml-auto">
            {employee.status}
          </Badge>
        </div>

        {/* Attendance Stats - Current Month */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Attendance — {currentMonth}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.presentDays}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.absentDays}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.lateDays}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.leaveDays}</p>
                  <p className="text-xs text-muted-foreground">On Leave</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leave & Payroll Summary */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">{stats.pendingLeaves}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{stats.approvedLeaves}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("/portal/leave")}>
                Apply for Leave
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />Last Payslip
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.lastPayroll ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {months[stats.lastPayroll.month]} {stats.lastPayroll.year}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{fc(stats.lastPayroll.net_salary)}</p>
                  <Badge variant={stats.lastPayroll.status === "approved" ? "default" : "secondary"} className="capitalize mt-1">
                    {stats.lastPayroll.status}
                  </Badge>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No payslip available yet.</p>
              )}
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("/portal/payslips")}>
                View All Payslips
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <Button
                key={link.to}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate(link.to)}
              >
                <link.icon className={`w-6 h-6 ${link.color}`} />
                <span className="text-xs">{link.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
