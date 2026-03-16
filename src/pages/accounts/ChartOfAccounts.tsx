import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, ChevronRight, ChevronDown, BookOpen } from "lucide-react";

const ACCOUNT_TYPES = ["asset", "liability", "income", "expense", "equity"] as const;

interface Account {
  id: string;
  account_name: string;
  account_code: string;
  account_type: string;
  parent_id: string | null;
  opening_balance: number;
  opening_balance_type: string;
  is_active: boolean;
}

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAcc, setEditAcc] = useState<Account | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<string>("asset");
  const [formParent, setFormParent] = useState<string>("");
  const [formBalance, setFormBalance] = useState("");
  const [formBalType, setFormBalType] = useState<string>("debit");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = async () => {
    setLoading(true);
    const { data } = await supabase.from("chart_of_accounts").select("*").order("account_code");
    setAccounts((data || []) as Account[]);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  // Build tree structure
  const tree = useMemo(() => {
    const map = new Map<string | null, Account[]>();
    accounts.forEach((a) => {
      const parentKey = a.parent_id || "__root__";
      if (!map.has(parentKey)) map.set(parentKey, []);
      map.get(parentKey)!.push(a);
    });
    return map;
  }, [accounts]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setEditAcc(null);
    setFormName(""); setFormCode(""); setFormType("asset"); setFormParent(""); setFormBalance("0"); setFormBalType("debit");
    setDialogOpen(true);
  };

  const openEdit = (a: Account) => {
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
      fetchAccounts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const typeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset: "bg-blue-100 text-blue-800",
      liability: "bg-red-100 text-red-800",
      income: "bg-green-100 text-green-800",
      expense: "bg-orange-100 text-orange-800",
      equity: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "";
  };

  const renderRows = (parentId: string | null, depth: number): React.ReactNode[] => {
    const children = tree.get(parentId || "__root__") || [];
    const rows: React.ReactNode[] = [];
    children.forEach((a) => {
      const hasChildren = tree.has(a.id);
      const isExpanded = expanded.has(a.id);
      rows.push(
        <TableRow key={a.id}>
          <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
              {hasChildren ? (
                <button onClick={() => toggleExpand(a.id)} className="mr-1 text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : <span className="w-5" />}
              <span className="font-medium text-sm">{a.account_name}</span>
            </div>
          </TableCell>
          <TableCell className="font-geist-mono text-xs">{a.account_code}</TableCell>
          <TableCell>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor(a.account_type)}`}>
              {a.account_type}
            </span>
          </TableCell>
          <TableCell className="tabular-nums text-sm">
            {a.opening_balance > 0 ? `${a.opening_balance.toLocaleString()} ${a.opening_balance_type === "debit" ? "Dr" : "Cr"}` : "—"}
          </TableCell>
          <TableCell>
            <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
          </TableCell>
        </TableRow>
      );
      if (hasChildren && isExpanded) {
        rows.push(...renderRows(a.id, depth + 1));
      }
    });
    return rows;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Chart of Accounts</h1>
        </div>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Add Account</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : accounts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No accounts yet. Create your first account.</TableCell></TableRow>
              ) : renderRows(null, 0)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAcc ? "Edit Account" : "Create Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Cash in Hand" />
              </div>
              <div className="space-y-2">
                <Label>Account Code</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="1001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Parent Account</Label>
                <Select value={formParent || "__none__"} onValueChange={(value) => setFormParent(value === "__none__" ? "" : value)}>
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
              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} />
              </div>
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
    </div>
  );
};

export default ChartOfAccounts;
