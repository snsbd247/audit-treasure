import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PiggyBank, Plus, Settings, History, Users, TrendingUp } from "lucide-react";

interface Employee {
  id: string; employee_code: string; first_name: string; last_name: string; salary: number;
}

interface FundSetting {
  id: string; employee_id: string; fund_type: string; is_active: boolean;
  calculation_type: string; employee_rate: number; employer_rate: number;
  effective_from: string;
}

interface FundTransaction {
  id: string; employee_id: string; fund_type: string; transaction_type: string;
  employee_amount: number; employer_amount: number; total_amount: number;
  month: number | null; year: number | null; notes: string | null; created_at: string;
}

const FUND_LABELS: Record<string, string> = {
  provident_fund: "Provident Fund (PF)",
  savings_fund: "Savings Fund",
};

export default function FundsPage() {
  const { hasPermission, user } = useAuth();
  const isAdmin = hasPermission("hrm", "can_edit");
  const { fc } = useCurrency();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<FundSetting[]>([]);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [tab, setTab] = useState("settings");

  // Dialog state
  const [settingDialog, setSettingDialog] = useState(false);
  const [form, setForm] = useState({
    employee_id: "", fund_type: "provident_fund", calculation_type: "percentage",
    employee_rate: 0, employer_rate: 0, effective_from: new Date().toISOString().split("T")[0],
  });
  const [editId, setEditId] = useState<string | null>(null);

  // Transaction dialog
  const [txDialog, setTxDialog] = useState(false);
  const [txForm, setTxForm] = useState({
    employee_id: "", fund_type: "provident_fund", transaction_type: "contribution",
    employee_amount: 0, employer_amount: 0, notes: "",
  });

  // Filter
  const [filterFundType, setFilterFundType] = useState<string>("all");

  const fetchData = useCallback(async () => {
    const [empRes, setRes, txRes] = await Promise.all([
      supabase.from("employees" as any).select("id, employee_code, first_name, last_name, salary").eq("status", "active"),
      supabase.from("employee_fund_settings" as any).select("*").order("created_at"),
      supabase.from("fund_transactions" as any).select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (empRes.data) setEmployees(empRes.data as any);
    if (setRes.data) setSettings(setRes.data as any);
    if (txRes.data) setTransactions(txRes.data as any);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getEmpName = (id: string) => {
    const e = employees.find(e => e.id === id);
    return e ? `${e.first_name} ${e.last_name} (${e.employee_code})` : "-";
  };

  const getEmpSalary = (id: string) => employees.find(e => e.id === id)?.salary || 0;

  // Calculate balance per employee per fund
  const getBalance = (empId: string, fundType: string) => {
    return transactions
      .filter(t => t.employee_id === empId && t.fund_type === fundType)
      .reduce((sum, t) => {
        if (t.transaction_type === "withdrawal") return sum - t.total_amount;
        return sum + t.total_amount;
      }, 0);
  };

  // Save setting
  const saveSetting = async () => {
    if (!form.employee_id) { toast.error("Employee নির্বাচন করুন"); return; }

    const payload = {
      employee_id: form.employee_id,
      fund_type: form.fund_type,
      calculation_type: form.calculation_type,
      employee_rate: form.employee_rate,
      employer_rate: form.employer_rate,
      effective_from: form.effective_from,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error } = await supabase.from("employee_fund_settings" as any).update(payload as any).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Fund setting আপডেট হয়েছে");
    } else {
      const { error } = await supabase.from("employee_fund_settings" as any).insert(payload as any);
      if (error) {
        if (error.message.includes("unique")) toast.error("এই Employee এর জন্য এই Fund ইতোমধ্যে সেটাপ করা আছে");
        else toast.error(error.message);
        return;
      }
      toast.success("Fund setting যুক্ত হয়েছে");
    }

    setSettingDialog(false);
    setEditId(null);
    fetchData();
  };

  // Save manual transaction
  const saveTx = async () => {
    if (!txForm.employee_id) { toast.error("Employee নির্বাচন করুন"); return; }
    const total = Number(txForm.employee_amount) + Number(txForm.employer_amount);
    if (total <= 0) { toast.error("Amount দিন"); return; }

    const { error } = await supabase.from("fund_transactions" as any).insert({
      employee_id: txForm.employee_id,
      fund_type: txForm.fund_type,
      transaction_type: txForm.transaction_type,
      employee_amount: txForm.employee_amount,
      employer_amount: txForm.employer_amount,
      total_amount: total,
      notes: txForm.notes || null,
      created_by: user?.id,
    } as any);
    if (error) { toast.error(error.message); return; }

    toast.success("Transaction রেকর্ড হয়েছে");
    setTxDialog(false);
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("employee_fund_settings" as any).update({ is_active: !current } as any).eq("id", id);
    fetchData();
  };

  const openEdit = (s: FundSetting) => {
    setForm({
      employee_id: s.employee_id, fund_type: s.fund_type,
      calculation_type: s.calculation_type, employee_rate: s.employee_rate,
      employer_rate: s.employer_rate, effective_from: s.effective_from,
    });
    setEditId(s.id);
    setSettingDialog(true);
  };

  const filteredSettings = filterFundType === "all" ? settings : settings.filter(s => s.fund_type === filterFundType);

  // Summary cards
  const totalPfBalance = settings.filter(s => s.fund_type === "provident_fund" && s.is_active)
    .reduce((sum, s) => sum + getBalance(s.employee_id, "provident_fund"), 0);
  const totalSfBalance = settings.filter(s => s.fund_type === "savings_fund" && s.is_active)
    .reduce((sum, s) => sum + getBalance(s.employee_id, "savings_fund"), 0);
  const totalActiveMembers = settings.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Provident Fund & Savings Fund</h1>
          <p className="text-muted-foreground">Employee fund management ও contribution tracking</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setTxForm({ employee_id: "", fund_type: "provident_fund", transaction_type: "contribution", employee_amount: 0, employer_amount: 0, notes: "" }); setTxDialog(true); }}>
              <History className="h-4 w-4 mr-2" /> Manual Transaction
            </Button>
            <Button onClick={() => { setForm({ employee_id: "", fund_type: "provident_fund", calculation_type: "percentage", employee_rate: 0, employer_rate: 0, effective_from: new Date().toISOString().split("T")[0] }); setEditId(null); setSettingDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Fund Setup
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provident Fund Balance</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fc(totalPfBalance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Fund Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fc(totalSfBalance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalActiveMembers}</div></CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Fund Settings</TabsTrigger>
          <TabsTrigger value="transactions"><History className="h-4 w-4 mr-1" /> Transactions</TabsTrigger>
          <TabsTrigger value="balances"><PiggyBank className="h-4 w-4 mr-1" /> Balances</TabsTrigger>
        </TabsList>

        {/* ─── Settings Tab ──────────────────────────────────── */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Employee Fund Configuration</CardTitle>
                <Select value={filterFundType} onValueChange={setFilterFundType}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    <SelectItem value="provident_fund">Provident Fund</SelectItem>
                    <SelectItem value="savings_fund">Savings Fund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Fund Type</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead>Employee Rate</TableHead>
                    <TableHead>Employer Rate</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSettings.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">কোনো Fund Setup পাওয়া যায়নি</TableCell></TableRow>
                  ) : filteredSettings.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{getEmpName(s.employee_id)}</TableCell>
                      <TableCell><Badge variant={s.fund_type === "provident_fund" ? "default" : "secondary"}>{FUND_LABELS[s.fund_type]}</Badge></TableCell>
                      <TableCell>{s.calculation_type === "percentage" ? "%" : "Fixed"}</TableCell>
                      <TableCell>{s.calculation_type === "percentage" ? `${s.employee_rate}%` : fc(s.employee_rate)}</TableCell>
                      <TableCell>{s.calculation_type === "percentage" ? `${s.employer_rate}%` : fc(s.employer_rate)}</TableCell>
                      <TableCell>{s.effective_from}</TableCell>
                      <TableCell className="font-semibold">{fc(getBalance(s.employee_id, s.fund_type))}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s.id, s.is_active)} />
                        ) : (
                          <Badge variant={s.is_active ? "default" : "outline"}>{s.is_active ? "Active" : "Inactive"}</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>Edit</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Transactions Tab ──────────────────────────────── */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader><CardTitle>Fund Transactions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">কোনো Transaction নেই</TableCell></TableRow>
                  ) : transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{getEmpName(t.employee_id)}</TableCell>
                      <TableCell><Badge variant="outline">{FUND_LABELS[t.fund_type]}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={t.transaction_type === "withdrawal" ? "destructive" : t.transaction_type === "interest" ? "secondary" : "default"}>
                          {t.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{fc(t.employee_amount)}</TableCell>
                      <TableCell>{fc(t.employer_amount)}</TableCell>
                      <TableCell className="font-semibold">{fc(t.total_amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Balances Tab ──────────────────────────────────── */}
        <TabsContent value="balances">
          <Card>
            <CardHeader><CardTitle>Employee-wise Fund Balances</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>PF Balance</TableHead>
                    <TableHead>Savings Balance</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const empIds = [...new Set(settings.map(s => s.employee_id))];
                    if (empIds.length === 0) return (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">কোনো Fund Member নেই</TableCell></TableRow>
                    );
                    return empIds.map(empId => {
                      const pf = getBalance(empId, "provident_fund");
                      const sf = getBalance(empId, "savings_fund");
                      return (
                        <TableRow key={empId}>
                          <TableCell className="font-medium">{getEmpName(empId)}</TableCell>
                          <TableCell>{fc(pf)}</TableCell>
                          <TableCell>{fc(sf)}</TableCell>
                          <TableCell className="font-bold">{fc(pf + sf)}</TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Fund Setting Dialog ─────────────────────────────── */}
      <Dialog open={settingDialog} onOpenChange={setSettingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Fund Setting আপডেট" : "নতুন Fund Setup"}</DialogTitle>
            <DialogDescription>Employee এর জন্য Provident Fund / Savings Fund কনফিগার করুন</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Employee নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fund Type</Label>
              <Select value={form.fund_type} onValueChange={v => setForm(f => ({ ...f, fund_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="provident_fund">Provident Fund (PF)</SelectItem>
                  <SelectItem value="savings_fund">Savings Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Calculation Type</Label>
              <Select value={form.calculation_type} onValueChange={v => setForm(f => ({ ...f, calculation_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Basic Salary এর %</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee Rate {form.calculation_type === "percentage" ? "(%)" : "(৳)"}</Label>
                <Input type="number" value={form.employee_rate} onChange={e => setForm(f => ({ ...f, employee_rate: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Employer Rate {form.calculation_type === "percentage" ? "(%)" : "(৳)"}</Label>
                <Input type="number" value={form.employer_rate} onChange={e => setForm(f => ({ ...f, employer_rate: Number(e.target.value) }))} />
              </div>
            </div>
            {form.calculation_type === "percentage" && form.employee_id && (
              <div className="bg-muted rounded p-3 text-sm">
                <p>Basic Salary: {fc(getEmpSalary(form.employee_id))}</p>
                <p>Employee Monthly: {fc(getEmpSalary(form.employee_id) * form.employee_rate / 100)}</p>
                <p>Employer Monthly: {fc(getEmpSalary(form.employee_id) * form.employer_rate / 100)}</p>
                <p className="font-semibold">Total Monthly: {fc(getEmpSalary(form.employee_id) * (form.employee_rate + form.employer_rate) / 100)}</p>
              </div>
            )}
            <div>
              <Label>Effective From</Label>
              <Input type="date" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingDialog(false)}>Cancel</Button>
            <Button onClick={saveSetting}>{editId ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Transaction Dialog ──────────────────────────────── */}
      <Dialog open={txDialog} onOpenChange={setTxDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Fund Transaction</DialogTitle>
            <DialogDescription>ম্যানুয়াল contribution, withdrawal, বা adjustment রেকর্ড করুন</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Select value={txForm.employee_id} onValueChange={v => setTxForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Employee নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fund Type</Label>
                <Select value={txForm.fund_type} onValueChange={v => setTxForm(f => ({ ...f, fund_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="provident_fund">Provident Fund</SelectItem>
                    <SelectItem value="savings_fund">Savings Fund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transaction Type</Label>
                <Select value={txForm.transaction_type} onValueChange={v => setTxForm(f => ({ ...f, transaction_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contribution">Contribution</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee Amount</Label>
                <Input type="number" value={txForm.employee_amount} onChange={e => setTxForm(f => ({ ...f, employee_amount: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Employer Amount</Label>
                <Input type="number" value={txForm.employer_amount} onChange={e => setTxForm(f => ({ ...f, employer_amount: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={txForm.notes} onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialog(false)}>Cancel</Button>
            <Button onClick={saveTx}>Save Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
