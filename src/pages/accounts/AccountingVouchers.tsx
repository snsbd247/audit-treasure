import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, FileText, Trash2 } from "lucide-react";

const VOUCHER_TYPES = [
  { id: "journal", label: "Journal Voucher", prefix: "JV" },
  { id: "payment", label: "Payment Voucher", prefix: "PV" },
  { id: "receipt", label: "Receipt Voucher", prefix: "RV" },
  { id: "contra", label: "Contra Voucher", prefix: "CV" },
];

interface Account { id: string; account_name: string; account_code: string; }
interface Branch { id: string; name: string; }
interface FinYear { id: string; name: string; }
interface EntryRow { id: string; account_id: string; debit: number; credit: number; narration: string; }
interface Voucher {
  id: string; voucher_number: string; voucher_type: string; voucher_date: string;
  branch_id: string | null; financial_year_id: string | null; description: string | null;
  total_amount: number; status: string; created_at: string;
}

const AccountingVouchers = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("journal");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [finYears, setFinYears] = useState<FinYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formBranch, setFormBranch] = useState("");
  const [formFinYear, setFormFinYear] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [entries, setEntries] = useState<EntryRow[]>([
    { id: "1", account_id: "", debit: 0, credit: 0, narration: "" },
    { id: "2", account_id: "", debit: 0, credit: 0, narration: "" },
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [vRes, aRes, bRes, fRes] = await Promise.all([
      supabase.from("acc_vouchers").select("*").eq("voucher_type", activeTab).order("created_at", { ascending: false }),
      supabase.from("chart_of_accounts").select("id, account_name, account_code").order("account_code"),
      supabase.from("branches").select("id, name"),
      supabase.from("financial_years").select("id, name"),
    ]);
    setVouchers((vRes.data || []) as Voucher[]);
    setAccounts((aRes.data || []) as Account[]);
    setBranches((bRes.data || []) as Branch[]);
    setFinYears((fRes.data || []) as FinYear[]);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const addEntry = () => {
    setEntries((prev) => [...prev, { id: String(Date.now()), account_id: "", debit: 0, credit: 0, narration: "" }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 2) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof EntryRow, value: any) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };

  const openCreate = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormBranch(""); setFormFinYear(""); setFormDesc("");
    setEntries([
      { id: "1", account_id: "", debit: 0, credit: 0, narration: "" },
      { id: "2", account_id: "", debit: 0, credit: 0, narration: "" },
    ]);
    setDialogOpen(true);
  };

  const handleSave = async (submitForApproval: boolean) => {
    if (!isBalanced) {
      toast({ title: "Debit and Credit must be equal", variant: "destructive" });
      return;
    }
    const validEntries = entries.filter((e) => e.account_id && (e.debit > 0 || e.credit > 0));
    if (validEntries.length < 2) {
      toast({ title: "At least 2 entries required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Generate number
      const { data: numData } = await supabase.rpc("next_number", { seq_id: activeTab });
      const voucherNumber = numData as string;

      const { data: vData, error: vErr } = await supabase.from("acc_vouchers").insert({
        voucher_number: voucherNumber,
        voucher_type: activeTab,
        voucher_date: formDate,
        branch_id: formBranch || null,
        financial_year_id: formFinYear || null,
        description: formDesc,
        total_amount: totalDebit,
        status: submitForApproval ? "pending" : "draft",
        created_by: user?.id,
      }).select().single();
      if (vErr) throw vErr;

      const entryRows = validEntries.map((e, i) => ({
        voucher_id: (vData as any).id,
        account_id: e.account_id,
        debit: e.debit,
        credit: e.credit,
        narration: e.narration,
        sort_order: i,
      }));
      const { error: eErr } = await supabase.from("voucher_entries").insert(entryRows);
      if (eErr) throw eErr;

      toast({ title: `Voucher ${voucherNumber} created` });
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (v: Voucher) => {
    const { error } = await supabase.from("acc_vouchers").update({
      status: "approved", approved_by: user?.id, approved_at: new Date().toISOString(),
    }).eq("id", v.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Voucher approved" }); fetchData(); }
  };

  const handleReject = async (v: Voucher) => {
    const { error } = await supabase.from("acc_vouchers").update({ status: "rejected" }).eq("id", v.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Voucher rejected" }); fetchData(); }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline", pending: "secondary", approved: "default", rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Accounting Vouchers</h1>
        </div>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />New Voucher</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {VOUCHER_TYPES.map((vt) => (
            <TabsTrigger key={vt.id} value={vt.id}>{vt.label}</TabsTrigger>
          ))}
        </TabsList>

        {VOUCHER_TYPES.map((vt) => (
          <TabsContent key={vt.id} value={vt.id}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voucher #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="w-24">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : vouchers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No vouchers yet</TableCell></TableRow>
                    ) : vouchers.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-geist-mono text-xs font-medium">{v.voucher_number}</TableCell>
                        <TableCell className="text-sm">{v.voucher_date}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{v.description || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{v.total_amount.toLocaleString()}</TableCell>
                        <TableCell>{statusBadge(v.status)}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            {v.status === "pending" && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleApprove(v)} title="Approve">
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleReject(v)} title="Reject">
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Voucher Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New {VOUCHER_TYPES.find((v) => v.id === activeTab)?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={formBranch} onValueChange={setFormBranch}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Financial Year</Label>
                <Select value={formFinYear} onValueChange={setFormFinYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {finYears.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Voucher narration" />
            </div>

            {/* Entry Grid */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Voucher Entries</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Account</TableHead>
                      <TableHead className="w-[20%] text-right">Debit</TableHead>
                      <TableHead className="w-[20%] text-right">Credit</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Select value={entry.account_id} onValueChange={(v) => updateEntry(entry.id, "account_id", v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select account" /></SelectTrigger>
                            <SelectContent>
                              {accounts.map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.account_code} — {a.account_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="h-9 text-right tabular-nums" value={entry.debit || ""}
                            onChange={(e) => updateEntry(entry.id, "debit", parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="h-9 text-right tabular-nums" value={entry.credit || ""}
                            onChange={(e) => updateEntry(entry.id, "credit", parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input className="h-9" value={entry.narration}
                            onChange={(e) => updateEntry(entry.id, "narration", e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)} disabled={entries.length <= 2}>
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell className="text-right text-sm">Total</TableCell>
                      <TableCell className="text-right tabular-nums">{totalDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{totalCredit.toLocaleString()}</TableCell>
                      <TableCell>
                        {!isBalanced && totalDebit > 0 && (
                          <span className="text-xs text-destructive">Difference: {Math.abs(totalDebit - totalCredit).toLocaleString()}</span>
                        )}
                        {isBalanced && <span className="text-xs text-green-600">✓ Balanced</span>}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Button variant="outline" size="sm" onClick={addEntry}><Plus className="w-4 h-4 mr-1" />Add Entry</Button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving || !isBalanced}>Save as Draft</Button>
            <Button onClick={() => handleSave(true)} disabled={saving || !isBalanced}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingVouchers;
