import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePortalEmployee } from "@/hooks/usePortalEmployee";
import { PortalEmployeeSelector } from "@/components/portal/PortalEmployeeSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MyPayslipsPage() {
  const { fc } = useCurrency();
  const { employee, loading, isHrAdmin, allEmployees, selectedEmployeeId, selectEmployee } = usePortalEmployee();
  const [payroll, setPayroll] = useState<any[]>([]);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const { data } = await supabase.from("payroll").select("*").eq("employee_id", employee.id).order("year", { ascending: false }).order("month", { ascending: false });
      if (data) setPayroll(data as any);
    })();
  }, [employee]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  if (!employee) return <div className="text-center py-16 text-muted-foreground">No employee profile linked.</div>;

  return (
    <div className="space-y-0">
      {isHrAdmin && (
        <PortalEmployeeSelector employees={allEmployees} selectedId={selectedEmployeeId} onSelect={selectEmployee} />
      )}
      <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div><h1 className="text-2xl font-bold text-foreground">My Payslips</h1></div>
        <Card><CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Period</TableHead><TableHead className="text-right">Basic</TableHead><TableHead className="text-right">Allowances</TableHead><TableHead className="text-right">Deductions</TableHead><TableHead className="text-right">Net Salary</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {payroll.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{months[p.month]} {p.year}</TableCell>
                  <TableCell className="text-right">{fc(p.basic_salary)}</TableCell>
                  <TableCell className="text-right">{fc(p.allowances)}</TableCell>
                  <TableCell className="text-right">{fc(p.deductions)}</TableCell>
                  <TableCell className="text-right font-bold">{fc(p.net_salary)}</TableCell>
                  <TableCell><Badge variant={p.status === "approved" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></TableCell>
                </TableRow>
              ))}
              {payroll.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No payslips</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
}
