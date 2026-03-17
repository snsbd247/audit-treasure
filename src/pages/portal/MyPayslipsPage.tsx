import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePortalEmployee } from "@/hooks/usePortalEmployee";
import { PortalEmployeeSelector } from "@/components/portal/PortalEmployeeSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Eye } from "lucide-react";

const monthNames = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const monthsShort = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MyPayslipsPage() {
  const { fc } = useCurrency();
  const { settings } = useCompanySettings();
  const { employee, loading, isHrAdmin, allEmployees, selectedEmployeeId, selectEmployee } = usePortalEmployee();
  const [payroll, setPayroll] = useState<any[]>([]);
  const [viewPayslip, setViewPayslip] = useState<any>(null);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const { data } = await supabase.from("payroll").select("*").eq("employee_id", employee.id).order("year", { ascending: false }).order("month", { ascending: false });
      if (data) setPayroll(data as any);
    })();
  }, [employee]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  if (!employee) return <div className="text-center py-16 text-muted-foreground">No employee profile linked.</div>;

  const companyName = settings?.company_name || "Company";

  const printPayslip = (p: any) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 30px;">
        <div style="text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #1a365d; font-size: 20px;">${companyName}</h1>
          <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Pay Slip — ${monthNames[p.month]} ${p.year}</p>
        </div>
        <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
          <tr><td style="padding: 4px 0; color: #666;">Employee Name</td><td style="font-weight: bold;">${employee.first_name} ${employee.last_name}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Employee Code</td><td>${employee.employee_code}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Period</td><td>${monthNames[p.month]} ${p.year}</td></tr>
        </table>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead><tr style="background: #f0f0f0;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Description</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Basic Salary</td><td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${fc(p.basic_salary)}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Allowances</td><td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${fc(p.allowances)}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Deductions</td><td style="padding: 8px; text-align: right; border: 1px solid #ddd; color: red;">-${fc(p.deductions)}</td></tr>
            <tr style="background: #f7f7f7; font-weight: bold;"><td style="padding: 8px; border: 1px solid #ddd;">Net Salary</td><td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${fc(p.net_salary)}</td></tr>
          </tbody>
        </table>
        <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #999;">
          This is a computer-generated payslip from ${companyName}
        </div>
      </div>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>Payslip — ${monthNames[p.month]} ${p.year}</title></head><body>${html}</body></html>`);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-0">
      {isHrAdmin && (
        <PortalEmployeeSelector employees={allEmployees} selectedId={selectedEmployeeId} onSelect={selectEmployee} />
      )}
      <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div><h1 className="text-2xl font-bold text-foreground">My Payslips</h1></div>
        <Card><CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Basic</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Allowances</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Deductions</TableHead>
              <TableHead className="text-right">Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payroll.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{monthsShort[p.month]} {p.year}</TableCell>
                  <TableCell className="text-right">{fc(p.basic_salary)}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{fc(p.allowances)}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{fc(p.deductions)}</TableCell>
                  <TableCell className="text-right font-bold">{fc(p.net_salary)}</TableCell>
                  <TableCell><Badge variant={p.status === "approved" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewPayslip(p)} title="View">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printPayslip(p)} title="Print/Download">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {payroll.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payslips</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>

        {/* Payslip Detail Dialog */}
        <Dialog open={!!viewPayslip} onOpenChange={() => setViewPayslip(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Payslip — {viewPayslip && `${monthNames[viewPayslip.month]} ${viewPayslip.year}`}</DialogTitle></DialogHeader>
            {viewPayslip && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">{employee.first_name} {employee.last_name} ({employee.employee_code})</div>
                <div className="divide-y">
                  {[
                    { label: "Basic Salary", value: fc(viewPayslip.basic_salary) },
                    { label: "Allowances", value: fc(viewPayslip.allowances) },
                    { label: "Deductions", value: `-${fc(viewPayslip.deductions)}`, red: true },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between py-2.5 text-sm">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className={r.red ? "text-destructive" : "text-foreground"}>{r.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2.5 text-sm font-bold">
                    <span>Net Salary</span>
                    <span className="text-foreground">{fc(viewPayslip.net_salary)}</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => printPayslip(viewPayslip)}>
                  <Printer className="w-4 h-4 mr-2" />Print / Download PDF
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
