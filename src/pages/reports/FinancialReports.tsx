import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Search } from "lucide-react";
import { ReportHeader } from "@/components/ReportHeader";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Account { id: string; account_name: string; account_code: string; account_type: string; opening_balance: number; opening_balance_type: string; }
interface Branch { id: string; name: string; }

const FinancialReports = () => {
  const [tab, setTab] = useState("ledger");
  const { fc } = useCurrency();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  // Ledger filters
  const [ledgerAccount, setLedgerAccount] = useState("");
  const [ledgerFrom, setLedgerFrom] = useState("");
  const [ledgerTo, setLedgerTo] = useState("");
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  // Trial Balance
  const [trialData, setTrialData] = useState<any[]>([]);
  // P&L
  const [plData, setPlData] = useState<{ income: any[]; expense: any[]; totalIncome: number; totalExpense: number }>({ income: [], expense: [], totalIncome: 0, totalExpense: 0 });
  // Balance Sheet
  const [bsData, setBsData] = useState<{ assets: any[]; liabilities: any[]; equity: any[]; totalAssets: number; totalLiabilities: number; totalEquity: number }>({ assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0 });

  useEffect(() => {
    const init = async () => {
      const [aRes, bRes] = await Promise.all([
        supabase.from("chart_of_accounts").select("*").order("account_code"),
        supabase.from("branches").select("id, name"),
      ]);
      setAccounts((aRes.data || []) as Account[]);
      setBranches((bRes.data || []) as Branch[]);
    };
    init();
  }, []);

  const fetchLedger = async () => {
    if (!ledgerAccount) return;
    setLoading(true);
    let query = supabase.from("voucher_entries").select("*, acc_vouchers!inner(voucher_number, voucher_date, status, description)")
      .eq("account_id", ledgerAccount)
      .eq("acc_vouchers.status", "approved")
      .order("acc_vouchers(voucher_date)");

    const { data } = await query;
    let runBal = 0;
    const acc = accounts.find((a) => a.id === ledgerAccount);
    if (acc) runBal = acc.opening_balance_type === "debit" ? acc.opening_balance : -acc.opening_balance;

    const entries = (data || []).map((e: any) => {
      runBal += Number(e.debit) - Number(e.credit);
      return {
        ...e,
        voucher_number: e.acc_vouchers?.voucher_number,
        voucher_date: e.acc_vouchers?.voucher_date,
        description: e.acc_vouchers?.description,
        running_balance: runBal,
      };
    });
    setLedgerEntries(entries);
    setLoading(false);
  };

  const fetchTrialBalance = async () => {
    setLoading(true);
    const { data: entries } = await supabase.from("voucher_entries")
      .select("account_id, debit, credit, acc_vouchers!inner(status)")
      .eq("acc_vouchers.status", "approved");

    const balMap = new Map<string, { debit: number; credit: number }>();
    (entries || []).forEach((e: any) => {
      const cur = balMap.get(e.account_id) || { debit: 0, credit: 0 };
      cur.debit += Number(e.debit);
      cur.credit += Number(e.credit);
      balMap.set(e.account_id, cur);
    });

    const trial = accounts.map((a) => {
      const txn = balMap.get(a.id) || { debit: 0, credit: 0 };
      let openDr = a.opening_balance_type === "debit" ? a.opening_balance : 0;
      let openCr = a.opening_balance_type === "credit" ? a.opening_balance : 0;
      return {
        ...a,
        total_debit: openDr + txn.debit,
        total_credit: openCr + txn.credit,
        balance: (openDr + txn.debit) - (openCr + txn.credit),
      };
    }).filter((a) => a.total_debit > 0 || a.total_credit > 0 || a.balance !== 0);

    setTrialData(trial);
    setLoading(false);
  };

  const fetchPL = async () => {
    setLoading(true);
    await fetchTrialBalance();
    const income = trialData.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "income");
    const expense = trialData.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "expense");
    setPlData({
      income, expense,
      totalIncome: income.reduce((s, i) => s + Math.abs(i.balance), 0),
      totalExpense: expense.reduce((s, e) => s + Math.abs(e.balance), 0),
    });
    setLoading(false);
  };

  const fetchBS = async () => {
    setLoading(true);
    await fetchTrialBalance();
    const assets = trialData.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "asset");
    const liabilities = trialData.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "liability");
    const equity = trialData.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "equity");
    setBsData({
      assets, liabilities, equity,
      totalAssets: assets.reduce((s, a) => s + a.balance, 0),
      totalLiabilities: liabilities.reduce((s, l) => s + Math.abs(l.balance), 0),
      totalEquity: equity.reduce((s, e) => s + Math.abs(e.balance), 0),
    });
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-4">
      <ReportHeader reportTitle="Financial Reports" />
      <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Financial Reports</h1></div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="trial" onClick={fetchTrialBalance}>Trial Balance</TabsTrigger>
          <TabsTrigger value="pl" onClick={fetchPL}>Profit & Loss</TabsTrigger>
          <TabsTrigger value="bs" onClick={fetchBS}>Balance Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <div className="flex gap-4 items-end mb-4">
            <div className="space-y-2 w-64"><Label>Account</Label>
              <Select value={ledgerAccount} onValueChange={setLedgerAccount}><SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_code} — {a.account_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>From</Label><Input type="date" value={ledgerFrom} onChange={(e) => setLedgerFrom(e.target.value)} /></div>
            <div className="space-y-2"><Label>To</Label><Input type="date" value={ledgerTo} onChange={(e) => setLedgerTo(e.target.value)} /></div>
            <Button size="sm" onClick={fetchLedger}><Search className="w-4 h-4 mr-1" />View</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Voucher #</TableHead><TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {ledgerEntries.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Select an account and click View</TableCell></TableRow>
                : ledgerEntries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.voucher_date}</TableCell>
                    <TableCell className="font-geist-mono text-xs">{e.voucher_number}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description || e.narration || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(e.debit) > 0 ? Number(e.debit).toLocaleString() : ""}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(e.credit) > 0 ? Number(e.credit).toLocaleString() : ""}</TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${e.running_balance < 0 ? "text-destructive" : ""}`}>
                      {Math.abs(e.running_balance).toLocaleString()} {e.running_balance >= 0 ? "Dr" : "Cr"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="trial">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>Type</TableHead>
                <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {trialData.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-geist-mono text-xs">{t.account_code}</TableCell>
                    <TableCell className="font-medium">{t.account_name}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{t.account_type}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.balance > 0 ? t.balance.toLocaleString() : ""}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.balance < 0 ? Math.abs(t.balance).toLocaleString() : ""}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-right">Total</TableCell>
                  <TableCell className="text-right tabular-nums">{trialData.filter((t) => t.balance > 0).reduce((s, t) => s + t.balance, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{trialData.filter((t) => t.balance < 0).reduce((s, t) => s + Math.abs(t.balance), 0).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pl">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base text-green-700">Income</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table><TableBody>
                  {plData.income.map((i) => (
                    <TableRow key={i.id}><TableCell>{i.account_name}</TableCell><TableCell className="text-right tabular-nums">{Math.abs(i.balance).toLocaleString()}</TableCell></TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold"><TableCell>Total Income</TableCell><TableCell className="text-right tabular-nums">{plData.totalIncome.toLocaleString()}</TableCell></TableRow>
                </TableBody></Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base text-red-700">Expenses</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table><TableBody>
                  {plData.expense.map((e) => (
                    <TableRow key={e.id}><TableCell>{e.account_name}</TableCell><TableCell className="text-right tabular-nums">{Math.abs(e.balance).toLocaleString()}</TableCell></TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold"><TableCell>Total Expenses</TableCell><TableCell className="text-right tabular-nums">{plData.totalExpense.toLocaleString()}</TableCell></TableRow>
                </TableBody></Table>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Net Profit / (Loss)</span>
                <span className={`text-xl font-bold tabular-nums ${plData.totalIncome - plData.totalExpense >= 0 ? "text-green-700" : "text-destructive"}`}>
                  {(plData.totalIncome - plData.totalExpense).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bs">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Assets</CardTitle></CardHeader>
              <CardContent className="p-0"><Table><TableBody>
                {bsData.assets.map((a) => (
                  <TableRow key={a.id}><TableCell>{a.account_name}</TableCell><TableCell className="text-right tabular-nums">{a.balance.toLocaleString()}</TableCell></TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold"><TableCell>Total Assets</TableCell><TableCell className="text-right tabular-nums">{bsData.totalAssets.toLocaleString()}</TableCell></TableRow>
              </TableBody></Table></CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Liabilities</CardTitle></CardHeader>
                <CardContent className="p-0"><Table><TableBody>
                  {bsData.liabilities.map((l) => (
                    <TableRow key={l.id}><TableCell>{l.account_name}</TableCell><TableCell className="text-right tabular-nums">{Math.abs(l.balance).toLocaleString()}</TableCell></TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold"><TableCell>Total Liabilities</TableCell><TableCell className="text-right tabular-nums">{bsData.totalLiabilities.toLocaleString()}</TableCell></TableRow>
                </TableBody></Table></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Equity</CardTitle></CardHeader>
                <CardContent className="p-0"><Table><TableBody>
                  {bsData.equity.map((e) => (
                    <TableRow key={e.id}><TableCell>{e.account_name}</TableCell><TableCell className="text-right tabular-nums">{Math.abs(e.balance).toLocaleString()}</TableCell></TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold"><TableCell>Total Equity</TableCell><TableCell className="text-right tabular-nums">{bsData.totalEquity.toLocaleString()}</TableCell></TableRow>
                </TableBody></Table></CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default FinancialReports;
