import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Printer, Download } from "lucide-react";

interface Employee { id: string; employee_code: string; first_name: string; last_name: string; department_id: string | null; designation_id: string | null; joining_date: string; salary: number; }
interface Dept { id: string; name: string; }
interface Desig { id: string; name: string; }

const docTypes = [
  { value: "appointment", label: "Appointment Letter" },
  { value: "experience", label: "Experience Certificate" },
  { value: "salary", label: "Salary Certificate" },
  { value: "verification", label: "Employment Verification Letter" },
];

export default function DocumentsPage() {
  const { settings } = useCompanySettings();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [designations, setDesignations] = useState<Desig[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [docType, setDocType] = useState("appointment");
  const [preview, setPreview] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [e, d, ds] = await Promise.all([
        supabase.from("employees" as any).select("*").eq("status", "active").order("first_name"),
        supabase.from("departments" as any).select("id, name"),
        supabase.from("designations" as any).select("id, name"),
      ]);
      if (e.data) setEmployees(e.data as any);
      if (d.data) setDepartments(d.data as any);
      if (ds.data) setDesignations(ds.data as any);
    })();
  }, []);

  const emp = employees.find(e => e.id === selectedEmp);
  const deptName = emp ? departments.find(d => d.id === emp.department_id)?.name || "" : "";
  const desigName = emp ? designations.find(d => d.id === emp.designation_id)?.name || "" : "";
  const companyName = settings?.company_name || "Company";
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const generateDoc = () => {
    if (!emp) { toast.error("Select an employee"); return; }
    const fullName = `${emp.first_name} ${emp.last_name}`;
    let html = "";

    if (docType === "appointment") {
      html = `<h2>Appointment Letter</h2><p>Date: ${today}</p><p>Dear ${fullName},</p>
        <p>We are pleased to offer you the position of <strong>${desigName}</strong> in the <strong>${deptName}</strong> department at <strong>${companyName}</strong>.</p>
        <p>Your employment will commence on <strong>${emp.joining_date}</strong>.</p>
        <p>We look forward to working with you.</p><br/><p>Sincerely,</p><p><strong>${companyName}</strong></p>`;
    } else if (docType === "experience") {
      html = `<h2>Experience Certificate</h2><p>Date: ${today}</p><p>To Whom It May Concern,</p>
        <p>This is to certify that <strong>${fullName}</strong> has been employed at <strong>${companyName}</strong> as a <strong>${desigName}</strong> in the <strong>${deptName}</strong> department since <strong>${emp.joining_date}</strong>.</p>
        <p>During their tenure, they have demonstrated professionalism and dedication.</p><br/><p>Sincerely,</p><p><strong>${companyName}</strong></p>`;
    } else if (docType === "salary") {
      html = `<h2>Salary Certificate</h2><p>Date: ${today}</p><p>To Whom It May Concern,</p>
        <p>This is to certify that <strong>${fullName}</strong> (Employee Code: ${emp.employee_code}) is employed at <strong>${companyName}</strong> as a <strong>${desigName}</strong>.</p>
        <p>Their current salary is <strong>${emp.salary.toLocaleString()}</strong> per month.</p><br/><p>Sincerely,</p><p><strong>${companyName}</strong></p>`;
    } else {
      html = `<h2>Employment Verification Letter</h2><p>Date: ${today}</p><p>To Whom It May Concern,</p>
        <p>This letter confirms that <strong>${fullName}</strong> is currently employed at <strong>${companyName}</strong> as a <strong>${desigName}</strong> in the <strong>${deptName}</strong> department.</p>
        <p>They joined on <strong>${emp.joining_date}</strong> and their employment status is <strong>Active</strong>.</p><br/><p>Sincerely,</p><p><strong>${companyName}</strong></p>`;
    }
    setPreview(html);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>Document</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#333;line-height:1.8;}h2{border-bottom:2px solid #333;padding-bottom:10px;}</style></head><body>${preview}</body></html>`);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Employee Documents</h1><p className="text-muted-foreground">Generate official documents</p></div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Document Generator</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Employee</Label>
              <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{docTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={generateDoc}>Generate</Button>
              {preview && <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button>}
            </div>
          </div>
          {preview && (
            <div ref={printRef} className="border rounded-lg p-8 bg-card" dangerouslySetInnerHTML={{ __html: preview }} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
