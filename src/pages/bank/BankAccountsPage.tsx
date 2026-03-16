import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark } from "lucide-react";

const BankAccountsPage = () => {
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("chart_of_accounts")
      .select("*")
      .ilike("account_name", "%bank%")
      .eq("is_active", true)
      .then(({ data }) => setAccounts(data || []));
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
      <h1 className="text-xl font-bold text-foreground">Bank Accounts</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Landmark className="w-4 h-4" />Bank Accounts from Chart of Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Opening Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.account_code}</TableCell>
                  <TableCell className="font-medium">{a.account_name}</TableCell>
                  <TableCell>{a.account_type}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(a.opening_balance).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No bank accounts found. Add accounts with "Bank" in the name in Chart of Accounts.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankAccountsPage;
