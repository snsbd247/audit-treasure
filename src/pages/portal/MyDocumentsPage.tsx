import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Printer } from "lucide-react";

const docTypes = [
  { value: "salary", label: "Salary Certificate" },
  { value: "verification", label: "Employment Verification" },
];

export default function MyDocumentsPage() {
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  const [employee, setEmployee] = useState<any>(null);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [docType, setDocType] = useState("salary");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: emp } = await supabase.from("employees" as any).select("*").eq("user_id", user.id).single();
      if (!emp) return;
      setEmployee(emp);
      const [d, ds] = await Promise.all([
        (emp as any).department_id ? supabase.from("departments" as any).select("name").eq("id", (emp as any).department_id).single() : Promise.resolve({ data: null }),
        (emp as any).designation_id ? supabase.from("designations" as any).select("name").eq("id", (emp as any).designation_id).single() : Promise.resolve({ data: null }),
      ]);
      if (d.data) setDepartment((d.data as any).name);
      if (ds.data) setDesignation((ds.data as any).name);
    })();
  }, [user]);

  if (!employee) return <div className="text-center py-16 text-muted-foreground">No employee profile linked.</div>;

  const companyName = settings?.company_name || "Company";
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const generate = () => {
    if (docType === "salary") {
      setPreview(`<h2>Salary Certificate</h2><p>Date: ${today}</p><p>To Whom It May Concern,</p><p>This certifies that <strong>${fullName}</strong> (${employee.employee_code}) is employed at <strong>${companyName}</strong> as <strong>${designation}</strong>. Current salary: <strong>${employee.salary.toLocaleString()}</strong>/month.</p><br/><p>Sincerely,<br/><strong>${companyName}</strong></p>`);
    } else {
      setPreview(`<h2>Employment Verification</h2><p>Date: ${today}</p><p>To Whom It May Concern,</p><p>This confirms that <strong>${fullName}</strong> is employed at <strong>${companyName}</strong> as <strong>${designation}</strong> in <strong>${department}</strong> department since <strong>${employee.joining_date}</strong>. Status: <strong>Active</strong>.</p><br/><p>Sincerely,<br/><strong>${companyName}</strong></p>`);
    }
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>Document</title><style>body{font-family:Arial;padding:40px;line-height:1.8;}h2{border-bottom:2px solid #333;padding-bottom:10px;}</style></head><body>${preview}</body></html>`);
      win.document.close(); win.print();
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">My Documents</h1></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Request Document</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 mb-6">
            <div className="w-64"><Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{docTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={generate}>Generate</Button>
            {preview && <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button>}
          </div>
          {preview && <div className="border rounded-lg p-8 bg-card" dangerouslySetInnerHTML={{ __html: preview }} />}
        </CardContent>
      </Card>
    </div>
  );
}
