import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Printer } from "lucide-react";

interface Employee {
  id: string; employee_code: string; first_name: string; last_name: string;
  department_id: string | null; designation_id: string | null; joining_date: string;
  photo_url: string | null; status: string;
}
interface Dept { id: string; name: string; }
interface Desig { id: string; name: string; }

export default function IdCardsPage() {
  const { settings } = useCompanySettings();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [designations, setDesignations] = useState<Desig[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");

  useEffect(() => {
    (async () => {
      const [e, d, ds] = await Promise.all([
        supabase.from("employees" as any).select("*").order("first_name"),
        supabase.from("departments" as any).select("id, name"),
        supabase.from("designations" as any).select("id, name"),
      ]);
      if (e.data) setEmployees(e.data as any);
      if (d.data) setDepartments(d.data as any);
      if (ds.data) setDesignations(ds.data as any);
    })();
  }, []);

  const emp = employees.find(e => e.id === selectedEmp);
  const deptName = emp ? departments.find(d => d.id === emp.department_id)?.name || "-" : "";
  const desigName = emp ? designations.find(d => d.id === emp.designation_id)?.name || "-" : "";
  const companyName = settings?.company_name || "Company";
  const companyAddress = settings?.address || "";
  const companyLogo = settings?.company_logo_url || "";
  const verifyUrl = emp ? `${window.location.origin}/employee/verify/${emp.employee_code}` : "";
  const qrUrl = emp ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}` : "";

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win || !emp) return;
    const photoHtml = emp.photo_url
      ? `<img src="${emp.photo_url}" class="photo" />`
      : `<div class="photo-placeholder">${emp.first_name[0]}${emp.last_name[0]}</div>`;
    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" style="height:30px;margin-bottom:6px;" />`
      : "";

    win.document.write(`<html><head><title>ID Card - ${emp.employee_code}</title><style>
      @page { size: 86mm 54mm; margin: 0; }
      body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
      .card { width: 360px; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
      .header { background: linear-gradient(135deg, #1a365d, #2563eb); color: #fff; padding: 18px 20px; text-align: center; }
      .header h3 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: 1px; }
      .header p { margin: 5px 0 0; font-size: 10px; opacity: 0.75; letter-spacing: 0.5px; text-transform: uppercase; }
      .body { padding: 22px 20px 16px; text-align: center; }
      .photo { width: 85px; height: 85px; border-radius: 50%; object-fit: cover; margin: 0 auto 14px; border: 3px solid #1a365d; display: block; }
      .photo-placeholder { width: 85px; height: 85px; border-radius: 50%; background: #e2e8f0; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; font-size: 30px; color: #475569; border: 3px solid #1a365d; font-weight: bold; }
      .name { font-size: 19px; font-weight: 700; margin: 0; color: #1a1a1a; }
      .code { font-size: 12px; color: #64748b; margin: 4px 0 14px; font-family: monospace; letter-spacing: 1px; }
      .info { text-align: left; font-size: 13px; line-height: 2.2; padding: 0 8px; }
      .info .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; }
      .info .label { color: #64748b; }
      .info .value { font-weight: 600; color: #1e293b; }
      .qr-section { text-align: center; padding: 14px; border-top: 2px solid #f1f5f9; background: #fafbfc; }
      .qr-section img { width: 90px; height: 90px; }
      .qr-section p { font-size: 9px; color: #94a3b8; margin: 6px 0 0; }
      .verify-url { font-size: 8px; color: #cbd5e1; word-break: break-all; }
    </style></head><body>
      <div class="card">
        <div class="header">${logoHtml}<h3>${companyName}</h3><p>Employee Identity Card</p></div>
        <div class="body">
          ${photoHtml}
          <p class="name">${emp.first_name} ${emp.last_name}</p>
          <p class="code">${emp.employee_code}</p>
          <div class="info">
            <div class="row"><span class="label">Department</span><span class="value">${deptName}</span></div>
            <div class="row"><span class="label">Designation</span><span class="value">${desigName}</span></div>
            <div class="row"><span class="label">Joined</span><span class="value">${emp.joining_date}</span></div>
            <div class="row" style="border:none"><span class="label">Status</span><span class="value" style="color:${emp.status === "active" ? "#16a34a" : "#dc2626"};text-transform:capitalize">${emp.status}</span></div>
          </div>
        </div>
        <div class="qr-section">
          <img src="${qrUrl}" alt="QR Code" />
          <p>Scan QR code to verify employee</p>
          <p class="verify-url">${verifyUrl}</p>
        </div>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee ID Cards</h1>
        <p className="text-muted-foreground">Generate and print employee ID cards with QR verification</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />ID Card Generator</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 mb-8">
            <div className="w-80">
              <Label>Select Employee</Label>
              <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {emp && <Button onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print ID Card</Button>}
          </div>

          {emp && (
            <div className="flex justify-center">
              <div className="w-[360px] rounded-xl overflow-hidden border shadow-lg">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 text-center">
                  {companyLogo && <img src={companyLogo} alt="Logo" className="h-8 mx-auto mb-2" />}
                  <h3 className="font-bold text-lg tracking-wide">{companyName}</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-75 mt-1">Employee Identity Card</p>
                </div>
                <div className="p-6 text-center bg-card">
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt="Photo" className="w-[85px] h-[85px] rounded-full object-cover mx-auto mb-3 border-[3px] border-primary" />
                  ) : (
                    <div className="w-[85px] h-[85px] rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-muted-foreground border-[3px] border-primary">
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                  )}
                  <p className="text-lg font-bold text-foreground">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs text-muted-foreground font-mono tracking-wider mb-4">{emp.employee_code}</p>
                  <div className="text-left text-sm space-y-2">
                    <div className="flex justify-between border-b border-dashed border-border pb-1"><span className="text-muted-foreground">Department</span><span className="font-semibold">{deptName}</span></div>
                    <div className="flex justify-between border-b border-dashed border-border pb-1"><span className="text-muted-foreground">Designation</span><span className="font-semibold">{desigName}</span></div>
                    <div className="flex justify-between border-b border-dashed border-border pb-1"><span className="text-muted-foreground">Joined</span><span className="font-semibold">{emp.joining_date}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={emp.status === "active" ? "default" : "secondary"} className="capitalize">{emp.status}</Badge></div>
                  </div>
                </div>
                <div className="border-t p-4 text-center bg-muted/30">
                  <img src={qrUrl} alt="QR Code" className="w-[90px] h-[90px] mx-auto" />
                  <p className="text-[10px] text-muted-foreground mt-2">Scan QR code to verify employee</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
