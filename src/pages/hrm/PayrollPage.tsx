import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { DollarSign, Play, CheckCircle, FileText, Printer } from "lucide-react";
import { voucherApi } from "@/lib/voucher-api";

interface Employee {
  id: string; employee_code: string; first_name: string; last_name: string;
  salary: number; branch_id: string | null; department_id: string | null;
}
interface SalaryStructure {
  id: string; employee_id: string; basic_salary: number;
  house_rent: number; medical_allowance: number; other_allowance: number;
  total_salary: number; effective_from: string;
}
interface PayrollRecord {
  id: string; employee_id: string; month: number; year: number;
  basic_salary: number; allowances: number; deductions: number;
  net_salary: number; status: string; voucher_id: string | null;
}
interface PayrollDetail {
  employee_name: string; employee_code: string;
  basic_salary: number; house_rent: number; medical: number; other_allowance: number;
  overtime_hours: number; overtime_pay: number;
  present_days: number; absent_days: number; late_count: number; leave_days: number;
  total_working_days: number;
  absent_deduction: number; late_deduction: number; base_deductions: number;
  gross: number; total_deductions: number; net_salary: number;
}

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const LATE_PENALTY = 50; // Configurable late penalty amount

export default function PayrollPage() {
  const { isAdmin, user } = useAuth();
  const { fc: formatAmount } = useCurrency();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [selBranch, setSelBranch] = useState<string>("all");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [structDialog, setStructDialog] = useState(false);
  const [structForm, setStructForm] = useState({
    employee_id: "", basic_salary: 0, house_rent: 0, medical_allowance: 0,
    other_allowance: 0, effective_from: new Date().toISOString().split("T")[0],
  });

  // Payslip
  const [payslipDialog, setPayslipDialog] = useState(false);
  const [payslipData, setPayslipData] = useState<PayrollDetail | null>(null);
  const payslipRef = useRef<HTMLDivElement>(null);

  // Review before generate
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState<PayrollDetail[]>([]);

  const fetchData = useCallback(async () => {
    const [empRes, strRes, payRes, brRes] = await Promise.all([
      supabase.from("employees" as any).select("id, employee_code, first_name, last_name, salary, branch_id, department_id").eq("status", "active"),
      supabase.from("salary_structures" as any).select("*").order("effective_from", { ascending: false }),
      supabase.from("payroll" as any).select("*").eq("month", selMonth).eq("year", selYear).order("created_at"),
      supabase.from("branches").select("id, name").eq("status", "active"),
    ]);
    if (empRes.data) setEmployees(empRes.data as any);
    if (strRes.data) setStructures(strRes.data as any);
    if (payRes.data) setPayroll(payRes.data as any);
    if (brRes.data) setBranches(brRes.data as any);
  }, [selMonth, selYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStructure = (empId: string): SalaryStructure | undefined =>
    structures.find(s => s.employee_id === empId);

  const getEmpName = (id: string) => {
    const e = employees.find(e => e.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "-";
  };

  const filteredEmployees = selBranch === "all"
    ? employees
    : employees.filter(e => e.branch_id === selBranch);

  const calculatePayrollForEmployee = async (emp: Employee, daysInMonth: number, totalWorkingDays: number, startDate: string, endDate: string): Promise<PayrollDetail> => {
    const struct = getStructure(emp.id);
    const basic = struct?.basic_salary ?? emp.salary;
    const houseRent = struct?.house_rent ?? 0;
    const medical = struct?.medical_allowance ?? 0;
    const otherAllowance = struct?.other_allowance ?? 0;
    const totalSalary = struct?.total_salary ?? (basic + houseRent + medical + otherAllowance);

    // Fetch attendance
    const { data: attendance } = await supabase.from("attendance" as any)
      .select("status")
      .eq("employee_id", emp.id)
      .gte("date", startDate)
      .lte("date", endDate);

    const att = (attendance || []) as any[];
    const presentDays = att.filter(a => a.status === "present").length;
    const lateDays = att.filter(a => a.status === "late").length;
    const leaveDays = att.filter(a => a.status === "leave").length;
    const absentDays = Math.max(0, totalWorkingDays - presentDays - lateDays - leaveDays);

    // Fetch approved overtime
    const { data: overtime } = await supabase.from("overtime_records" as any)
      .select("hours")
      .eq("employee_id", emp.id)
      .eq("status", "approved")
      .gte("date", startDate)
      .lte("date", endDate);

    const totalOvertimeHours = (overtime || []).reduce((s: number, o: any) => s + Number(o.hours), 0);
    const dailySalary = totalSalary / totalWorkingDays;
    const hourlyRate = dailySalary / 8;
    const overtimePay = hourlyRate * 1.5 * totalOvertimeHours;
    const absentDeduction = absentDays * dailySalary;
    const lateDeduction = lateDays * LATE_PENALTY;

    const gross = totalSalary + overtimePay;
    const totalDeductions = absentDeduction + lateDeduction;
    const netSalary = Math.max(0, gross - totalDeductions);

    return {
      employee_name: `${emp.first_name} ${emp.last_name}`,
      employee_code: emp.employee_code,
      basic_salary: basic,
      house_rent: houseRent,
      medical,
      other_allowance: otherAllowance,
      overtime_hours: totalOvertimeHours,
      overtime_pay: overtimePay,
      present_days: presentDays + lateDays,
      absent_days: absentDays,
      late_count: lateDays,
      leave_days: leaveDays,
      total_working_days: totalWorkingDays,
      absent_deduction: absentDeduction,
      late_deduction: lateDeduction,
      base_deductions: 0,
      gross,
      total_deductions: totalDeductions,
      net_salary: netSalary,
    };
  };

  const handlePreviewGenerate = async () => {
    setGenerating(true);
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    let totalWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(selYear, selMonth - 1, d).getDay();
      if (day !== 0 && day !== 6) totalWorkingDays++;
    }

    const startDate = `${selYear}-${String(selMonth).padStart(2, "0")}-01`;
    const endDate = `${selYear}-${String(selMonth).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const toGenerate = filteredEmployees.filter(emp => !payroll.find(p => p.employee_id === emp.id));
    if (toGenerate.length === 0) {
      toast.info("Payroll already generated for all employees");
      setGenerating(false);
      return;
    }

    const details: PayrollDetail[] = [];
    for (const emp of toGenerate) {
      const detail = await calculatePayrollForEmployee(emp, daysInMonth, totalWorkingDays, startDate, endDate);
      details.push(detail);
    }

    setReviewData(details);
    setReviewDialog(true);
    setGenerating(false);
  };

  const confirmGenerate = async () => {
    setGenerating(true);
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    let totalWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(selYear, selMonth - 1, d).getDay();
      if (day !== 0 && day !== 6) totalWorkingDays++;
    }

    const startDate = `${selYear}-${String(selMonth).padStart(2, "0")}-01`;
    const endDate = `${selYear}-${String(selMonth).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    let count = 0;
    const toGenerate = filteredEmployees.filter(emp => !payroll.find(p => p.employee_id === emp.id));

    for (const emp of toGenerate) {
      const detail = await calculatePayrollForEmployee(emp, daysInMonth, totalWorkingDays, startDate, endDate);

      const { error } = await supabase.from("payroll" as any).insert({
        employee_id: emp.id, month: selMonth, year: selYear,
        basic_salary: detail.basic_salary,
        allowances: detail.house_rent + detail.medical + detail.other_allowance + detail.overtime_pay,
        deductions: detail.total_deductions,
        net_salary: detail.net_salary,
      });
      if (!error) count++;
    }

    toast.success(`Generated payroll for ${count} employees`);
    setReviewDialog(false);
    setGenerating(false);
    fetchData();
  };

  const approvePayroll = async (id: string) => {
    const record = payroll.find(p => p.id === id);
    if (!record) return;

    // Update status
    const { error } = await supabase.from("payroll" as any).update({ status: "approved" }).eq("id", id);
    if (error) { toast.error(error.message); return; }

    // Create accounting entry (Debit Salary Expense, Credit Cash)
    try {
      const { data: accounts } = await supabase.from("chart_of_accounts")
        .select("id, account_name")
        .in("account_name", ["Salary Expense", "Cash"]);

      const salaryExpenseAcc = (accounts || []).find((a: any) => a.account_name === "Salary Expense");
      const cashAcc = (accounts || []).find((a: any) => a.account_name === "Cash");

      if (salaryExpenseAcc && cashAcc) {
        const empName = getEmpName(record.employee_id);
        await voucherApi.create({
          voucher_type: "journal",
          voucher_date: new Date().toISOString().split("T")[0],
          description: `Salary payment - ${empName} - ${months[record.month - 1]} ${record.year}`,
          entries: [
            { account_id: salaryExpenseAcc.id, debit: record.net_salary, credit: 0, narration: `Salary: ${empName}` },
            { account_id: cashAcc.id, debit: 0, credit: record.net_salary, narration: `Salary: ${empName}` },
          ],
          submit: true,
        });

        // Link voucher (get latest voucher for this)
        toast.success("Payroll approved & accounting entry created");
      } else {
        toast.success("Payroll approved (accounting accounts not found - skipped auto-posting)");
      }
    } catch {
      toast.success("Payroll approved (accounting entry skipped)");
    }

    fetchData();
  };

  const approveAll = async () => {
    const drafts = payroll.filter(p => p.status === "draft");
    for (const p of drafts) {
      await approvePayroll(p.id);
    }
  };

  const showPayslip = async (record: PayrollRecord) => {
    const emp = employees.find(e => e.id === record.employee_id);
    if (!emp) return;

    const struct = getStructure(emp.id);
    const detail: PayrollDetail = {
      employee_name: `${emp.first_name} ${emp.last_name}`,
      employee_code: emp.employee_code,
      basic_salary: record.basic_salary,
      house_rent: struct?.house_rent ?? 0,
      medical: struct?.medical_allowance ?? 0,
      other_allowance: struct?.other_allowance ?? 0,
      overtime_hours: 0, overtime_pay: 0,
      present_days: 0, absent_days: 0, late_count: 0, leave_days: 0,
      total_working_days: 0,
      absent_deduction: 0, late_deduction: 0, base_deductions: 0,
      gross: record.basic_salary + record.allowances,
      total_deductions: record.deductions,
      net_salary: record.net_salary,
    };
    setPayslipData(detail);
    setPayslipDialog(true);
  };

  const printPayslip = () => {
    if (!payslipRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Payslip</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#000}table{width:100%;border-collapse:collapse}td,th{padding:8px 12px;border:1px solid #ddd;text-align:left}.text-right{text-align:right}.font-bold{font-weight:bold}.header{text-align:center;margin-bottom:24px}h2{margin:0}p{margin:4px 0}</style>
      </head><body>${payslipRef.current.innerHTML}<script>window.print();window.close();</script></body></html>
    `);
    printWindow.document.close();
  };

  const saveStructure = async () => {
    if (!structForm.employee_id) { toast.error("Select employee"); return; }
    const total = structForm.basic_salary + structForm.house_rent + structForm.medical_allowance + structForm.other_allowance;
    const { error } = await supabase.from("salary_structures" as any).insert({
      employee_id: structForm.employee_id,
      basic_salary: structForm.basic_salary,
      house_rent: structForm.house_rent,
      medical_allowance: structForm.medical_allowance,
      other_allowance: structForm.other_allowance,
      total_salary: total,
      effective_from: structForm.effective_from,
    });
    if (error) toast.error(error.message);
    else { toast.success("Salary structure saved"); setStructDialog(false); fetchData(); }
  };

  const totalNet = payroll.reduce((s, p) => s + p.net_salary, 0);
  const draftCount = payroll.filter(p => p.status === "draft").length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-muted-foreground text-sm">Attendance-based salary with overtime & late deductions</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Total Payroll</p>
          <p className="text-xl font-bold text-foreground">{formatAmount(totalNet)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Employees</p>
          <p className="text-xl font-bold text-foreground">{payroll.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="text-xl font-bold text-foreground">{payroll.filter(p => p.status === "approved").length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-bold text-foreground">{draftCount}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="payroll">
        <TabsList>
          <TabsTrigger value="payroll">Generate Payroll</TabsTrigger>
          <TabsTrigger value="structures">Salary Structures</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {months[selMonth - 1]} {selYear}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={String(selMonth)} onValueChange={v => setSelMonth(Number(v))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" value={selYear} onChange={e => setSelYear(Number(e.target.value))} className="w-20" />
                  <Select value={selBranch} onValueChange={setSelBranch}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Branch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {isAdmin && (
                    <>
                      <Button onClick={handlePreviewGenerate} disabled={generating} size="sm">
                        <Play className="w-4 h-4 mr-1" />{generating ? "Loading..." : "Generate"}
                      </Button>
                      {draftCount > 0 && (
                        <Button onClick={approveAll} variant="outline" size="sm">
                          <CheckCircle className="w-4 h-4 mr-1" />Approve All ({draftCount})
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                Net = (Basic + Allowances + OT×1.5) − (Absent Days × Daily Rate) − (Late × ৳{LATE_PENALTY})
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Basic</TableHead>
                      <TableHead className="text-right">Allowances</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payroll.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{getEmpName(p.employee_id)}</TableCell>
                        <TableCell className="text-right">{formatAmount(p.basic_salary)}</TableCell>
                        <TableCell className="text-right">{formatAmount(p.allowances)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatAmount(p.deductions)}</TableCell>
                        <TableCell className="text-right font-bold">{formatAmount(p.net_salary)}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "approved" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => showPayslip(p)}>
                              <FileText className="w-4 h-4" />
                            </Button>
                            {isAdmin && p.status === "draft" && (
                              <Button variant="ghost" size="sm" onClick={() => approvePayroll(p.id)}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payroll.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No payroll generated for this period
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {payroll.length > 0 && (
                <div className="flex justify-end mt-3 pt-3 border-t">
                  <span className="text-sm font-bold text-foreground">Total Net: {formatAmount(totalNet)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structures">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Salary Structures</CardTitle>
                {isAdmin && (
                  <Button size="sm" onClick={() => {
                    setStructForm({ employee_id: "", basic_salary: 0, house_rent: 0, medical_allowance: 0, other_allowance: 0, effective_from: new Date().toISOString().split("T")[0] });
                    setStructDialog(true);
                  }}>Add Structure</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Basic</TableHead>
                    <TableHead className="text-right">House Rent</TableHead>
                    <TableHead className="text-right">Medical</TableHead>
                    <TableHead className="text-right">Other</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Effective</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{getEmpName(s.employee_id)}</TableCell>
                      <TableCell className="text-right">{formatAmount(s.basic_salary)}</TableCell>
                      <TableCell className="text-right">{formatAmount(s.house_rent)}</TableCell>
                      <TableCell className="text-right">{formatAmount(s.medical_allowance)}</TableCell>
                      <TableCell className="text-right">{formatAmount(s.other_allowance)}</TableCell>
                      <TableCell className="text-right font-bold">{formatAmount(s.total_salary)}</TableCell>
                      <TableCell>{s.effective_from}</TableCell>
                    </TableRow>
                  ))}
                  {structures.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No salary structures</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Salary Structure Dialog */}
      <Dialog open={structDialog} onOpenChange={setStructDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Salary Structure</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={structForm.employee_id} onValueChange={v => setStructForm({...structForm, employee_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Basic Salary</Label><Input type="number" value={structForm.basic_salary} onChange={e => setStructForm({...structForm, basic_salary: Number(e.target.value)})} /></div>
              <div><Label>House Rent</Label><Input type="number" value={structForm.house_rent} onChange={e => setStructForm({...structForm, house_rent: Number(e.target.value)})} /></div>
              <div><Label>Medical Allowance</Label><Input type="number" value={structForm.medical_allowance} onChange={e => setStructForm({...structForm, medical_allowance: Number(e.target.value)})} /></div>
              <div><Label>Other Allowance</Label><Input type="number" value={structForm.other_allowance} onChange={e => setStructForm({...structForm, other_allowance: Number(e.target.value)})} /></div>
            </div>
            <div className="bg-muted/50 p-2 rounded text-sm">
              Total: {formatAmount(structForm.basic_salary + structForm.house_rent + structForm.medical_allowance + structForm.other_allowance)}
            </div>
            <div><Label>Effective From</Label><Input type="date" value={structForm.effective_from} onChange={e => setStructForm({...structForm, effective_from: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStructDialog(false)}>Cancel</Button><Button onClick={saveStructure}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Payroll - {months[selMonth - 1]} {selYear}</DialogTitle>
            <DialogDescription>Review calculated payroll before generating records.</DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                  <TableHead className="text-right">OT Hrs</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewData.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{d.employee_name}</TableCell>
                    <TableCell className="text-right">{d.present_days}/{d.total_working_days}</TableCell>
                    <TableCell className="text-right text-destructive">{d.absent_days}</TableCell>
                    <TableCell className="text-right">{d.late_count}</TableCell>
                    <TableCell className="text-right">{d.overtime_hours}</TableCell>
                    <TableCell className="text-right">{formatAmount(d.gross)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatAmount(d.total_deductions)}</TableCell>
                    <TableCell className="text-right font-bold">{formatAmount(d.net_salary)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">{reviewData.length} employees</span>
            <span className="font-bold">Total: {formatAmount(reviewData.reduce((s, d) => s + d.net_salary, 0))}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>Cancel</Button>
            <Button onClick={confirmGenerate} disabled={generating}>{generating ? "Generating..." : "Confirm & Generate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip Dialog */}
      <Dialog open={payslipDialog} onOpenChange={setPayslipDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Payslip
            </DialogTitle>
          </DialogHeader>
          {payslipData && (
            <div ref={payslipRef}>
              <div className="header" style={{ textAlign: "center", marginBottom: 16 }}>
                <h2 className="text-lg font-bold text-foreground">Payslip</h2>
                <p className="text-sm text-muted-foreground">{months[selMonth - 1]} {selYear}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-muted-foreground">Employee:</span> <strong>{payslipData.employee_name}</strong></div>
                <div><span className="text-muted-foreground">Code:</span> {payslipData.employee_code}</div>
              </div>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b"><td className="py-2 text-muted-foreground">Basic Salary</td><td className="py-2 text-right">{formatAmount(payslipData.basic_salary)}</td></tr>
                  {payslipData.house_rent > 0 && <tr className="border-b"><td className="py-2 text-muted-foreground">House Rent</td><td className="py-2 text-right">{formatAmount(payslipData.house_rent)}</td></tr>}
                  {payslipData.medical > 0 && <tr className="border-b"><td className="py-2 text-muted-foreground">Medical Allowance</td><td className="py-2 text-right">{formatAmount(payslipData.medical)}</td></tr>}
                  {payslipData.other_allowance > 0 && <tr className="border-b"><td className="py-2 text-muted-foreground">Other Allowance</td><td className="py-2 text-right">{formatAmount(payslipData.other_allowance)}</td></tr>}
                  {payslipData.overtime_pay > 0 && <tr className="border-b"><td className="py-2 text-muted-foreground">Overtime ({payslipData.overtime_hours} hrs × 1.5x)</td><td className="py-2 text-right">{formatAmount(payslipData.overtime_pay)}</td></tr>}
                  <tr className="border-b font-bold"><td className="py-2">Gross</td><td className="py-2 text-right">{formatAmount(payslipData.gross)}</td></tr>
                  {payslipData.total_deductions > 0 && <tr className="border-b text-destructive"><td className="py-2">Deductions</td><td className="py-2 text-right">-{formatAmount(payslipData.total_deductions)}</td></tr>}
                  <tr className="font-bold text-lg"><td className="py-3">Net Salary</td><td className="py-3 text-right">{formatAmount(payslipData.net_salary)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayslipDialog(false)}>Close</Button>
            <Button onClick={printPayslip}><Printer className="w-4 h-4 mr-1" />Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
