import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Printer, QrCode } from "lucide-react";

interface Employee { id: string; employee_code: string; first_name: string; last_name: string; department_id: string | null; designation_id: string | null; joining_date: string; photo_url: string | null; status: string; }
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
  const verifyUrl = emp ? `${window.location.origin}/employee/verify/${emp.employee_code}` : "";
  const qrUrl = emp ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}` : "";

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win || !emp) return;
    win.document.write(`<html><head><title>ID Card</title><style>
      body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f0f0f0;}
      .card{width:340px;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.15);}
      .header{background:#1a365d;color:#fff;padding:16px;text-align:center;}
      .header h3{margin:0;font-size:16px;}
      .header p{margin:4px 0 0;font-size:11px;opacity:0.8;}
      .body{padding:20px;text-align:center;}
      .photo{width:80px;height:80px;border-radius:50%;background:#e2e8f0;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;color:#64748b;border:3px solid #1a365d;}
      .name{font-size:18px;font-weight:bold;margin:0;}
      .code{font-size:12px;color:#64748b;margin:4px 0 12px;}
      .info{text-align:left;font-size:13px;line-height:2;}
      .info span{color:#64748b;}
      .qr{text-align:center;padding:12px;border-top:1px solid #e2e8f0;}
      .qr img{width:100px;height:100px;}
      .qr p{font-size:10px;color:#94a3b8;margin:6px 0 0;}
    </style></head><body>
      <div class="card">
        <div class="header"><h3>${companyName}</h3><p>Employee Identity Card</p></div>
        <div class="body">
          <div class="photo">${emp.first_name[0]}${emp.last_name[0]}</div>
          <p class="name">${emp.first_name} ${emp.last_name}</p>
          <p class="code">${emp.employee_code}</p>
          <div class="info">
            <div><span>Department:</span> ${deptName}</div>
            <div><span>Designation:</span> ${desigName}</div>
            <div><span>Joined:</span> ${emp.joining_date}</div>
          </div>
        </div>
        <div class="qr"><img src="${qrUrl}" /><p>Scan to verify</p></div>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Employee ID Cards</h1><p className="text-muted-foreground">Generate and print employee ID cards with QR verification</p></div>

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
              <div className="w-[340px] rounded-xl overflow-hidden border shadow-lg">
                <div className="bg-primary text-primary-foreground p-4 text-center">
                  <h3 className="font-bold text-lg">{companyName}</h3>
                  <p className="text-xs opacity-80">Employee Identity Card</p>
                </div>
                <div className="p-5 text-center bg-card">
                  <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-muted-foreground border-[3px] border-primary">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <p className="text-lg font-bold text-foreground">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs text-muted-foreground mb-3">{emp.employee_code}</p>
                  <div className="text-left text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium">{deptName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Designation</span><span className="font-medium">{desigName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span className="font-medium">{emp.joining_date}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={emp.status === "active" ? "default" : "secondary"} className="capitalize">{emp.status}</Badge></div>
                  </div>
                </div>
                <div className="border-t p-3 text-center bg-card">
                  <img src={qrUrl} alt="QR Code" className="w-24 h-24 mx-auto" />
                  <p className="text-[10px] text-muted-foreground mt-1">Scan to verify employee</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
