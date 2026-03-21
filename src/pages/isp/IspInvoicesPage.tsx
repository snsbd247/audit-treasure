import { useState, useEffect, useCallback } from "react";
import { ispInvoices, ispBkash } from "@/lib/isp-api";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  unpaid: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function IspInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Show bKash callback result
  useEffect(() => {
    const bkashStatus = searchParams.get("bkash");
    const trx = searchParams.get("trx");
    if (bkashStatus === "success") {
      toast.success(`bKash payment successful! TrxID: ${trx || "—"}`);
    } else if (bkashStatus === "failed") {
      toast.error("bKash payment failed or cancelled");
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { per_page: "100" };
    if (statusFilter !== "__all__") params.status = statusFilter;
    const res = await ispInvoices.list(params);
    setInvoices(res.data || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBkashPay = async (invoiceId: string) => {
    setPayingId(invoiceId);
    const res = await ispBkash.createPayment(invoiceId);
    if (res.error) {
      toast.error(res.error);
      setPayingId(null);
      return;
    }
    if (res.data?.bkashURL) {
      // Redirect to bKash payment page
      window.location.href = res.data.bkashURL;
    } else {
      toast.error("No bKash redirect URL received");
      setPayingId(null);
    }
  };

  return (
    <div className="page-container space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" />ISP Invoices</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
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
                  <TableHead>Billing Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                )) : invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices</TableCell></TableRow>
                ) : invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.customer?.name || "—"}</TableCell>
                    <TableCell>৳{Number(inv.amount).toLocaleString()}</TableCell>
                    <TableCell>{inv.billing_date ? format(new Date(inv.billing_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell>{inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[inv.status] || ""}>{inv.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {inv.status !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-pink-600 border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950"
                          disabled={payingId === inv.id}
                          onClick={() => handleBkashPay(inv.id)}
                        >
                          {payingId === inv.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <span className="font-bold mr-1">b</span>
                          )}
                          Pay with bKash
                        </Button>
                      )}
                    </TableCell>
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
