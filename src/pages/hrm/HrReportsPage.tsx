import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Users, Calendar, FileText, DollarSign } from "lucide-react";

export default function HrReportsPage() {
  const { fc: formatAmount } = useCurrency();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    const [empRes, deptRes, desigRes, attRes, payRes] = await Promise.all([
      supabase.from("employees" as any).select("*").order("employee_code"),
      supabase.from("departments" as any).select("*"),
      supabase.from("designations" as any).select("*"),
      supabase.from("attendance" as any).select("*").gte("date", dateFrom).lte("date", dateTo),
      supabase.from("payroll" as any).select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (empRes.data) setEmployees(empRes.data as any);
    if (deptRes.data) setDepartments(deptRes.data as any);
    if (desigRes.data) setDesignations(desigRes.data as any);
    if (attRes.data) setAttendance(attRes.data as any);
    if (payRes.data) setPayroll(payRes.data as any);
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getDeptName = (id: string | null) => departments.find((d: any) => d.id === id)?.name || "-";
  const getDesigName = (id: string | null) => designations.find((d: any) => d.id === id)?.name || "-";
  const getEmpName = (id: string) => { const e = employees.find((e: any) => e.id === id); return e ? `${e.first_name} ${e.last_name}` : "-"; };
  const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const totalSalaryExpense = payroll.filter(p => p.status === "approved").reduce((sum, p) => sum + p.net_salary, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">HR Reports</h1>
          <p className="text-sm text-muted-foreground">Employee, attendance, and payroll reports</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><Users className="w-8 h-8 mx-auto text-primary mb-2" /><p className="text-2xl font-bold">{employees.length}</p><p className="text-sm text-muted-foreground">Total Employees</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Users className="w-8 h-8 mx-auto text-success mb-2" /><p className="text-2xl font-bold">{employees.filter(e => e.status === "active").length}</p><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Calendar className="w-8 h-8 mx-auto text-primary mb-2" /><p className="text-2xl font-bold">{departments.length}</p><p className="text-sm text-muted-foreground">Departments</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><DollarSign className="w-8 h-8 mx-auto text-warning mb-2" /><p className="text-2xl font-bold">{formatAmount(totalSalaryExpense)}</p><p className="text-sm text-muted-foreground">Total Salary Expense</p></CardContent></Card>
      </div>

      <div className="flex gap-4 items-end">
        <div><Label>From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-44" /></div>
        <div><Label>To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-44" /></div>
        <Button variant="outline" onClick={fetchData}>Refresh</Button>
      </div>

      <Tabs defaultValue="employees">
        <TabsList><TabsTrigger value="employees">Employee List</TabsTrigger><TabsTrigger value="attendance">Attendance</TabsTrigger><TabsTrigger value="payroll">Payroll</TabsTrigger></TabsList>

        <TabsContent value="employees">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Designation</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
              <TableBody>
                {employees.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono">{e.employee_code}</TableCell>
                    <TableCell className="font-medium">{e.first_name} {e.last_name}</TableCell>
                    <TableCell>{getDeptName(e.department_id)}</TableCell>
                    <TableCell>{getDesigName(e.designation_id)}</TableCell>
                    <TableCell className="capitalize">{e.employment_type}</TableCell>
                    <TableCell><Badge variant={e.status === "active" ? "default" : "secondary"} className="capitalize">{e.status}</Badge></TableCell>
                    <TableCell>{e.joining_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {attendance.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{getEmpName(a.employee_id)}</TableCell>
                    <TableCell>{a.date}</TableCell>
                    <TableCell>{a.check_in || "-"}</TableCell>
                    <TableCell>{a.check_out || "-"}</TableCell>
                    <TableCell><Badge className="capitalize" variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "secondary"}>{a.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {attendance.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No attendance records</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Basic</TableHead><TableHead className="text-right">Allowances</TableHead><TableHead className="text-right">Deductions</TableHead><TableHead className="text-right">Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {payroll.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{getEmpName(p.employee_id)}</TableCell>
                    <TableCell>{months[p.month]} {p.year}</TableCell>
                    <TableCell className="text-right">{formatAmount(p.basic_salary)}</TableCell>
                    <TableCell className="text-right">{formatAmount(p.allowances)}</TableCell>
                    <TableCell className="text-right">{formatAmount(p.deductions)}</TableCell>
                    <TableCell className="text-right font-bold">{formatAmount(p.net_salary)}</TableCell>
                    <TableCell><Badge variant={p.status === "approved" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {payroll.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payroll records</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
