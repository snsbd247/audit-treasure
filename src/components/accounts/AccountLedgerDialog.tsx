import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  accountId: string | null;
  accountName: string;
  openingBalance: number;
  openingBalanceType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LedgerEntry {
  id: string;
  debit: number;
  credit: number;
  narration: string | null;
  voucher_number: string;
  voucher_date: string;
  description: string | null;
  running_balance: number;
}

export function AccountLedgerDialog({ accountId, accountName, openingBalance, openingBalanceType, open, onOpenChange }: Props) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { fc } = useCurrency();

  useEffect(() => {
    if (!accountId || !open) return;
    const fetchLedger = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("voucher_entries")
        .select("id, debit, credit, narration, acc_vouchers!inner(voucher_number, voucher_date, description, status)")
        .eq("account_id", accountId)
        .eq("acc_vouchers.status", "approved")
        .order("acc_vouchers(voucher_date)");

      let runBal = openingBalanceType === "debit" ? openingBalance : -openingBalance;

      const mapped = (data || []).map((e: any) => {
        runBal += Number(e.debit) - Number(e.credit);
        return {
          id: e.id,
          debit: Number(e.debit),
          credit: Number(e.credit),
          narration: e.narration,
          voucher_number: e.acc_vouchers?.voucher_number || "",
          voucher_date: e.acc_vouchers?.voucher_date || "",
          description: e.acc_vouchers?.description || "",
          running_balance: runBal,
        };
      });

      setEntries(mapped);
      setLoading(false);
    };
    fetchLedger();
  }, [accountId, open, openingBalance, openingBalanceType]);

  const closingBalance = entries.length > 0 ? entries[entries.length - 1].running_balance : (openingBalanceType === "debit" ? openingBalance : -openingBalance);
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Ledger Statement — {accountName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Opening: {fc(openingBalance)} {openingBalanceType === "debit" ? "Dr" : "Cr"}
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Closing: {fc(Math.abs(closingBalance))} {closingBalance >= 0 ? "Dr" : "Cr"}
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Voucher #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Opening Balance Row */}
            <TableRow className="bg-muted/30">
              <TableCell colSpan={3} className="font-medium">Opening Balance</TableCell>
              <TableCell className="text-right tabular-nums">
                {openingBalanceType === "debit" && openingBalance > 0 ? fc(openingBalance) : ""}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {openingBalanceType === "credit" && openingBalance > 0 ? fc(openingBalance) : ""}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {openingBalance > 0 ? `${fc(openingBalance)} ${openingBalanceType === "debit" ? "Dr" : "Cr"}` : "—"}
              </TableCell>
            </TableRow>

            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No transactions</TableCell></TableRow>
            ) : entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.voucher_date}</TableCell>
                <TableCell className="font-mono text-xs">{e.voucher_number}</TableCell>
                <TableCell className="text-muted-foreground">{e.description || e.narration || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{e.debit > 0 ? fc(e.debit) : ""}</TableCell>
                <TableCell className="text-right tabular-nums">{e.credit > 0 ? fc(e.credit) : ""}</TableCell>
                <TableCell className={`text-right tabular-nums font-medium ${e.running_balance < 0 ? "text-destructive" : ""}`}>
                  {fc(Math.abs(e.running_balance))} {e.running_balance >= 0 ? "Dr" : "Cr"}
                </TableCell>
              </TableRow>
            ))}

            {/* Totals Row */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell colSpan={3} className="text-right">Total</TableCell>
              <TableCell className="text-right tabular-nums">{fc(totalDebit)}</TableCell>
              <TableCell className="text-right tabular-nums">{fc(totalCredit)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {fc(Math.abs(closingBalance))} {closingBalance >= 0 ? "Dr" : "Cr"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
