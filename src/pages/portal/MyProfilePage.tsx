import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePortalEmployee } from "@/hooks/usePortalEmployee";
import { PortalEmployeeSelector } from "@/components/portal/PortalEmployeeSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Building2, Briefcase, Calendar, Mail, Phone, MapPin, Hash, QrCode,
  DollarSign, Landmark, AlertTriangle,
} from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export default function MyProfilePage() {
  const { settings } = useCompanySettings();
  const { fc } = useCurrency();
  const { employee, loading, isHrAdmin, allEmployees, selectedEmployeeId, selectEmployee } = usePortalEmployee();
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [branch, setBranch] = useState("");
  const [salaryStructure, setSalaryStructure] = useState<any>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const [dRes, dsRes, bRes, salRes, bankRes, ecRes] = await Promise.all([
        employee.department_id ? supabase.from("departments").select("name").eq("id", employee.department_id).single() : Promise.resolve({ data: null }),
        employee.designation_id ? supabase.from("designations").select("name").eq("id", employee.designation_id).single() : Promise.resolve({ data: null }),
        employee.branch_id ? supabase.from("branches").select("name").eq("id", employee.branch_id).single() : Promise.resolve({ data: null }),
        supabase.from("salary_structures").select("*").eq("employee_id", employee.id).order("effective_from", { ascending: false }).limit(1),
        supabase.from("employee_bank_info").select("*").eq("employee_id", employee.id).maybeSingle(),
        supabase.from("employee_emergency_contacts").select("*").eq("employee_id", employee.id),
      ]);
      if (dRes.data) setDepartment((dRes.data as any).name); else setDepartment("");
      if (dsRes.data) setDesignation((dsRes.data as any).name); else setDesignation("");
      if (bRes.data) setBranch((bRes.data as any).name); else setBranch("");
      setSalaryStructure(salRes.data?.[0] || null);
      setBankInfo(bankRes.data || null);
      setEmergencyContacts((ecRes.data || []) as any[]);
    })();
  }, [employee]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;

  if (!employee) return (
    <div className="text-center py-16 text-muted-foreground">
      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No employee profile linked to your account.</p>
      <p className="text-sm mt-1">Contact your administrator to link your employee record.</p>
    </div>
  );

  const companyName = settings?.company_name || "Company";
  const verifyUrl = `${window.location.origin}/employee/verify/${employee.employee_code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`;

  const infoRows = [
    { icon: Hash, label: "Employee Code", value: employee.employee_code },
    { icon: Building2, label: "Department", value: department || "-" },
    { icon: Briefcase, label: "Designation", value: designation || "-" },
    { icon: Building2, label: "Branch", value: branch || "-" },
    { icon: Calendar, label: "Joining Date", value: employee.joining_date },
    { icon: Mail, label: "Email", value: employee.email || "-" },
    { icon: Phone, label: "Mobile", value: employee.mobile || "-" },
    { icon: MapPin, label: "Address", value: employee.address || "-" },
  ];

  return (
    <div className="space-y-0">
      {isHrAdmin && (
        <PortalEmployeeSelector employees={allEmployees} selectedId={selectedEmployeeId} onSelect={selectEmployee} />
      )}
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        <div><h1 className="text-2xl font-bold text-foreground">My Profile</h1><p className="text-muted-foreground">{companyName}</p></div>

        {/* Photo & Name Card */}
        <Card>
          <CardContent className="pt-8">
            <div className="flex flex-col items-center mb-6">
              {employee.photo_url ? (
                <img src={employee.photo_url} alt="Photo" className="w-24 h-24 rounded-full object-cover mb-4 border-[3px] border-primary shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 mb-4 flex items-center justify-center text-3xl font-bold text-primary border-[3px] border-primary/30">
                  {employee.first_name[0]}{employee.last_name[0]}
                </div>
              )}
              <h2 className="text-xl font-bold text-foreground">{employee.first_name} {employee.last_name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{employee.employee_code}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={employee.status === "active" ? "default" : "secondary"} className="capitalize">{employee.status}</Badge>
                <Badge variant="outline" className="capitalize">{employee.employment_type}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Sections */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-0 divide-y">
                  {infoRows.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 py-3.5">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-32 shrink-0 text-sm">{label}</span>
                      <span className="font-medium text-foreground text-sm">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t text-center">
                  <p className="text-xs text-muted-foreground mb-3">Employee Verification QR Code</p>
                  <img src={qrUrl} alt="QR Code" className="w-20 h-20 mx-auto" />
                  <p className="text-[10px] text-muted-foreground mt-2">Scan to verify employment status</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DollarSign className="w-4 h-4" />Salary Structure</CardTitle></CardHeader>
              <CardContent>
                {salaryStructure ? (
                  <div className="space-y-0 divide-y">
                    {[
                      { label: "Basic Salary", value: fc(salaryStructure.basic_salary) },
                      { label: "House Rent", value: fc(salaryStructure.house_rent) },
                      { label: "Medical Allowance", value: fc(salaryStructure.medical_allowance) },
                      { label: "Other Allowance", value: fc(salaryStructure.other_allowance) },
                      { label: "Total Salary", value: fc(salaryStructure.total_salary), bold: true },
                      { label: "Effective From", value: salaryStructure.effective_from },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between py-3">
                        <span className="text-muted-foreground text-sm">{row.label}</span>
                        <span className={`text-sm ${row.bold ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-8 text-center">No salary structure found. Contact HR.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Landmark className="w-4 h-4" />Bank Details</CardTitle></CardHeader>
              <CardContent>
                {bankInfo ? (
                  <div className="space-y-0 divide-y">
                    {[
                      { label: "Bank Name", value: bankInfo.bank_name },
                      { label: "Branch Name", value: bankInfo.branch_name },
                      { label: "Account Name", value: bankInfo.account_name },
                      { label: "Account Number", value: bankInfo.account_number },
                      { label: "Routing Number", value: bankInfo.routing_number },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between py-3">
                        <span className="text-muted-foreground text-sm">{row.label}</span>
                        <span className="font-medium text-foreground text-sm">{row.value || "-"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-8 text-center">No bank details found. Contact HR.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="w-4 h-4" />Emergency Contacts</CardTitle></CardHeader>
              <CardContent>
                {emergencyContacts.length > 0 ? (
                  <div className="space-y-4">
                    {emergencyContacts.map((ec: any, idx: number) => (
                      <div key={ec.id} className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{ec.relation}</Badge>
                        </div>
                        <p className="font-medium text-foreground text-sm">{ec.name}</p>
                        <p className="text-muted-foreground text-xs">{ec.phone}</p>
                        {ec.address && <p className="text-muted-foreground text-xs mt-1">{ec.address}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-8 text-center">No emergency contacts found. Contact HR.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
