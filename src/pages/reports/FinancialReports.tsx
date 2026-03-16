import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Search, Printer, Download } from "lucide-react";
import { ReportHeader } from "@/components/ReportHeader";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface Account { id: string; account_name: string; account_code: string; account_type: string; opening_balance: number; opening_balance_type: string; }
interface Branch { id: string; name: string; }

const FinancialReports = () => {
  const [tab, setTab] = useState("ledger");
  const { fc } = useCurrency();
  const { settings } = useCompanySettings();
  const printRef = useRef<HTMLDivElement>(null);
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

  const computeTrialData = async () => {
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

    return accounts.map((a) => {
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
  };

  const fetchTrialBalance = async () => {
    setLoading(true);
    const data = await computeTrialData();
    setTrialData(data);
    setLoading(false);
  };

  const fetchPL = async () => {
    setLoading(true);
    const data = await computeTrialData();
    setTrialData(data);
    const income = data.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "income");
    const expense = data.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "expense");
    setPlData({
      income, expense,
      totalIncome: income.reduce((s, i) => s + Math.abs(i.balance), 0),
      totalExpense: expense.reduce((s, e) => s + Math.abs(e.balance), 0),
    });
    setLoading(false);
  };

  const fetchBS = async () => {
    setLoading(true);
    const data = await computeTrialData();
    setTrialData(data);
    const assets = data.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "asset");
    const liabilities = data.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "liability");
    const equity = data.filter((t) => accounts.find((a) => a.id === t.id)?.account_type === "equity");
    setBsData({
      assets, liabilities, equity,
      totalAssets: assets.reduce((s, a) => s + a.balance, 0),
      totalLiabilities: liabilities.reduce((s, l) => s + Math.abs(l.balance), 0),
      totalEquity: equity.reduce((s, e) => s + Math.abs(e.balance), 0),
    });
    setLoading(false);
  };

  const tabTitles: Record<string, string> = {
    ledger: "Account Ledger",
    trial: "Trial Balance",
    pl: "Profit & Loss Statement",
    bs: "Balance Sheet",
  };

  const handlePrintReport = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${tabTitles[tab]} — ${settings?.company_name || "Report"}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px; color: #1a1a1a; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
        .header h2 { font-size: 14px; font-weight: 600; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .header p { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f0f0f0; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; }
        td { padding: 6px 10px; border: 1px solid #ddd; font-size: 12px; }
        .text-right { text-align: right; }
        .total-row { background: #f0f0f0; font-weight: 700; }
        .section-title { font-size: 13px; font-weight: 600; margin: 16px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .summary { font-size: 14px; font-weight: 700; margin-top: 16px; padding: 8px 12px; background: #f8f8f8; border-radius: 4px; display: flex; justify-content: space-between; }
        .timestamp { font-size: 10px; color: #999; text-align: right; margin-top: 24px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="header">
        <h1>${settings?.company_name || "Company"}</h1>
        ${settings?.address ? `<p>${settings.address}</p>` : ""}
        <p>${[settings?.phone && `Phone: ${settings.phone}`, settings?.email && `Email: ${settings.email}`].filter(Boolean).join(" | ")}</p>
        <h2>${tabTitles[tab]}</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
      </div>
      ${content.innerHTML}
      <p class="timestamp">This is a system-generated report.</p>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="p-6 space-y-4">
      <ReportHeader reportTitle="Financial Reports" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Financial Reports</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintReport}>
            <Download className="w-4 h-4 mr-1" />Export PDF
          </Button>
          <Button size="sm" onClick={handlePrintReport}>
            <Printer className="w-4 h-4 mr-1" />Print
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="trial" onClick={fetchTrialBalance}>Trial Balance</TabsTrigger>
          <TabsTrigger value="pl" onClick={fetchPL}>Profit & Loss</TabsTrigger>
          <TabsTrigger value="bs" onClick={fetchBS}>Balance Sheet</TabsTrigger>
        </TabsList>

        <div ref={printRef}>
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
                      <TableCell className="text-right tabular-nums">{Number(e.debit) > 0 ? fc(Number(e.debit)) : ""}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(e.credit) > 0 ? fc(Number(e.credit)) : ""}</TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${e.running_balance < 0 ? "text-destructive" : ""}`}>
                        {fc(Math.abs(e.running_balance))} {e.running_balance >= 0 ? "Dr" : "Cr"}
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
                      <TableCell className="text-right tabular-nums">{t.balance > 0 ? fc(t.balance) : ""}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.balance < 0 ? fc(Math.abs(t.balance)) : ""}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3} className="text-right">Total</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(trialData.filter((t) => t.balance > 0).reduce((s, t) => s + t.balance, 0))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(trialData.filter((t) => t.balance < 0).reduce((s, t) => s + Math.abs(t.balance), 0))}</TableCell>
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
                      <TableRow key={i.id}><TableCell>{i.account_name}</TableCell><TableCell className="text-right tabular-nums">{fc(Math.abs(i.balance))}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold"><TableCell>Total Income</TableCell><TableCell className="text-right tabular-nums">{fc(plData.totalIncome)}</TableCell></TableRow>
                  </TableBody></Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base text-red-700">Expenses</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table><TableBody>
                    {plData.expense.map((e) => (
                      <TableRow key={e.id}><TableCell>{e.account_name}</TableCell><TableCell className="text-right tabular-nums">{fc(Math.abs(e.balance))}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold"><TableCell>Total Expenses</TableCell><TableCell className="text-right tabular-nums">{fc(plData.totalExpense)}</TableCell></TableRow>
                  </TableBody></Table>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-4">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Net Profit / (Loss)</span>
                  <span className={`text-xl font-bold tabular-nums ${plData.totalIncome - plData.totalExpense >= 0 ? "text-green-700" : "text-destructive"}`}>
                    {fc(plData.totalIncome - plData.totalExpense)}
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
                    <TableRow key={a.id}><TableCell>{a.account_name}</TableCell><TableCell className="text-right tabular-nums">{fc(a.balance)}</TableCell></TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold"><TableCell>Total Assets</TableCell><TableCell className="text-right tabular-nums">{fc(bsData.totalAssets)}</TableCell></TableRow>
                </TableBody></Table></CardContent>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Liabilities</CardTitle></CardHeader>
                  <CardContent className="p-0"><Table><TableBody>
                    {bsData.liabilities.map((l) => (
                      <TableRow key={l.id}><TableCell>{l.account_name}</TableCell><TableCell className="text-right tabular-nums">{fc(Math.abs(l.balance))}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold"><TableCell>Total Liabilities</TableCell><TableCell className="text-right tabular-nums">{fc(bsData.totalLiabilities)}</TableCell></TableRow>
                  </TableBody></Table></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Equity</CardTitle></CardHeader>
                  <CardContent className="p-0"><Table><TableBody>
                    {bsData.equity.map((e) => (
                      <TableRow key={e.id}><TableCell>{e.account_name}</TableCell><TableCell className="text-right tabular-nums">{fc(Math.abs(e.balance))}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold"><TableCell>Total Equity</TableCell><TableCell className="text-right tabular-nums">{fc(bsData.totalEquity)}</TableCell></TableRow>
                  </TableBody></Table></CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
export default FinancialReports;
