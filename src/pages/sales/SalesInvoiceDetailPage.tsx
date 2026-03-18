import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrintLayout } from "@/components/PrintLayout";
import { ArrowLeft, Printer, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceData {
  id: string; invoice_number: string; invoice_date: string; customer_id: string | null;
  total_amount: number; discount: number; net_amount: number; status: string; notes: string | null;
  branch_id: string | null;
}

const SalesInvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fc } = useCurrency();
  const { settings } = useCompanySettings();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [branchName, setBranchName] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [invRes, itemsRes, allocRes] = await Promise.all([
        supabase.from("sales_invoices").select("*").eq("id", id).single(),
        supabase.from("sales_invoice_items").select("*").eq("sales_invoice_id", id),
        supabase.from("payment_allocations" as any).select("allocated_amount").eq("invoice_id", id).eq("invoice_type", "sales_invoice"),
      ]);
      if (invRes.data) {
        setInvoice(invRes.data as any);
        if (invRes.data.customer_id) {
          const { data: cust } = await supabase.from("customers").select("*").eq("id", invRes.data.customer_id).single();
          if (cust) { setCustomerName(cust.name); setCustomerInfo(cust); }
        }
        if (invRes.data.branch_id) {
          const { data: br } = await supabase.from("branches").select("name").eq("id", invRes.data.branch_id).single();
          if (br) setBranchName(br.name);
        }
      }
      // Enrich items with product info
      const products = (itemsRes.data || []) as any[];
      if (products.length > 0) {
        const productIds = [...new Set(products.map(p => p.product_id))];
        const { data: prods } = await supabase.from("item_master").select("id, item_name, item_code").in("id", productIds);
        const prodMap = new Map((prods || []).map((p: any) => [p.id, p]));
        setItems(products.map(item => ({
          ...item,
          product_name: prodMap.get(item.product_id)?.item_name || "—",
          product_code: prodMap.get(item.product_id)?.item_code || "",
        })));
      }
      const paid = ((allocRes.data as any[]) || []).reduce((s: number, a: any) => s + Number(a.allocated_amount || 0), 0);
      setPaidAmount(paid);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!invoice) return (
    <div className="p-6">
      <p className="text-muted-foreground">Invoice not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/sales")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
    </div>
  );

  const dueAmount = Math.max(0, invoice.net_amount - paidAmount);
  const statusColor = invoice.status === "approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    : invoice.status === "cancelled" ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

  const paymentBadge = dueAmount <= 0
    ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">PAID</Badge>
    : paidAmount > 0
    ? <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">PARTIAL</Badge>
    : <Badge variant="destructive">UNPAID</Badge>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sales")}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Invoice {invoice.invoice_number}</h1>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {invoice.status}
          </span>
          {paymentBadge}
        </div>
        <Button size="sm" onClick={() => setPrintOpen(true)}><Printer className="w-4 h-4 mr-1" />Print / PDF</Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Invoice #</span><span className="font-medium font-mono">{invoice.invoice_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{invoice.invoice_date}</span></div>
            {branchName && <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span className="font-medium">{branchName}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{invoice.status}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{customerName || "Walk-in"}</span></div>
            {customerInfo?.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{customerInfo.phone}</span></div>}
            {customerInfo?.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{customerInfo.email}</span></div>}
            {customerInfo?.address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{customerInfo.address}</span></div>}
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell><span className="font-mono text-xs text-muted-foreground">{item.product_code}</span> — {item.product_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(item.quantity).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(item.price)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(item.discount)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fc(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{fc(invoice.total_amount)}</span></div>
            {invoice.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="tabular-nums text-destructive">-{fc(invoice.discount)}</span></div>}
            <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Net Amount</span><span className="tabular-nums">{fc(invoice.net_amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums text-emerald-600">{fc(paidAmount)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span className="flex items-center gap-2">Balance Due {paymentBadge}</span>
              <span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{fc(dueAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground italic">Notes: {invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Print */}
      {printOpen && (
        <PrintLayout
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          title="Sales Invoice"
          docNumber={invoice.invoice_number}
          docDate={invoice.invoice_date}
          branch={branchName || undefined}
          partyLabel="Customer"
          partyName={customerName || undefined}
          partyEmail={customerInfo?.email}
          notes={invoice.notes || undefined}
        >
          {customerInfo && (
            <div style={{ marginBottom: "12px", fontSize: "12px", color: "#1a1a1a" }}>
              {customerInfo.phone && <div>Phone: {customerInfo.phone}</div>}
              {customerInfo.email && <div>Email: {customerInfo.email}</div>}
              {customerInfo.address && <div>Address: {customerInfo.address}</div>}
            </div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <thead>
              <tr>
                {["#", "Product", "Qty", "Rate", "Discount", "Amount"].map((h, i) => (
                  <th key={h} style={{ background: "#f0f0f0", fontWeight: 600, textAlign: i >= 2 ? "right" : "left", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{idx + 1}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{item.product_code} — {item.product_name}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{Number(item.quantity).toFixed(2)}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(item.price)}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(item.discount)}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 600 }}>{fc(item.total)}</td>
                </tr>
              ))}
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>Subtotal</td>
                <td style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(invoice.total_amount)}</td>
              </tr>
              {invoice.discount > 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>Discount</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>({fc(invoice.discount)})</td>
                </tr>
              )}
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>Net Amount</td>
                <td style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(invoice.net_amount)}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>Paid</td>
                <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", color: "#166534" }}>{fc(paidAmount)}</td>
              </tr>
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>
                  Balance Due
                  {dueAmount <= 0 && <span style={{ marginLeft: "8px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>PAID</span>}
                  {dueAmount > 0 && paidAmount > 0 && <span style={{ marginLeft: "8px", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>PARTIAL</span>}
                  {dueAmount > 0 && paidAmount === 0 && <span style={{ marginLeft: "8px", background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>UNPAID</span>}
                </td>
                <td style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right", color: dueAmount > 0 ? "#991b1b" : "#166534" }}>{fc(dueAmount)}</td>
              </tr>
            </tbody>
          </table>
        </PrintLayout>
      )}
    </div>
  );
};

export default SalesInvoiceDetailPage;
