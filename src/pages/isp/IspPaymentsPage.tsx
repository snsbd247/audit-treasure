import { useState, useEffect, useCallback } from "react";
import { ispPayments } from "@/lib/isp-api";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const methodColors: Record<string, string> = {
  bkash: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  nagad: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  manual: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  bank: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function IspPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState("__all__");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { per_page: "100" };
    if (methodFilter !== "__all__") params.method = methodFilter;
    const res = await ispPayments.list(params);
    setPayments(res.data || []);
    setLoading(false);
  }, [methodFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="page-container space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6 text-primary" />ISP Payments</h1>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Methods</SelectItem>
            <SelectItem value="bkash">bKash</SelectItem>
            <SelectItem value="nagad">Nagad</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Paid At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                )) : payments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payments</TableCell></TableRow>
                ) : payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.invoice?.customer?.name || "—"}</TableCell>
                    <TableCell>৳{Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className={methodColors[p.method] || ""}>{p.method}</Badge></TableCell>
                    <TableCell>{p.paid_at ? format(new Date(p.paid_at), "dd MMM yyyy HH:mm") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
