import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Building2, Shield } from "lucide-react";

export default function EmployeeVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [employee, setEmployee] = useState<any>(null);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      if (!code) { setNotFound(true); setLoading(false); return; }

      const [empRes, companyRes] = await Promise.all([
        supabase.from("employees" as any).select("*").eq("employee_code", code).single(),
        supabase.from("company_settings").select("company_name, company_logo_url").eq("id", "default").single(),
      ]);

      if (!empRes.data) { setNotFound(true); setLoading(false); return; }

      const emp = empRes.data as any;
      setEmployee(emp);
      if (companyRes.data) {
        setCompanyName(companyRes.data.company_name);
        setCompanyLogo(companyRes.data.company_logo_url || "");
      }

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
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Verifying employee...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-10 pb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-5 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Employee Not Found</h2>
          <p className="text-muted-foreground">No employee record matches this verification code.</p>
          <p className="text-xs text-muted-foreground mt-4">If you believe this is an error, please contact the issuing organization.</p>
        </CardContent>
      </Card>
    </div>
  );

  const isActive = employee.status === "active";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 text-center">
          {companyLogo && <img src={companyLogo} alt="Logo" className="h-10 mx-auto mb-3" />}
          <h2 className="text-lg font-bold tracking-wide">{companyName}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Shield className="w-3.5 h-3.5" />
            <p className="text-xs uppercase tracking-widest opacity-80">Employee Verification</p>
          </div>
        </div>

        <CardContent className="pt-6 pb-8">
          {/* Status */}
          <div className="flex items-center justify-center mb-6">
            {isActive ? (
              <Badge className="px-5 py-2 text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />Employee Verified
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-5 py-2 text-sm font-semibold">
                <XCircle className="w-4 h-4 mr-2" />Inactive Employee
              </Badge>
            )}
          </div>

          {/* Photo */}
          <div className="text-center mb-6">
            {employee.photo_url ? (
              <img src={employee.photo_url} alt="Photo" className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-[3px] border-primary shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-muted-foreground border-[3px] border-primary shadow-md">
                {employee.first_name[0]}{employee.last_name[0]}
              </div>
            )}
            <h3 className="text-xl font-bold text-foreground">{employee.first_name} {employee.last_name}</h3>
            <p className="text-sm text-muted-foreground font-mono">{employee.employee_code}</p>
          </div>

          {/* Details */}
          <div className="space-y-3 border-t border-b py-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Department</span>
              <span className="font-medium text-foreground">{department || "-"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Designation</span>
              <span className="font-medium text-foreground">{designation || "-"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Company</span>
              <span className="font-medium text-foreground">{companyName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Status</span>
              <span className={`font-semibold capitalize ${isActive ? "text-green-600" : "text-destructive"}`}>{employee.status}</span>
            </div>
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-5">
            This is an official employee verification from {companyName}.
            <br />Verified on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
