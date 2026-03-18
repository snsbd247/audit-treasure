import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Shield, Search, Printer, ArrowLeft } from "lucide-react";

interface EmployeeResult {
  first_name: string;
  last_name: string;
  employee_code: string;
  photo_url: string | null;
  status: string;
  department_id: string | null;
  designation_id: string | null;
}

export default function EmployeeVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [searchCode, setSearchCode] = useState(code || "");
  const [employee, setEmployee] = useState<EmployeeResult | null>(null);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchCompany = async () => {
    const { data } = await supabase
      .from("company_settings")
      .select("company_name, company_logo_url")
      .eq("id", "default")
      .single();
    if (data) {
      setCompanyName(data.company_name);
      setCompanyLogo(data.company_logo_url || "");
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  useEffect(() => {
    if (code) doVerify(code);
  }, [code]);

  const doVerify = async (empCode: string) => {
    const trimmed = empCode.trim();
    if (!trimmed) return;
    setLoading(true);
    setNotFound(false);
    setEmployee(null);
    setDepartment("");
    setDesignation("");
    setSearched(true);

    const { data: emp } = await supabase
      .from("employees" as any)
      .select("first_name, last_name, employee_code, photo_url, status, department_id, designation_id")
      .eq("employee_code", trimmed)
      .single();

    if (!emp) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const e = emp as any;
    setEmployee(e);

    const [deptRes, desigRes] = await Promise.all([
      e.department_id
        ? supabase.from("departments" as any).select("name").eq("id", e.department_id).single()
        : Promise.resolve({ data: null }),
      e.designation_id
        ? supabase.from("designations" as any).select("name").eq("id", e.designation_id).single()
        : Promise.resolve({ data: null }),
    ]);

    if (deptRes.data) setDepartment((deptRes.data as any).name);
    if (desigRes.data) setDesignation((desigRes.data as any).name);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doVerify(searchCode);
  };

  const handlePrint = () => window.print();

  const isActive = employee?.status === "active";

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 to-background flex flex-col items-center justify-start p-4 pt-8 sm:pt-16 print:bg-white print:p-0 print:pt-0">
      {/* Search Section - hidden in print */}
      <div className="w-full max-w-md mb-6 print:hidden">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="text-center mb-6">
          {companyLogo && <img src={companyLogo} alt="Logo" className="h-12 mx-auto mb-2" />}
          <h1 className="text-2xl font-bold text-foreground">Employee Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter an Employee ID to verify their employment status
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Enter Employee ID (e.g. EMP-0001)"
            className="h-12 text-base"
            required
          />
          <Button type="submit" size="lg" className="h-12 px-5 shrink-0" disabled={loading}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 print:hidden">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Verifying employee...</p>
        </div>
      )}

      {/* Not Found State */}
      {!loading && searched && notFound && (
        <Card className="w-full max-w-md print:hidden">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Employee Not Found</h2>
            <p className="text-sm text-muted-foreground">
              No employee record matches code "<span className="font-mono font-semibold">{searchCode}</span>".
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Please check the ID and try again, or contact the organization.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Result Card */}
      {!loading && employee && (
        <div ref={printRef} className="w-full max-w-md">
          <Card className="overflow-hidden shadow-lg print:shadow-none print:border">
            {/* Card Header */}
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 text-center print:bg-primary print:text-white">
              {companyLogo && <img src={companyLogo} alt="Logo" className="h-8 mx-auto mb-2 print:h-10" />}
              <h2 className="text-base font-bold tracking-wide">{companyName}</h2>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <Shield className="w-3 h-3" />
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">Employee Verification</p>
              </div>
            </div>

            <CardContent className="pt-5 pb-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center mb-5">
                {isActive ? (
                  <Badge className="px-4 py-1.5 text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 print:bg-green-100 print:text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1.5" />Verified — Active Employee
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="px-4 py-1.5 text-sm font-semibold">
                    <XCircle className="w-4 h-4 mr-1.5" />Inactive Employee
                  </Badge>
                )}
              </div>

              {/* Photo & Name */}
              <div className="text-center mb-5">
                {employee.photo_url ? (
                  <img
                    src={employee.photo_url}
                    alt="Photo"
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-[3px] border-primary shadow-md print:w-28 print:h-28"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-muted-foreground border-[3px] border-primary shadow-md print:w-28 print:h-28">
                    {employee.first_name[0]}{employee.last_name[0]}
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground">{employee.first_name} {employee.last_name}</h3>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{employee.employee_code}</p>
              </div>

              {/* Info Rows */}
              <div className="space-y-2.5 border-t border-b py-4">
                {[
                  { label: "Department", value: department },
                  { label: "Designation", value: designation },
                  { label: "Company", value: companyName },
                  { label: "Status", value: employee.status, isStatus: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center px-1">
                    <span className="text-muted-foreground text-sm">{row.label}</span>
                    {row.isStatus ? (
                      <span className={`font-semibold capitalize ${isActive ? "text-green-600" : "text-destructive"}`}>
                        {row.value}
                      </span>
                    ) : (
                      <span className="font-medium text-foreground">{row.value || "—"}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Print Button - hidden in print */}
              <div className="mt-5 print:hidden">
                <Button onClick={handlePrint} variant="outline" className="w-full h-10">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Verification
                </Button>
              </div>

              {/* Footer */}
              <p className="text-[10px] text-center text-muted-foreground mt-4 print:mt-6">
                This is an official employee verification from {companyName}.
                <br />Verified on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
