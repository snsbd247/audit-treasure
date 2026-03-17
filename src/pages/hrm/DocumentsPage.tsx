import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText, Printer, Save, Download, Trash2 } from "lucide-react";

interface Employee {
  id: string; employee_code: string; first_name: string; last_name: string;
  department_id: string | null; designation_id: string | null; joining_date: string;
  salary: number; email: string | null; mobile: string | null; address: string | null;
  employment_type: string; status: string;
}
interface Dept { id: string; name: string; }
interface Desig { id: string; name: string; }
interface DocRecord { id: string; employee_id: string; document_type: string; document_title: string; document_html: string | null; created_at: string; }

const docTypes = [
  { value: "appointment_letter", label: "Appointment Letter" },
  { value: "experience_certificate", label: "Experience Certificate" },
  { value: "salary_certificate", label: "Salary Certificate" },
  { value: "verification_letter", label: "Employment Verification Letter" },
];

function buildDocumentStyles() {
  return `
    body { font-family: 'Georgia', 'Times New Roman', serif; padding: 50px 60px; color: #1a1a1a; line-height: 1.9; max-width: 800px; margin: 0 auto; }
    .letterhead { text-align: center; border-bottom: 3px double #1a365d; padding-bottom: 20px; margin-bottom: 30px; }
    .letterhead h1 { font-size: 24px; color: #1a365d; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
    .letterhead p { margin: 4px 0; font-size: 12px; color: #555; }
    .ref-line { display: flex; justify-content: space-between; font-size: 13px; color: #555; margin-bottom: 25px; }
    h2 { font-size: 18px; text-align: center; text-decoration: underline; text-underline-offset: 6px; margin: 30px 0 20px; color: #1a365d; }
    p { margin: 10px 0; text-align: justify; }
    .signature { margin-top: 60px; }
    .signature .line { border-top: 1px solid #333; width: 200px; margin-top: 50px; padding-top: 5px; }
    .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; font-size: 10px; color: #999; }
    strong { color: #111; }
    table.details { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table.details td { padding: 6px 12px; font-size: 14px; }
    table.details td:first-child { font-weight: bold; width: 180px; color: #555; }
  `;
}

