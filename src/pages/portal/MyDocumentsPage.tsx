import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePortalEmployee } from "@/hooks/usePortalEmployee";
import { PortalEmployeeSelector } from "@/components/portal/PortalEmployeeSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Printer, Download } from "lucide-react";
import DOMPurify from "dompurify";

interface DocRecord { id: string; document_type: string; document_title: string; document_html: string | null; created_at: string; }

const docTypes = [
  { value: "salary_certificate", label: "Salary Certificate" },
  { value: "verification_letter", label: "Employment Verification" },
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

export default function MyDocumentsPage() {
  const { settings } = useCompanySettings();
  const { fc } = useCurrency();
  const { employee, loading, isHrAdmin, allEmployees, selectedEmployeeId, selectEmployee } = usePortalEmployee();
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [docType, setDocType] = useState("salary_certificate");
  const [preview, setPreview] = useState("");
  const [savedDocs, setSavedDocs] = useState<DocRecord[]>([]);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const [d, ds, docsRes] = await Promise.all([
        employee.department_id ? supabase.from("departments").select("name").eq("id", employee.department_id).single() : Promise.resolve({ data: null }),
        employee.designation_id ? supabase.from("designations").select("name").eq("id", employee.designation_id).single() : Promise.resolve({ data: null }),
        supabase.from("employee_documents").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false }),
      ]);
      if (d.data) setDepartment((d.data as any).name); else setDepartment("");
      if (ds.data) setDesignation((ds.data as any).name); else setDesignation("");
      if (docsRes.data) setSavedDocs(docsRes.data as any);
    })();
  }, [employee]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;

  if (!employee) return (
    <div className="text-center py-16 text-muted-foreground">
      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No employee profile linked to your account.</p>
      <p className="text-sm mt-1">Contact your administrator.</p>
    </div>
  );

  const companyName = settings?.company_name || "Company";
  const companyAddress = settings?.address || "";
  const companyPhone = settings?.phone || "";
  const companyEmail = settings?.email || "";
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const letterhead = `
    <div class="letterhead">
      <h1>${companyName}</h1>
      ${companyAddress ? `<p>${companyAddress}</p>` : ""}
      ${companyPhone || companyEmail ? `<p>${[companyPhone, companyEmail].filter(Boolean).join(" | ")}</p>` : ""}
    </div>
    <div class="ref-line"><span>Ref: ${employee.employee_code}</span><span>Date: ${today}</span></div>
  `;

  const generate = () => {
    let html = "";
    if (docType === "salary_certificate") {
      html = `${letterhead}
        <h2>Salary Certificate</h2>
        <p>To Whom It May Concern,</p>
        <p>This is to certify that <strong>${fullName}</strong> (Employee Code: <strong>${employee.employee_code}</strong>) is currently employed at <strong>${companyName}</strong> as a <strong>${designation}</strong> in the <strong>${department}</strong> department.</p>
        <table class="details">
          <tr><td>Employee Name</td><td>${fullName}</td></tr>
          <tr><td>Employee Code</td><td>${employee.employee_code}</td></tr>
          <tr><td>Designation</td><td>${designation}</td></tr>
          <tr><td>Department</td><td>${department}</td></tr>
          <tr><td>Monthly Salary</td><td>${fc(employee.salary)}</td></tr>
        </table>
        <p>This certificate is issued upon the request of the employee.</p>
        <div class="signature"><p>Yours faithfully,</p><div class="line">Authorized Signatory<br/><strong>${companyName}</strong></div></div>
        <div class="footer">This is a computer-generated document from ${companyName}</div>`;
    } else {
      html = `${letterhead}
        <h2>Employment Verification Letter</h2>
        <p>To Whom It May Concern,</p>
        <p>This letter verifies that <strong>${fullName}</strong> (Employee Code: <strong>${employee.employee_code}</strong>) is currently employed at <strong>${companyName}</strong>.</p>
        <table class="details">
          <tr><td>Employee Name</td><td>${fullName}</td></tr>
          <tr><td>Employee Code</td><td>${employee.employee_code}</td></tr>
          <tr><td>Designation</td><td>${designation}</td></tr>
          <tr><td>Department</td><td>${department}</td></tr>
          <tr><td>Date of Joining</td><td>${employee.joining_date}</td></tr>
          <tr><td>Status</td><td style="text-transform:capitalize">${employee.status}</td></tr>
        </table>
        <p>This letter is issued upon employee request and does not constitute any company commitment.</p>
        <div class="signature"><p>Yours faithfully,</p><div class="line">Authorized Signatory<br/><strong>${companyName}</strong></div></div>
        <div class="footer">This is a computer-generated document from ${companyName}</div>`;
    }
    setPreview(html);
  };

  const handlePrint = (html: string) => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>Document</title><style>${buildDocumentStyles()}</style></head><body>${html}</body></html>`);
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
        <div><h1 className="text-2xl font-bold text-foreground">My Documents</h1><p className="text-muted-foreground">View and generate your employment documents</p></div>

        <Tabs defaultValue="saved">
          <TabsList>
            <TabsTrigger value="saved">My Documents ({savedDocs.length})</TabsTrigger>
            <TabsTrigger value="generate">Generate New</TabsTrigger>
          </TabsList>

          <TabsContent value="saved">
            <Card>
              <CardContent className="pt-6">
                {savedDocs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No documents available yet.</p>
                    <p className="text-sm mt-1">Documents generated by HR will appear here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedDocs.map(doc => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.document_title}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{doc.document_type.replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => doc.document_html && handlePrint(doc.document_html)}>
                              <Download className="w-4 h-4 mr-1" />View & Print
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Generate Document</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 mb-6">
                  <div className="w-64">
                    <Label>Document Type</Label>
                    <Select value={docType} onValueChange={v => { setDocType(v); setPreview(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{docTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={generate}>Generate</Button>
                  {preview && <Button variant="outline" onClick={() => handlePrint(preview)}><Printer className="w-4 h-4 mr-2" />Print</Button>}
                </div>
                {preview && (
                  <div className="border rounded-lg p-10 bg-white text-black dark:bg-white dark:text-black max-w-3xl mx-auto shadow-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preview) }} style={{ fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.9 }} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
