import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReportHeader } from "@/components/ReportHeader";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { GitCompare, Printer, Download, FileSpreadsheet } from "lucide-react";

const BankReconciliationReport = () => {
  const { accounts, fc, printRef, handlePrint, handleExportExcel } = useReportData();
  const [selectedBank, setSelectedBank] = useState("");
  const [bankStatementBal, setBankStatementBal] = useState("");
  const [erpBalance, setErpBalance] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const bankAccounts = accounts.filter((a) => a.account_name.toLowerCase().includes("bank"));

  const fetchBalance = async () => {
    if (!selectedBank) return;
    const { data: entries } = await supabase.from("voucher_entries")
      .select("debit, credit, acc_vouchers!inner(status)")
      .eq("account_id", selectedBank)
      .eq("acc_vouchers.status", "approved");

    const acc = accounts.find((a) => a.id === selectedBank);
    let bal = acc ? (acc.opening_balance_type === "debit" ? acc.opening_balance : -acc.opening_balance) : 0;
    (entries || []).forEach((e: any) => { bal += Number(e.debit) - Number(e.credit); });
    setErpBalance(bal);
    setLoaded(true);
  };

  const stmtBal = Number(bankStatementBal) || 0;
  const diff = erpBalance - stmtBal;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="Bank Reconciliation" />
      <div className="flex items-center gap-2">
        <GitCompare className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Bank Reconciliation</h1>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Bank Account</Label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="w-56 h-9 text-sm"><SelectValue placeholder="Select bank" /></SelectTrigger>
            <SelectContent>{bankAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bank Statement Balance</Label>
          <Input type="number" value={bankStatementBal} onChange={(e) => setBankStatementBal(e.target.value)} className="w-44 h-9 text-sm" placeholder="Enter amount" />
        </div>
        <Button size="sm" onClick={fetchBalance} className="h-9">Reconcile</Button>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => handlePrint("Bank Reconciliation")} className="h-8 text-xs"><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
          <Button variant="outline" size="sm" onClick={() => handleExportExcel(
            [{ field: "ERP Balance", amount: erpBalance }, { field: "Bank Statement", amount: stmtBal }, { field: "Difference", amount: diff }],
            [{ key: "field", label: "Field" }, { key: "amount", label: "Amount", format: "currency" }], "bank-reconciliation"
          )} className="h-8 text-xs"><FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Excel</Button>
        </div>
      </div>
      <div ref={printRef}>
        {loaded && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">ERP Ledger Balance</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(erpBalance)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bank Statement Balance</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(stmtBal)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Difference</TableCell>
                    <TableCell className={`text-right tabular-nums ${Math.abs(diff) > 0.01 ? "text-destructive" : "text-green-700 dark:text-green-400"}`}>
                      {fc(diff)} {Math.abs(diff) < 0.01 ? "✓ Reconciled" : "⚠ Unreconciled"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BankReconciliationReport;
