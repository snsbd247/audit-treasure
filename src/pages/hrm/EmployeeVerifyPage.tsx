import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Building2 } from "lucide-react";

export default function EmployeeVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [employee, setEmployee] = useState<any>(null);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      if (!code) { setNotFound(true); setLoading(false); return; }

      const [empRes, companyRes] = await Promise.all([
        supabase.from("employees" as any).select("*").eq("employee_code", code).single(),
        supabase.from("company_settings").select("company_name").eq("id", "default").single(),
      ]);

      if (!empRes.data) { setNotFound(true); setLoading(false); return; }

      const emp = empRes.data as any;
      setEmployee(emp);
      if (companyRes.data) setCompanyName(companyRes.data.company_name);

      const [deptRes, desigRes] = await Promise.all([
        emp.department_id ? supabase.from("departments" as any).select("name").eq("id", emp.department_id).single() : Promise.resolve({ data: null }),
        emp.designation_id ? supabase.from("designations" as any).select("name").eq("id", emp.designation_id).single() : Promise.resolve({ data: null }),
      ]);

      if (deptRes.data) setDepartment((deptRes.data as any).name);
      if (desigRes.data) setDesignation((desigRes.data as any).name);
      setLoading(false);
    })();
  }, [code]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Verifying employee...</p>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center">
          <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground">Employee Not Found</h2>
          <p className="text-muted-foreground mt-2">No employee record matches this verification code.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{companyName}</h2>
            <p className="text-xs text-muted-foreground">Employee Verification</p>
          </div>

          <div className="flex items-center justify-center mb-6">
            {employee.status === "active" ? (
              <Badge className="px-4 py-1.5 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="w-4 h-4 mr-1.5" />Verified Active Employee
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-4 py-1.5 text-sm">
                <XCircle className="w-4 h-4 mr-1.5" />Inactive Employee
              </Badge>
            )}
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-muted-foreground border-2 border-primary">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
            <h3 className="text-xl font-bold text-foreground">{employee.first_name} {employee.last_name}</h3>
            <p className="text-sm text-muted-foreground">{employee.employee_code}</p>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium text-foreground">{department || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Designation</span><span className="font-medium text-foreground">{designation || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium text-foreground">{companyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize text-foreground">{employee.status}</span></div>
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-6">This is an official employee verification from {companyName}</p>
        </CardContent>
      </Card>
    </div>
  );
}
