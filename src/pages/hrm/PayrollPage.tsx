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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { DollarSign, Play, CheckCircle } from "lucide-react";

interface Employee { id: string; employee_code: string; first_name: string; last_name: string; salary: number; }
interface SalaryStructure { id: string; employee_id: string; basic_salary: number; allowances: number; deductions: number; effective_from: string; }
interface PayrollRecord { id: string; employee_id: string; month: number; year: number; basic_salary: number; allowances: number; deductions: number; net_salary: number; status: string; }

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function PayrollPage() {
  const { isAdmin, user } = useAuth();
  const { fc: formatAmount } = useCurrency();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [structDialog, setStructDialog] = useState(false);
  const [structForm, setStructForm] = useState({ employee_id: "", basic_salary: 0, allowances: 0, deductions: 0, effective_from: new Date().toISOString().split("T")[0] });

  const fetchData = useCallback(async () => {
    const [empRes, strRes, payRes] = await Promise.all([
      supabase.from("employees" as any).select("id, employee_code, first_name, last_name, salary").eq("status", "active"),
      supabase.from("salary_structures" as any).select("*").order("effective_from", { ascending: false }),
      supabase.from("payroll" as any).select("*").eq("month", selMonth).eq("year", selYear).order("created_at"),
    ]);
    if (empRes.data) setEmployees(empRes.data as any);
    if (strRes.data) setStructures(strRes.data as any);
    if (payRes.data) setPayroll(payRes.data as any);
  }, [selMonth, selYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStructure = (empId: string): SalaryStructure | undefined => structures.find(s => s.employee_id === empId);

  const generatePayroll = async () => {
    setGenerating(true);
    let count = 0;

    // Calculate total working days in the month
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    // Exclude weekends (simple: count weekdays)
    let totalWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(selYear, selMonth - 1, d).getDay();
      if (day !== 0 && day !== 6) totalWorkingDays++;
    }

    for (const emp of employees) {
      const existing = payroll.find(p => p.employee_id === emp.id);
      if (existing) continue;

      const struct = getStructure(emp.id);
      const basic = struct?.basic_salary ?? emp.salary;
      const allowances = struct?.allowances ?? 0;
      const baseDeductions = struct?.deductions ?? 0;

      // Fetch attendance for the month
      const startDate = `${selYear}-${String(selMonth).padStart(2, "0")}-01`;
      const endDate = `${selYear}-${String(selMonth).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      const { data: attendance } = await supabase.from("attendance" as any)
        .select("status")
        .eq("employee_id", emp.id)
        .gte("date", startDate)
        .lte("date", endDate);

      const att = (attendance || []) as any[];
      const presentDays = att.filter(a => a.status === "present" || a.status === "late").length;
      const absentDays = totalWorkingDays - presentDays - att.filter(a => a.status === "leave").length;

      // Fetch approved overtime
      const { data: overtime } = await supabase.from("overtime_records" as any)
        .select("hours")
        .eq("employee_id", emp.id)
        .eq("status", "approved")
        .gte("date", startDate)
        .lte("date", endDate);

      const totalOvertimeHours = (overtime || []).reduce((s: number, o: any) => s + Number(o.hours), 0);
      const dailySalary = basic / totalWorkingDays;
      const overtimePay = (dailySalary / 8) * 1.5 * totalOvertimeHours; // 1.5x overtime rate
      const absentDeduction = Math.max(0, absentDays) * dailySalary;

      const net = basic + allowances + overtimePay - baseDeductions - absentDeduction;

      const { error } = await supabase.from("payroll" as any).insert({
        employee_id: emp.id, month: selMonth, year: selYear,
        basic_salary: basic, allowances: allowances + overtimePay,
        deductions: baseDeductions + absentDeduction, net_salary: Math.max(0, net),
      });
      if (!error) count++;
    }
    toast.success(`Generated attendance-based payroll for ${count} employees`);
    setGenerating(false);
    fetchData();
  };

  const approvePayroll = async (id: string) => {
    const { error } = await supabase.from("payroll" as any).update({ status: "approved" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Payroll approved"); fetchData(); }
  };

  const saveStructure = async () => {
    if (!structForm.employee_id) { toast.error("Select employee"); return; }
    const { error } = await supabase.from("salary_structures" as any).insert({
      employee_id: structForm.employee_id, basic_salary: structForm.basic_salary,
      allowances: structForm.allowances, deductions: structForm.deductions, effective_from: structForm.effective_from,
    });
    if (error) toast.error(error.message); else { toast.success("Salary structure saved"); setStructDialog(false); fetchData(); }
  };

  const getEmpName = (id: string) => { const e = employees.find(e => e.id === id); return e ? `${e.first_name} ${e.last_name}` : "-"; };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Payroll</h1><p className="text-muted-foreground">Attendance-based salary calculation with overtime</p></div>
      </div>

      <Tabs defaultValue="payroll">
        <TabsList><TabsTrigger value="payroll">Generate Payroll</TabsTrigger><TabsTrigger value="structures">Salary Structures</TabsTrigger></TabsList>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Payroll - {months[selMonth - 1]} {selYear}</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={String(selMonth)} onValueChange={v => setSelMonth(Number(v))}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" value={selYear} onChange={e => setSelYear(Number(e.target.value))} className="w-24" />
                  {isAdmin && <Button onClick={generatePayroll} disabled={generating}><Play className="w-4 h-4 mr-2" />{generating ? "Generating..." : "Generate"}</Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                Formula: Net = Basic + Allowances + Overtime(1.5x) − Base Deductions − (Absent Days × Daily Salary)
              </p>
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-right">Basic</TableHead><TableHead className="text-right">Allowances + OT</TableHead><TableHead className="text-right">Deductions</TableHead><TableHead className="text-right">Net Salary</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {payroll.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{getEmpName(p.employee_id)}</TableCell>
                      <TableCell className="text-right">{formatAmount(p.basic_salary)}</TableCell>
                      <TableCell className="text-right">{formatAmount(p.allowances)}</TableCell>
                      <TableCell className="text-right">{formatAmount(p.deductions)}</TableCell>
                      <TableCell className="text-right font-bold">{formatAmount(p.net_salary)}</TableCell>
                      <TableCell><Badge variant={p.status === "approved" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {p.status === "draft" && <Button variant="ghost" size="sm" onClick={() => approvePayroll(p.id)}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {payroll.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payroll generated for this month</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structures">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Salary Structures</CardTitle>
                {isAdmin && <Button onClick={() => { setStructForm({ employee_id: "", basic_salary: 0, allowances: 0, deductions: 0, effective_from: new Date().toISOString().split("T")[0] }); setStructDialog(true); }}>Add Structure</Button>}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-right">Basic</TableHead><TableHead className="text-right">Allowances</TableHead><TableHead className="text-right">Deductions</TableHead><TableHead>Effective From</TableHead></TableRow></TableHeader>
                <TableBody>
                  {structures.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{getEmpName(s.employee_id)}</TableCell>
                      <TableCell className="text-right">{formatAmount(s.basic_salary)}</TableCell>
                      <TableCell className="text-right">{formatAmount(s.allowances)}</TableCell>
                      <TableCell className="text-right">{formatAmount(s.deductions)}</TableCell>
                      <TableCell>{s.effective_from}</TableCell>
                    </TableRow>
                  ))}
                  {structures.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No salary structures</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={structDialog} onOpenChange={setStructDialog}>
        <DialogContent><DialogHeader><DialogTitle>Add Salary Structure</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Employee *</Label>
              <Select value={structForm.employee_id} onValueChange={v => setStructForm({...structForm, employee_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Basic Salary</Label><Input type="number" value={structForm.basic_salary} onChange={e => setStructForm({...structForm, basic_salary: Number(e.target.value)})} /></div>
              <div><Label>Allowances</Label><Input type="number" value={structForm.allowances} onChange={e => setStructForm({...structForm, allowances: Number(e.target.value)})} /></div>
              <div><Label>Deductions</Label><Input type="number" value={structForm.deductions} onChange={e => setStructForm({...structForm, deductions: Number(e.target.value)})} /></div>
            </div>
            <div><Label>Effective From</Label><Input type="date" value={structForm.effective_from} onChange={e => setStructForm({...structForm, effective_from: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStructDialog(false)}>Cancel</Button><Button onClick={saveStructure}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
