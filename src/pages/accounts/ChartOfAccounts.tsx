import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Filter } from "lucide-react";
import { useAccountBalances, AccountWithBalance } from "@/hooks/useAccountBalances";
import { AccountTreeTable } from "@/components/accounts/AccountTreeTable";
import { AccountLedgerDialog } from "@/components/accounts/AccountLedgerDialog";

const ACCOUNT_TYPES = ["asset", "liability", "income", "expense", "equity"] as const;

const ChartOfAccounts = () => {
  const { toast } = useToast();

  // Filters
  const [financialYears, setFinancialYears] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [filterFY, setFilterFY] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { accounts, loading, refetch } = useAccountBalances({
    financialYearId: filterFY || undefined,
    branchId: filterBranch || undefined,
    dateFrom: filterFrom || undefined,
    dateTo: filterTo || undefined,
  });

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAcc, setEditAcc] = useState<AccountWithBalance | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<string>("asset");
  const [formParent, setFormParent] = useState<string>("");
  const [formBalance, setFormBalance] = useState("0");
  const [formBalType, setFormBalType] = useState<string>("debit");
  const [saving, setSaving] = useState(false);

  // Ledger dialog
  const [ledgerAccount, setLedgerAccount] = useState<AccountWithBalance | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("financial_years").select("id, name").order("start_date", { ascending: false }),
      supabase.from("branches").select("id, name").eq("status", "active"),
    ]).then(([fyRes, brRes]) => {
      setFinancialYears((fyRes.data || []) as any[]);
      setBranches((brRes.data || []) as any[]);
    });
  }, []);

  const openCreate = () => {
    setEditAcc(null);
    setFormName(""); setFormCode(""); setFormType("asset"); setFormParent(""); setFormBalance("0"); setFormBalType("debit");
    setDialogOpen(true);
  };

  const openEdit = (a: AccountWithBalance) => {
    setEditAcc(a);
    setFormName(a.account_name); setFormCode(a.account_code); setFormType(a.account_type);
    setFormParent(a.parent_id || ""); setFormBalance(String(a.opening_balance)); setFormBalType(a.opening_balance_type);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) return;
    setSaving(true);
    try {
      const payload = {
        account_name: formName,
        account_code: formCode,
        account_type: formType,
        parent_id: formParent || null,
        opening_balance: parseFloat(formBalance) || 0,
        opening_balance_type: formBalType,
        updated_at: new Date().toISOString(),
      };
      if (editAcc) {
        const { error } = await supabase.from("chart_of_accounts").update(payload).eq("id", editAcc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("chart_of_accounts").insert(payload);
        if (error) throw error;
      }
      toast({ title: editAcc ? "Account updated" : "Account created" });
      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Chart of Accounts</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-1" />{showFilters ? "Hide Filters" : "Filters"}
          </Button>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Add Account</Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="py-3 flex flex-wrap gap-4 items-end">
            <div className="space-y-1 w-48">
              <Label className="text-xs">Financial Year</Label>
              <Select value={filterFY || "__all__"} onValueChange={(v) => setFilterFY(v === "__all__" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Years</SelectItem>
                  {financialYears.map((fy) => <SelectItem key={fy.id} value={fy.id}>{fy.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-48">
              <Label className="text-xs">Branch</Label>
              <Select value={filterBranch || "__all__"} onValueChange={(v) => setFilterBranch(v === "__all__" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFilterFY(""); setFilterBranch(""); setFilterFrom(""); setFilterTo(""); }}>
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading accounts...</div>
          ) : (
            <AccountTreeTable accounts={accounts} onEdit={openEdit} onDrillDown={(a) => setLedgerAccount(a)} />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAcc ? "Edit Account" : "Create Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Account Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Cash in Hand" /></div>
              <div className="space-y-2"><Label>Account Code</Label><Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="1001" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Parent Account</Label>
                <Select value={formParent || "__none__"} onValueChange={(v) => setFormParent(v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None (root level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (root level)</SelectItem>
                    {accounts.filter((a) => a.id !== editAcc?.id).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.account_code} — {a.account_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Opening Balance</Label><Input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Balance Type</Label>
                <Select value={formBalType} onValueChange={setFormBalType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ledger Drill-Down Dialog */}
      <AccountLedgerDialog
        accountId={ledgerAccount?.id || null}
        accountName={ledgerAccount?.account_name || ""}
        openingBalance={ledgerAccount?.opening_balance || 0}
        openingBalanceType={ledgerAccount?.opening_balance_type || "debit"}
        open={!!ledgerAccount}
        onOpenChange={(open) => { if (!open) setLedgerAccount(null); }}
      />
    </div>
  );
};

export default ChartOfAccounts;
