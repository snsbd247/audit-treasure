import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Pencil, BookOpen } from "lucide-react";
import { AccountWithBalance } from "@/hooks/useAccountBalances";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  accounts: AccountWithBalance[];
  onEdit: (account: AccountWithBalance) => void;
  onDrillDown: (account: AccountWithBalance) => void;
}

export function AccountTreeTable({ accounts, onEdit, onDrillDown }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { fc } = useCurrency();

  const childMap = useMemo(() => {
    const map = new Map<string, AccountWithBalance[]>();
    accounts.forEach((a) => {
      const key = a.parent_id || "__root__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [accounts]);

  // Compute rollup balances for parent accounts
  const rollup = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number; closing: number }>();
    const computing = new Set<string>();
    const computeRollup = (id: string): { debit: number; credit: number; closing: number } => {
      if (map.has(id)) return map.get(id)!;
      if (computing.has(id)) return { debit: 0, credit: 0, closing: 0 }; // break circular ref
      computing.add(id);
      const acc = accounts.find((a) => a.id === id);
      if (!acc) { computing.delete(id); return { debit: 0, credit: 0, closing: 0 }; }

      const children = childMap.get(id) || [];
      const selfClosingSigned = acc.closing_balance_type === "debit" ? acc.closing_balance : -acc.closing_balance;
      let totalDebit = acc.total_debit;
      let totalCredit = acc.total_credit;
      let totalClosing = selfClosingSigned;

      children.forEach((c) => {
        const cr = computeRollup(c.id);
        totalDebit += cr.debit;
        totalCredit += cr.credit;
        totalClosing += cr.closing;
      });

      const result = { debit: totalDebit, credit: totalCredit, closing: totalClosing };
      map.set(id, result);
      computing.delete(id);
      return result;
    };
    accounts.forEach((a) => computeRollup(a.id));
    return map;
  }, [accounts, childMap]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const typeColor: Record<string, string> = {
    asset: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    liability: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    income: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    expense: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    equity: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };

  const renderRows = (parentId: string | null, depth: number): React.ReactNode[] => {
    const children = childMap.get(parentId || "__root__") || [];
    const rows: React.ReactNode[] = [];

    children.forEach((a) => {
      const hasChildren = childMap.has(a.id);
      const isExpanded = expanded.has(a.id);
      const ru = rollup.get(a.id) || { debit: 0, credit: 0, closing: 0 };
      const displayDebit = hasChildren ? ru.debit : a.total_debit;
      const displayCredit = hasChildren ? ru.credit : a.total_credit;
      const displayClosing = hasChildren ? Math.abs(ru.closing) : a.closing_balance;
      const closingType = hasChildren ? (ru.closing >= 0 ? "Dr" : "Cr") : (a.closing_balance_type === "debit" ? "Dr" : "Cr");

      rows.push(
        <TableRow key={a.id} className={hasChildren ? "bg-muted/20" : ""}>
          <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
              {hasChildren ? (
                <button onClick={() => toggle(a.id)} className="mr-1 text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : <span className="w-5" />}
              <button
                onClick={() => onDrillDown(a)}
                className="font-medium text-sm text-primary hover:underline text-left"
                title="View Ledger"
              >
                {a.account_name}
              </button>
            </div>
          </TableCell>
          <TableCell className="font-mono text-xs">{a.account_code}</TableCell>
          <TableCell>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[a.account_type] || ""}`}>
              {a.account_type}
            </span>
          </TableCell>
          <TableCell className="text-right tabular-nums text-sm">
            {a.opening_balance > 0
              ? `${fc(a.opening_balance)} ${a.opening_balance_type === "debit" ? "Dr" : "Cr"}`
              : "—"}
          </TableCell>
          <TableCell className="text-right tabular-nums text-sm">
            {displayDebit > 0 ? fc(displayDebit) : "—"}
          </TableCell>
          <TableCell className="text-right tabular-nums text-sm">
            {displayCredit > 0 ? fc(displayCredit) : "—"}
          </TableCell>
          <TableCell className="text-right tabular-nums text-sm font-semibold">
            {displayClosing > 0 ? `${fc(displayClosing)} ${closingType}` : "—"}
          </TableCell>
          <TableCell>
            <Button variant="ghost" size="icon" onClick={() => onEdit(a)}>
              <Pencil className="w-4 h-4" />
            </Button>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Opening Balance</TableHead>
          <TableHead className="text-right">Total Debit</TableHead>
          <TableHead className="text-right">Total Credit</TableHead>
          <TableHead className="text-right">Closing Balance</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground">
              No accounts yet. Create your first account.
            </TableCell>
          </TableRow>
        ) : (
          renderRows(null, 0)
        )}
      </TableBody>
    </Table>
  );
}
