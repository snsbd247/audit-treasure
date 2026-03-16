import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Briefcase, Calendar, Mail, Phone, MapPin } from "lucide-react";

export default function MyProfilePage() {
  const { user } = useAuth();
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
      <p className="text-sm mt-1">Contact your administrator.</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div><h1 className="text-2xl font-bold text-foreground">My Profile</h1></div>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-primary">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
            <h2 className="text-xl font-bold text-foreground">{employee.first_name} {employee.last_name}</h2>
            <p className="text-sm text-muted-foreground">{employee.employee_code}</p>
            <Badge variant={employee.status === "active" ? "default" : "secondary"} className="mt-2 capitalize">{employee.status}</Badge>
          </div>
          <div className="space-y-4 divide-y">
            <div className="flex items-center gap-3 pt-3"><Building2 className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground w-28">Department</span><span className="font-medium">{department || "-"}</span></div>
            <div className="flex items-center gap-3 pt-3"><Briefcase className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground w-28">Designation</span><span className="font-medium">{designation || "-"}</span></div>
            <div className="flex items-center gap-3 pt-3"><Building2 className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground w-28">Branch</span><span className="font-medium">{branch || "-"}</span></div>
            <div className="flex items-center gap-3 pt-3"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground w-28">Joined</span><span className="font-medium">{employee.joining_date}</span></div>
            <div className="flex items-center gap-3 pt-3"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground w-28">Email</span><span className="font-medium">{employee.email || "-"}</span></div>
            <div className="flex items-center gap-3 pt-3"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground w-28">Mobile</span><span className="font-medium">{employee.mobile || "-"}</span></div>
            <div className="flex items-center gap-3 pt-3"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground w-28">Address</span><span className="font-medium">{employee.address || "-"}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
