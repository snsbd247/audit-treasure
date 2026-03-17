import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Edit, Plus, Trash2, Save, User, DollarSign, Landmark, GraduationCap, Briefcase, Phone } from "lucide-react";

interface SalaryStructure {
  id: string;
  employee_id: string;
  basic_salary: number;
  house_rent: number;
  medical_allowance: number;
  other_allowance: number;
  total_salary: number;
  effective_from: string;
}

interface BankInfo {
  id: string;
  employee_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_name: string;
  routing_number: string;
}

interface Education {
  id: string;
  employee_id: string;
  degree: string;
  institution: string;
  passing_year: string;
  result: string;
}

interface Experience {
  id: string;
  employee_id: string;
  company_name: string;
  designation: string;
  start_date: string | null;
  end_date: string | null;
  job_description: string;
}

interface EmergencyContact {
  id: string;
  employee_id: string;
  name: string;
  relation: string;
  phone: string;
  address: string;
}

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  address: string | null;
  national_id: string | null;
  photo_url: string | null;
  department_id: string | null;
  designation_id: string | null;
  branch_id: string | null;
  joining_date: string;
  employment_type: string;
  status: string;
  salary: number;
}

const defaultSalary: Omit<SalaryStructure, 'id' | 'employee_id'> = {
  basic_salary: 0, house_rent: 0, medical_allowance: 0, other_allowance: 0, total_salary: 0,
  effective_from: new Date().toISOString().split("T")[0],
};