export default function DocumentsPage() {
  const { settings } = useCompanySettings();
  const { fc } = useCurrency();
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission("hrm", "can_edit");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [designations, setDesignations] = useState<Desig[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [docType, setDocType] = useState("appointment_letter");
  const [preview, setPreview] = useState("");
  const [lastWorkingDate, setLastWorkingDate] = useState(new Date().toISOString().split("T")[0]);
  const [savedDocs, setSavedDocs] = useState<DocRecord[]>([]);

  useEffect(() => {
    (async () => {
      const [e, d, ds, docsRes] = await Promise.all([
        supabase.from("employees" as any).select("*").order("first_name"),
        supabase.from("departments" as any).select("id, name"),
        supabase.from("designations" as any).select("id, name"),
        supabase.from("employee_documents" as any).select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      if (e.data) setEmployees(e.data as any);
      if (d.data) setDepartments(d.data as any);
      if (ds.data) setDesignations(ds.data as any);
      if (docsRes.data) setSavedDocs(docsRes.data as any);
    })();
  }, []);

  const emp = employees.find(e => e.id === selectedEmp);
  const deptName = emp ? departments.find(d => d.id === emp.department_id)?.name || "" : "";
  const desigName = emp ? designations.find(d => d.id === emp.designation_id)?.name || "" : "";
  const companyName = settings?.company_name || "Company";
  const companyAddress = settings?.address || "";
  const companyPhone = settings?.phone || "";
  const companyEmail = settings?.email || "";
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const generateDoc = () => {
    if (!emp) { toast.error("Select an employee"); return; }
    const fullName = `${emp.first_name} ${emp.last_name}`;
    let html = "";

    const letterhead = `
      <div class="letterhead">
        <h1>${companyName}</h1>
        ${companyAddress ? `<p>${companyAddress}</p>` : ""}
        ${companyPhone || companyEmail ? `<p>${[companyPhone, companyEmail].filter(Boolean).join(" | ")}</p>` : ""}
      </div>
      <div class="ref-line"><span>Ref: ${emp.employee_code}/${docType.toUpperCase()}</span><span>Date: ${today}</span></div>
    `;

    if (docType === "appointment_letter") {
      html = `${letterhead}
        <h2>Appointment Letter</h2>
        <p>Dear <strong>${fullName}</strong>,</p>
        <p>We are pleased to inform you that you have been appointed to the position of <strong>${desigName}</strong> in the <strong>${deptName}</strong> department at <strong>${companyName}</strong>, effective from <strong>${emp.joining_date}</strong>.</p>
        <table class="details">
          <tr><td>Employee Code</td><td>${emp.employee_code}</td></tr>
          <tr><td>Designation</td><td>${desigName}</td></tr>
          <tr><td>Department</td><td>${deptName}</td></tr>
          <tr><td>Date of Joining</td><td>${emp.joining_date}</td></tr>
          <tr><td>Employment Type</td><td style="text-transform:capitalize">${emp.employment_type}</td></tr>
          <tr><td>Monthly Salary</td><td>${fc(emp.salary)}</td></tr>
        </table>
        <p>Your appointment is subject to the terms and conditions of employment as outlined in the company policy manual. You are expected to uphold the highest standards of professional conduct.</p>
        <p>We are confident that you will make a valuable contribution to our organization. We look forward to a long and mutually beneficial association.</p>
        <p>Please sign and return a copy of this letter as acceptance of your appointment.</p>
        <div class="signature">
          <p>Yours sincerely,</p>
          <div class="line">Authorized Signatory<br/><strong>${companyName}</strong></div>
        </div>
        <div class="footer">This is a computer-generated document from ${companyName}</div>`;
    } else if (docType === "experience_certificate") {
      html = `${letterhead}
        <h2>Experience Certificate</h2>
        <p>To Whom It May Concern,</p>
        <p>This is to certify that <strong>${fullName}</strong> (Employee Code: <strong>${emp.employee_code}</strong>) was employed at <strong>${companyName}</strong> from <strong>${emp.joining_date}</strong> to <strong>${lastWorkingDate}</strong>.</p>
        <table class="details">
          <tr><td>Employee Name</td><td>${fullName}</td></tr>
          <tr><td>Employee Code</td><td>${emp.employee_code}</td></tr>
          <tr><td>Designation</td><td>${desigName}</td></tr>
          <tr><td>Department</td><td>${deptName}</td></tr>
          <tr><td>Date of Joining</td><td>${emp.joining_date}</td></tr>
          <tr><td>Last Working Date</td><td>${lastWorkingDate}</td></tr>
        </table>
        <p>During their tenure with us, ${fullName} demonstrated a high level of professionalism, competence, and dedication. They consistently met expectations and contributed positively to the team and the organization.</p>
        <p>We wish them all the best in their future endeavors.</p>
        <div class="signature">
          <p>Yours faithfully,</p>
          <div class="line">Authorized Signatory<br/><strong>${companyName}</strong></div>
        </div>
        <div class="footer">This is a computer-generated document from ${companyName}</div>`;
    } else if (docType === "salary_certificate") {
      html = `${letterhead}
        <h2>Salary Certificate</h2>
        <p>To Whom It May Concern,</p>
        <p>This is to certify that <strong>${fullName}</strong> (Employee Code: <strong>${emp.employee_code}</strong>) is currently employed at <strong>${companyName}</strong> as a <strong>${desigName}</strong> in the <strong>${deptName}</strong> department.</p>
        <table class="details">
          <tr><td>Employee Name</td><td>${fullName}</td></tr>
          <tr><td>Employee Code</td><td>${emp.employee_code}</td></tr>
          <tr><td>Designation</td><td>${desigName}</td></tr>
          <tr><td>Department</td><td>${deptName}</td></tr>
          <tr><td>Date of Joining</td><td>${emp.joining_date}</td></tr>
          <tr><td>Monthly Salary</td><td>${fc(emp.salary)}</td></tr>
        </table>
        <p>This certificate is issued upon the request of the employee for whatever purpose it may serve.</p>
        <div class="signature">
          <p>Yours faithfully,</p>
          <div class="line">Authorized Signatory<br/><strong>${companyName}</strong></div>
        </div>
        <div class="footer">This is a computer-generated document from ${companyName}</div>`;
    } else {
      html = `${letterhead}
        <h2>Employment Verification Letter</h2>
        <p>To Whom It May Concern,</p>
        <p>This letter is to verify that <strong>${fullName}</strong> (Employee Code: <strong>${emp.employee_code}</strong>) is currently employed at <strong>${companyName}</strong>.</p>
        <table class="details">
          <tr><td>Employee Name</td><td>${fullName}</td></tr>
          <tr><td>Employee Code</td><td>${emp.employee_code}</td></tr>
          <tr><td>Designation</td><td>${desigName}</td></tr>
          <tr><td>Department</td><td>${deptName}</td></tr>
          <tr><td>Date of Joining</td><td>${emp.joining_date}</td></tr>
          <tr><td>Employment Type</td><td style="text-transform:capitalize">${emp.employment_type}</td></tr>
          <tr><td>Current Status</td><td style="text-transform:capitalize">${emp.status}</td></tr>
        </table>
        <p>This letter is issued upon the request of the employee and does not constitute any commitment on the part of the company.</p>
        <div class="signature">
          <p>Yours faithfully,</p>
          <div class="line">Authorized Signatory<br/><strong>${companyName}</strong></div>
        </div>
        <div class="footer">This is a computer-generated document from ${companyName}</div>`;
    }
    setPreview(html);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>Document</title><style>${buildDocumentStyles()}</style></head><body>${preview}</body></html>`);
      win.document.close();
      win.print();
    }
  };

  const handleSave = async () => {
    if (!emp || !preview) return;
    const docLabel = docTypes.find(d => d.value === docType)?.label || docType;
    const { error } = await supabase.from("employee_documents" as any).insert({
      employee_id: emp.id,
      document_type: docType,
      document_title: `${docLabel} - ${emp.first_name} ${emp.last_name}`,
      document_html: preview,
      generated_by: user?.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Document saved to employee record");
      const { data } = await supabase.from("employee_documents" as any).select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setSavedDocs(data as any);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const { error } = await supabase.from("employee_documents" as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setSavedDocs(prev => prev.filter(d => d.id !== id));
    }
  };

  const viewSavedDoc = (doc: DocRecord) => {
    const win = window.open("", "_blank");
    if (win && doc.document_html) {
      win.document.write(`<html><head><title>${doc.document_title}</title><style>${buildDocumentStyles()}</style></head><body>${doc.document_html}</body></html>`);
      win.document.close();
    }
  };

  const getEmpName = (id: string) => { const e = employees.find(e => e.id === id); return e ? `${e.first_name} ${e.last_name}` : "-"; };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee Documents</h1>
        <p className="text-muted-foreground">Generate official HR documents with company letterhead</p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Generate Document</TabsTrigger>
          <TabsTrigger value="history">Document History ({savedDocs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Document Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label>Employee</Label>
                  <Select value={selectedEmp} onValueChange={v => { setSelectedEmp(v); setPreview(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Document Type</Label>
                  <Select value={docType} onValueChange={v => { setDocType(v); setPreview(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{docTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {docType === "experience_certificate" && (
                  <div>
                    <Label>Last Working Date</Label>
                    <Input type="date" value={lastWorkingDate} onChange={e => setLastWorkingDate(e.target.value)} />
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <Button onClick={generateDoc}>Generate</Button>
                  {preview && (
                    <>
                      <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
                      {isAdmin && <Button variant="secondary" onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save</Button>}
                    </>
                  )}
                </div>
              </div>

              {preview && (
                <div className="border rounded-lg p-10 bg-white text-black dark:bg-white dark:text-black max-w-3xl mx-auto shadow-sm" dangerouslySetInnerHTML={{ __html: preview }} style={{ fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.9 }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedDocs.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.document_title}</TableCell>
                      <TableCell>{getEmpName(doc.employee_id)}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{doc.document_type.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => viewSavedDoc(doc)}><Download className="w-4 h-4 mr-1" />View</Button>
                        {isAdmin && <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {savedDocs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No documents generated yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
