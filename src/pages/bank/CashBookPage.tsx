import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PiggyBank } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const CashBookPage = () => {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    // Cash book = voucher entries involving Cash accounts
    supabase
      .from("voucher_entries")
      .select("*, account:chart_of_accounts(account_name, account_code), voucher:acc_vouchers(voucher_number, voucher_date, voucher_type, status)")
      .order("sort_order")
      .limit(100)
      .then(({ data }) => {
        const cashEntries = (data || []).filter(
          (e: any) => e.account?.account_name?.toLowerCase().includes("cash")
        );
        setEntries(cashEntries);
      });
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
      <h1 className="text-xl font-bold text-foreground">Cash Book</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PiggyBank className="w-4 h-4" />Cash Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.voucher?.voucher_number}</TableCell>
                  <TableCell>{e.voucher?.voucher_date}</TableCell>
                  <TableCell>{e.voucher?.voucher_type}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(e.debit) > 0 ? Number(e.debit).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(e.credit) > 0 ? Number(e.credit).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No cash transactions found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashBookPage;