const defaultBank: Omit<BankInfo, 'id' | 'employee_id'> = {
  bank_name: "", account_name: "", account_number: "", branch_name: "", routing_number: "",
};

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { fc } = useCurrency();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [designations, setDesignations] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  // Sub-entity states
  const [salary, setSalary] = useState<SalaryStructure | null>(null);
  const [salaryForm, setSalaryForm] = useState(defaultSalary);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [bankForm, setBankForm] = useState(defaultBank);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  // Dialog states
  const [eduDialog, setEduDialog] = useState(false);
  const [eduEditId, setEduEditId] = useState<string | null>(null);
  const [eduForm, setEduForm] = useState({ degree: "", institution: "", passing_year: "", result: "" });

  const [expDialog, setExpDialog] = useState(false);
  const [expEditId, setExpEditId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState({ company_name: "", designation: "", start_date: "", end_date: "", job_description: "" });

  const [ecDialog, setEcDialog] = useState(false);
  const [ecEditId, setEcEditId] = useState<string | null>(null);
  const [ecForm, setEcForm] = useState({ name: "", relation: "", phone: "", address: "" });

  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    const [empRes, salRes, bankRes, eduRes, expRes, ecRes, deptRes, desigRes, branchRes] = await Promise.all([
      supabase.from("employees" as any).select("*").eq("id", id).single(),
      supabase.from("salary_structures" as any).select("*").eq("employee_id", id).order("effective_from", { ascending: false }).limit(1),
      supabase.from("employee_bank_info" as any).select("*").eq("employee_id", id).single(),
      supabase.from("employee_education" as any).select("*").eq("employee_id", id).order("passing_year", { ascending: false }),
      supabase.from("employee_experience" as any).select("*").eq("employee_id", id).order("start_date", { ascending: false }),
      supabase.from("employee_emergency_contacts" as any).select("*").eq("employee_id", id),
      supabase.from("departments" as any).select("id, name").eq("status", "active"),
      supabase.from("designations" as any).select("id, name").eq("status", "active"),
      supabase.from("branches").select("id, name").eq("status", "active"),
    ]);

    if (empRes.data) setEmployee(empRes.data as any);
    if (salRes.data && (salRes.data as any).length > 0) {
      const s = (salRes.data as any)[0];
      setSalary(s);
      setSalaryForm({ basic_salary: s.basic_salary, house_rent: s.house_rent, medical_allowance: s.medical_allowance, other_allowance: s.other_allowance, total_salary: s.total_salary, effective_from: s.effective_from });
    }
    if (bankRes.data) {
      const b = bankRes.data as any;
      setBankInfo(b);
      setBankForm({ bank_name: b.bank_name, account_name: b.account_name, account_number: b.account_number, branch_name: b.branch_name, routing_number: b.routing_number });
    }
    if (eduRes.data) setEducation(eduRes.data as any);
    if (expRes.data) setExperience(expRes.data as any);
    if (ecRes.data) setEmergencyContacts(ecRes.data as any);
    if (deptRes.data) setDepartments(deptRes.data as any);
    if (desigRes.data) setDesignations(desigRes.data as any);
    if (branchRes.data) setBranches(branchRes.data as any);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-calculate total salary
  useEffect(() => {
    const total = Number(salaryForm.basic_salary) + Number(salaryForm.house_rent) + Number(salaryForm.medical_allowance) + Number(salaryForm.other_allowance);
    setSalaryForm(prev => ({ ...prev, total_salary: total }));
  }, [salaryForm.basic_salary, salaryForm.house_rent, salaryForm.medical_allowance, salaryForm.other_allowance]);

  const getDeptName = (dId: string | null) => departments.find(d => d.id === dId)?.name || "-";
  const getDesigName = (dId: string | null) => designations.find(d => d.id === dId)?.name || "-";
  const getBranchName = (bId: string | null) => branches.find(b => b.id === bId)?.name || "-";

  // Save salary
  const saveSalary = async () => {
    if (!id) return;
    setSaving(true);
    const payload: any = { ...salaryForm, employee_id: id, updated_at: new Date().toISOString() };
    if (salary) {
      const { error } = await supabase.from("salary_structures" as any).update(payload).eq("id", salary.id);
      if (error) toast.error(error.message); else { toast.success("Salary updated"); fetchAll(); }
    } else {
      const { error } = await supabase.from("salary_structures" as any).insert(payload);
      if (error) toast.error(error.message); else { toast.success("Salary saved"); fetchAll(); }
    }
    setSaving(false);
  };

  // Save bank info
  const saveBank = async () => {
    if (!id) return;
    setSaving(true);
    const payload: any = { ...bankForm, employee_id: id, updated_at: new Date().toISOString() };
    if (bankInfo) {
      const { error } = await supabase.from("employee_bank_info" as any).update(payload).eq("id", bankInfo.id);
      if (error) toast.error(error.message); else { toast.success("Bank info updated"); fetchAll(); }
    } else {
      const { error } = await supabase.from("employee_bank_info" as any).insert(payload);
      if (error) toast.error(error.message); else { toast.success("Bank info saved"); fetchAll(); }
    }
    setSaving(false);
  };

  // Education CRUD
  const openAddEdu = () => { setEduEditId(null); setEduForm({ degree: "", institution: "", passing_year: "", result: "" }); setEduDialog(true); };
  const openEditEdu = (e: Education) => { setEduEditId(e.id); setEduForm({ degree: e.degree, institution: e.institution, passing_year: e.passing_year, result: e.result }); setEduDialog(true); };
  const saveEdu = async () => {
    if (!id) return;
    setSaving(true);
    const payload: any = { ...eduForm, employee_id: id };
    if (eduEditId) {
      const { error } = await supabase.from("employee_education" as any).update(payload).eq("id", eduEditId);
      if (error) toast.error(error.message); else { toast.success("Education updated"); setEduDialog(false); fetchAll(); }
    } else {
      const { error } = await supabase.from("employee_education" as any).insert(payload);
      if (error) toast.error(error.message); else { toast.success("Education added"); setEduDialog(false); fetchAll(); }
    }
    setSaving(false);
  };
  const deleteEdu = async (eduId: string) => {
    if (!confirm("Delete this education record?")) return;
    const { error } = await supabase.from("employee_education" as any).delete().eq("id", eduId);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchAll(); }
  };

  // Experience CRUD
  const openAddExp = () => { setExpEditId(null); setExpForm({ company_name: "", designation: "", start_date: "", end_date: "", job_description: "" }); setExpDialog(true); };
  const openEditExp = (e: Experience) => { setExpEditId(e.id); setExpForm({ company_name: e.company_name, designation: e.designation, start_date: e.start_date || "", end_date: e.end_date || "", job_description: e.job_description }); setExpDialog(true); };
  const saveExp = async () => {
    if (!id) return;
    setSaving(true);
    const payload: any = { ...expForm, employee_id: id, start_date: expForm.start_date || null, end_date: expForm.end_date || null };
    if (expEditId) {
      const { error } = await supabase.from("employee_experience" as any).update(payload).eq("id", expEditId);
      if (error) toast.error(error.message); else { toast.success("Experience updated"); setExpDialog(false); fetchAll(); }
    } else {
      const { error } = await supabase.from("employee_experience" as any).insert(payload);
      if (error) toast.error(error.message); else { toast.success("Experience added"); setExpDialog(false); fetchAll(); }
    }
    setSaving(false);
  };
  const deleteExp = async (expId: string) => {
    if (!confirm("Delete this experience record?")) return;
    const { error } = await supabase.from("employee_experience" as any).delete().eq("id", expId);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchAll(); }
  };

  // Emergency Contact CRUD
  const openAddEc = () => { setEcEditId(null); setEcForm({ name: "", relation: "", phone: "", address: "" }); setEcDialog(true); };
  const openEditEc = (e: EmergencyContact) => { setEcEditId(e.id); setEcForm({ name: e.name, relation: e.relation, phone: e.phone, address: e.address }); setEcDialog(true); };
  const saveEc = async () => {
    if (!id) return;
    setSaving(true);
    const payload: any = { ...ecForm, employee_id: id };
    if (ecEditId) {
      const { error } = await supabase.from("employee_emergency_contacts" as any).update(payload).eq("id", ecEditId);
      if (error) toast.error(error.message); else { toast.success("Contact updated"); setEcDialog(false); fetchAll(); }
    } else {
      const { error } = await supabase.from("employee_emergency_contacts" as any).insert(payload);
      if (error) toast.error(error.message); else { toast.success("Contact added"); setEcDialog(false); fetchAll(); }
    }
    setSaving(false);
  };
  const deleteEc = async (ecId: string) => {
    if (!confirm("Delete this emergency contact?")) return;
    const { error } = await supabase.from("employee_emergency_contacts" as any).delete().eq("id", ecId);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchAll(); }
  };

  if (!employee) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading employee profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/hrm/employees")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{employee.first_name} {employee.last_name}</h1>
          <p className="text-muted-foreground">{employee.employee_code} · {getDesigName(employee.designation_id)} · {getDeptName(employee.department_id)}</p>
        </div>
        <Badge variant={employee.status === "active" ? "default" : "secondary"} className="capitalize">{employee.status}</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm"><User className="w-3.5 h-3.5" /><span className="hidden sm:inline">Profile</span></TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center gap-1.5 text-xs sm:text-sm"><DollarSign className="w-3.5 h-3.5" /><span className="hidden sm:inline">Salary</span></TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-1.5 text-xs sm:text-sm"><Landmark className="w-3.5 h-3.5" /><span className="hidden sm:inline">Bank</span></TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-1.5 text-xs sm:text-sm"><GraduationCap className="w-3.5 h-3.5" /><span className="hidden sm:inline">Education</span></TabsTrigger>
          <TabsTrigger value="experience" className="flex items-center gap-1.5 text-xs sm:text-sm"><Briefcase className="w-3.5 h-3.5" /><span className="hidden sm:inline">Experience</span></TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-1.5 text-xs sm:text-sm"><Phone className="w-3.5 h-3.5" /><span className="hidden sm:inline">Emergency</span></TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>Basic employee details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoField label="Employee Code" value={employee.employee_code} />
                <InfoField label="First Name" value={employee.first_name} />
                <InfoField label="Last Name" value={employee.last_name} />
                <InfoField label="Email" value={employee.email || "-"} />
                <InfoField label="Mobile" value={employee.mobile || "-"} />
                <InfoField label="National ID" value={employee.national_id || "-"} />
                <InfoField label="Department" value={getDeptName(employee.department_id)} />
                <InfoField label="Designation" value={getDesigName(employee.designation_id)} />
                <InfoField label="Branch" value={getBranchName(employee.branch_id)} />
                <InfoField label="Joining Date" value={employee.joining_date} />
                <InfoField label="Employment Type" value={employee.employment_type} />
                <InfoField label="Status" value={employee.status} />
                <div className="md:col-span-2 lg:col-span-3">
                  <InfoField label="Address" value={employee.address || "-"} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Salary Structure</CardTitle>
              <CardDescription>total_salary = basic_salary + house_rent + medical_allowance + other_allowance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Basic Salary</Label>
                  <Input type="number" value={salaryForm.basic_salary} onChange={e => setSalaryForm({ ...salaryForm, basic_salary: Number(e.target.value) })} disabled={!isAdmin} />
                </div>
                <div>
                  <Label>House Rent</Label>
                  <Input type="number" value={salaryForm.house_rent} onChange={e => setSalaryForm({ ...salaryForm, house_rent: Number(e.target.value) })} disabled={!isAdmin} />
                </div>
                <div>
                  <Label>Medical Allowance</Label>
                  <Input type="number" value={salaryForm.medical_allowance} onChange={e => setSalaryForm({ ...salaryForm, medical_allowance: Number(e.target.value) })} disabled={!isAdmin} />
                </div>
                <div>
                  <Label>Other Allowance</Label>
                  <Input type="number" value={salaryForm.other_allowance} onChange={e => setSalaryForm({ ...salaryForm, other_allowance: Number(e.target.value) })} disabled={!isAdmin} />
                </div>
                <div>
                  <Label>Effective From</Label>
                  <Input type="date" value={salaryForm.effective_from} onChange={e => setSalaryForm({ ...salaryForm, effective_from: e.target.value })} disabled={!isAdmin} />
                </div>
                <div>
                  <Label>Total Salary</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted text-foreground font-semibold">
                    {formatCurrency(salaryForm.total_salary)}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <Button onClick={saveSalary} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Salary"}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Info Tab */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bank Information</CardTitle>
              <CardDescription>Employee bank account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Bank Name</Label><Input value={bankForm.bank_name} onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })} disabled={!isAdmin} /></div>
                <div><Label>Account Name</Label><Input value={bankForm.account_name} onChange={e => setBankForm({ ...bankForm, account_name: e.target.value })} disabled={!isAdmin} /></div>
                <div><Label>Account Number</Label><Input value={bankForm.account_number} onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })} disabled={!isAdmin} /></div>
                <div><Label>Branch Name</Label><Input value={bankForm.branch_name} onChange={e => setBankForm({ ...bankForm, branch_name: e.target.value })} disabled={!isAdmin} /></div>
                <div><Label>Routing Number</Label><Input value={bankForm.routing_number} onChange={e => setBankForm({ ...bankForm, routing_number: e.target.value })} disabled={!isAdmin} /></div>
              </div>
              {isAdmin && (
                <Button onClick={saveBank} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Bank Info"}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Education</CardTitle>
                <CardDescription>Academic qualifications</CardDescription>
              </div>
              {isAdmin && <Button size="sm" onClick={openAddEdu}><Plus className="w-4 h-4 mr-1" />Add</Button>}
            </CardHeader>
            <CardContent>
              {education.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No education records</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Degree</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Result</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {education.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.degree}</TableCell>
                        <TableCell>{e.institution}</TableCell>
                        <TableCell>{e.passing_year}</TableCell>
                        <TableCell>{e.result}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditEdu(e)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteEdu(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Work Experience</CardTitle>
                <CardDescription>Previous employment history</CardDescription>
              </div>
              {isAdmin && <Button size="sm" onClick={openAddExp}><Plus className="w-4 h-4 mr-1" />Add</Button>}
            </CardHeader>
            <CardContent>
              {experience.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No experience records</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Description</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experience.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.company_name}</TableCell>
                        <TableCell>{e.designation}</TableCell>
                        <TableCell>{e.start_date || "-"}</TableCell>
                        <TableCell>{e.end_date || "Present"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{e.job_description || "-"}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditExp(e)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteExp(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contact Tab */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Emergency Contacts</CardTitle>
                <CardDescription>Emergency contact information</CardDescription>
              </div>
              {isAdmin && <Button size="sm" onClick={openAddEc}><Plus className="w-4 h-4 mr-1" />Add</Button>}
            </CardHeader>
            <CardContent>
              {emergencyContacts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No emergency contacts</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Relation</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencyContacts.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.relation}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{c.address || "-"}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditEc(c)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteEc(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Education Dialog */}
      <Dialog open={eduDialog} onOpenChange={setEduDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{eduEditId ? "Edit Education" : "Add Education"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Degree *</Label><Input value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} /></div>
            <div><Label>Institution *</Label><Input value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} /></div>
            <div><Label>Passing Year</Label><Input value={eduForm.passing_year} onChange={e => setEduForm({ ...eduForm, passing_year: e.target.value })} placeholder="e.g. 2020" /></div>
            <div><Label>Result</Label><Input value={eduForm.result} onChange={e => setEduForm({ ...eduForm, result: e.target.value })} placeholder="e.g. 3.80 GPA" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEduDialog(false)}>Cancel</Button>
            <Button onClick={saveEdu} disabled={saving || !eduForm.degree}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experience Dialog */}
      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{expEditId ? "Edit Experience" : "Add Experience"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Company Name *</Label><Input value={expForm.company_name} onChange={e => setExpForm({ ...expForm, company_name: e.target.value })} /></div>
            <div><Label>Designation *</Label><Input value={expForm.designation} onChange={e => setExpForm({ ...expForm, designation: e.target.value })} /></div>
            <div><Label>Start Date</Label><Input type="date" value={expForm.start_date} onChange={e => setExpForm({ ...expForm, start_date: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={expForm.end_date} onChange={e => setExpForm({ ...expForm, end_date: e.target.value })} /></div>
            <div className="col-span-2"><Label>Job Description</Label><Textarea value={expForm.job_description} onChange={e => setExpForm({ ...expForm, job_description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialog(false)}>Cancel</Button>
            <Button onClick={saveExp} disabled={saving || !expForm.company_name}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Contact Dialog */}
      <Dialog open={ecDialog} onOpenChange={setEcDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{ecEditId ? "Edit Emergency Contact" : "Add Emergency Contact"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Name *</Label><Input value={ecForm.name} onChange={e => setEcForm({ ...ecForm, name: e.target.value })} /></div>
            <div><Label>Relation *</Label><Input value={ecForm.relation} onChange={e => setEcForm({ ...ecForm, relation: e.target.value })} /></div>
            <div><Label>Phone *</Label><Input value={ecForm.phone} onChange={e => setEcForm({ ...ecForm, phone: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={ecForm.address} onChange={e => setEcForm({ ...ecForm, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEcDialog(false)}>Cancel</Button>
            <Button onClick={saveEc} disabled={saving || !ecForm.name || !ecForm.phone}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-foreground mt-1 capitalize">{value}</p>
    </div>
  );
}
