import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Briefcase, Calendar, Mail, Phone, MapPin, Hash, QrCode } from "lucide-react";

export default function MyProfilePage() {
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  const [employee, setEmployee] = useState<any>(null);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [branch, setBranch] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: emp } = await supabase.from("employees" as any).select("*").eq("user_id", user.id).single();
      if (!emp) return;
      setEmployee(emp);
      const [dRes, dsRes, bRes] = await Promise.all([
        (emp as any).department_id ? supabase.from("departments" as any).select("name").eq("id", (emp as any).department_id).single() : Promise.resolve({ data: null }),
        (emp as any).designation_id ? supabase.from("designations" as any).select("name").eq("id", (emp as any).designation_id).single() : Promise.resolve({ data: null }),
        (emp as any).branch_id ? supabase.from("branches").select("name").eq("id", (emp as any).branch_id).single() : Promise.resolve({ data: null }),
      ]);
      if (dRes.data) setDepartment((dRes.data as any).name);
      if (dsRes.data) setDesignation((dsRes.data as any).name);
      if (bRes.data) setBranch((bRes.data as any).name);
    })();
  }, [user]);

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
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl mx-auto">
      <div><h1 className="text-2xl font-bold text-foreground">My Profile</h1><p className="text-muted-foreground">{companyName}</p></div>

      <Card>
        <CardContent className="pt-8">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-8">
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

          {/* Info Grid */}
          <div className="space-y-0 divide-y">
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3.5">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-32 shrink-0 text-sm">{label}</span>
                <span className="font-medium text-foreground text-sm">{value}</span>
              </div>
            ))}
          </div>

          {/* QR Section */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground mb-3">Your Employee Verification QR Code</p>
            <img src={qrUrl} alt="QR Code" className="w-20 h-20 mx-auto" />
            <p className="text-[10px] text-muted-foreground mt-2">Scan to verify your employment status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
