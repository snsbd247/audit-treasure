import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  const desigName = emp ? designations.find(d => d.id === emp.designation_id)?.name || "-" : "";
  const companyName = settings?.company_name || "Company";
  const companyAddress = settings?.address || "";
  const companyPhone = settings?.phone || "";
  const companyEmail = settings?.email || "";
  const companyWebsite = settings?.website || "";
  const companyLogo = settings?.company_logo_url || "";
  const verifyUrl = emp ? `${window.location.origin}/employee/verify/${emp.employee_code}` : "";
  const qrUrl = emp ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}` : "";
  const barcodeUrl = emp ? `https://barcodeapi.org/api/code128/${emp.employee_code}` : "";

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win || !emp) return;
    const photoHtml = emp.photo_url
      ? `<img src="${emp.photo_url}" class="photo" />`
      : `<div class="photo-placeholder">${emp.first_name[0]}${emp.last_name[0]}</div>`;
    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" class="logo" />`
      : `<div class="logo-placeholder">${companyName[0]}</div>`;

    win.document.write(`<html><head><title>ID Card - ${emp.employee_code}</title><style>
      @page { size: landscape; margin: 10mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; gap: 30px; flex-wrap: wrap; }
      .card-side { width: 340px; height: 540px; border: 2px solid #222; border-radius: 8px; overflow: hidden; background: #fff; position: relative; }

      /* ---- FRONT ---- */
      .front .header { background: #fff; padding: 16px 20px 10px; display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #e67e22; }
      .front .logo { height: 45px; object-fit: contain; }
      .front .logo-placeholder { width: 45px; height: 45px; background: #e67e22; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; border-radius: 6px; }
      .front .company-name { font-size: 18px; font-weight: 800; color: #1a1a1a; letter-spacing: 1px; }
      .front .photo-section { text-align: center; padding: 24px 0 12px; }
      .front .photo { width: 150px; height: 180px; object-fit: cover; border: 3px solid #333; display: block; margin: 0 auto; }
      .front .photo-placeholder { width: 150px; height: 180px; background: #e2e8f0; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #475569; border: 3px solid #333; font-weight: bold; }
      .front .emp-name { font-size: 20px; font-weight: 800; text-align: center; margin-top: 16px; color: #1a1a1a; }
      .front .emp-desig { font-size: 13px; text-align: center; color: #555; margin-top: 2px; }
      .front .barcode-section { text-align: center; margin-top: 18px; }
      .front .barcode-section img { height: 50px; }
      .front .barcode-section p { font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-top: 2px; color: #333; }

      /* ---- BACK ---- */
      .back { display: flex; flex-direction: row; }
      .back-content { flex: 1; padding: 20px 16px; display: flex; flex-direction: column; justify-content: space-between; }
      .back-content .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 3px; margin-bottom: 8px; margin-top: 16px; color: #1a1a1a; }
      .back-content .section-title:first-child { margin-top: 0; }
      .back-content .info-text { font-size: 11px; line-height: 1.6; color: #333; text-align: center; }
      .back .qr-section { text-align: center; margin-top: auto; padding-top: 14px; }
      .back .qr-section img { width: 110px; height: 110px; }
      .back .sidebar { width: 48px; background: #e67e22; display: flex; align-items: center; justify-content: center; writing-mode: vertical-rl; text-orientation: mixed; }
      .back .sidebar span { color: #fff; font-size: 16px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; transform: rotate(180deg); }

      @media print {
        body { background: #fff; }
        .card-side { border: 2px solid #222; page-break-inside: avoid; }
      }
    </style></head><body>
      <div class="card-side front">
        <div class="header">
          ${logoHtml}
          <span class="company-name">${companyName}</span>
        </div>
        <div class="photo-section">${photoHtml}</div>
        <p class="emp-name">${emp.first_name} ${emp.last_name}</p>
        <p class="emp-desig">${desigName}</p>
        <div class="barcode-section">
          <img src="${barcodeUrl}" alt="Barcode" />
          <p>${emp.employee_code}</p>
        </div>
      </div>

      <div class="card-side back">
        <div class="back-content">
          <div>
            <div class="section-title">Address</div>
            <p class="info-text">${companyAddress || "Company Address"}</p>

            <div class="section-title">Contact</div>
            <p class="info-text">
              ${companyPhone ? "Phone: " + companyPhone + "<br/>" : ""}
              ${companyEmail ? "Email: " + companyEmail + "<br/>" : ""}
              ${companyWebsite ? companyWebsite : ""}
            </p>
          </div>
          <div class="qr-section">
            <img src="${qrUrl}" alt="QR Code" />
            <p style="font-size:9px;color:#666;margin-top:4px;">Scan to verify employee</p>
          </div>
        </div>
        <div class="sidebar"><span>${companyWebsite || companyName}</span></div>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 800);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee ID Cards</h1>
        <p className="text-muted-foreground">Generate and print professional employee ID cards with QR & barcode</p>
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
            <div className="flex flex-wrap justify-center gap-8">
              {/* ===== FRONT SIDE ===== */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground text-center mb-2 uppercase tracking-wider">Front Side</p>
                <div className="w-[340px] h-[540px] rounded-lg border-2 border-border overflow-hidden bg-card shadow-lg relative">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b-[3px] border-orange-500">
                    {companyLogo ? (
                      <img src={companyLogo} alt="Logo" className="h-11 object-contain" />
                    ) : (
                      <div className="w-11 h-11 rounded-md bg-orange-500 text-white flex items-center justify-center text-xl font-bold">{companyName[0]}</div>
                    )}
                    <span className="text-lg font-extrabold text-foreground tracking-wide">{companyName}</span>
                  </div>
                  {/* Photo */}
                  <div className="flex justify-center pt-6">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt="Photo" className="w-[150px] h-[180px] object-cover border-[3px] border-foreground/80" />
                    ) : (
                      <div className="w-[150px] h-[180px] bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground border-[3px] border-foreground/80">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                    )}
                  </div>
                  {/* Name & Designation */}
                  <p className="text-xl font-extrabold text-foreground text-center mt-4">{emp.first_name} {emp.last_name}</p>
                  <p className="text-sm text-muted-foreground text-center">{desigName}</p>
                  {/* Barcode */}
                  <div className="text-center mt-5">
                    <img src={barcodeUrl} alt="Barcode" className="h-[50px] mx-auto" />
                    <p className="text-sm font-semibold tracking-[3px] text-foreground mt-1">{emp.employee_code}</p>
                  </div>
                </div>
              </div>

              {/* ===== BACK SIDE ===== */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground text-center mb-2 uppercase tracking-wider">Back Side</p>
                <div className="w-[340px] h-[540px] rounded-lg border-2 border-border overflow-hidden bg-card shadow-lg flex flex-row">
                  {/* Content area */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase border-b-2 border-foreground pb-1 mb-2 text-foreground">Address</h4>
                      <p className="text-[11px] leading-relaxed text-muted-foreground text-center">{companyAddress || "Company Address"}</p>

                      <h4 className="text-xs font-extrabold uppercase border-b-2 border-foreground pb-1 mb-2 mt-5 text-foreground">Contact</h4>
                      <div className="text-[11px] leading-relaxed text-muted-foreground text-center space-y-0.5">
                        {companyPhone && <p>Phone: {companyPhone}</p>}
                        {companyEmail && <p>Email: {companyEmail}</p>}
                        {companyWebsite && <p>{companyWebsite}</p>}
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <img src={qrUrl} alt="QR Code" className="w-[110px] h-[110px] mx-auto" />
                      <p className="text-[9px] text-muted-foreground mt-1">Scan to verify employee</p>
                    </div>
                  </div>
                  {/* Orange sidebar */}
                  <div className="w-12 bg-orange-500 flex items-center justify-center">
                    <span className="text-white font-extrabold text-base tracking-[3px] uppercase" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                      {companyWebsite || companyName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
