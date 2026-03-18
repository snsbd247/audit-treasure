import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrintLayout } from "@/components/PrintLayout";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Receipt, Download, Building2, User, FileText, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceData {
  id: string; invoice_number: string; invoice_date: string; customer_id: string | null;
  total_amount: number; discount: number; net_amount: number; status: string; notes: string | null;
  branch_id: string | null;
}

// Default VAT rate (can be overridden per item in future)
const DEFAULT_VAT_RATE = 0; // Set to 15 for Bangladesh 15% VAT, 0 for no VAT

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
      const products = (itemsRes.data || []) as any[];
      if (products.length > 0) {
        const productIds = [...new Set(products.map(p => p.product_id))];
        const { data: prods } = await supabase.from("item_master").select("id, item_name, item_code").in("id", productIds);
        const prodMap = new Map((prods || []).map((p: any) => [p.id, p]));
        setItems(products.map(item => ({
          ...item,
          product_name: prodMap.get(item.product_id)?.item_name || "—",
          product_code: prodMap.get(item.product_id)?.item_code || "",
          vat_rate: item.vat_rate ?? DEFAULT_VAT_RATE,
        })));
      }
      const paid = ((allocRes.data as any[]) || []).reduce((s: number, a: any) => s + Number(a.allocated_amount || 0), 0);
      setPaidAmount(paid);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 gap-6"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );

  if (!invoice) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground text-lg">Invoice not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/sales")}><ArrowLeft className="w-4 h-4 mr-1" />Back to Sales</Button>
    </div>
  );

  // VAT calculations
  const itemsWithVat = items.map(item => {
    const vatRate = item.vat_rate || 0;
    const lineTotal = Number(item.total) || 0;
    const vatAmount = lineTotal * (vatRate / 100);
    return { ...item, vatRate, vatAmount, lineTotalWithVat: lineTotal + vatAmount };
  });
  const subtotal = invoice.total_amount;
  const totalVat = itemsWithVat.reduce((s, i) => s + i.vatAmount, 0);
  const grandTotal = invoice.net_amount + totalVat;
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  const getPaymentStatus = () => {
    if (dueAmount <= 0) return { label: "PAID", variant: "success" as const };
    if (paidAmount > 0) return { label: "PARTIAL", variant: "warning" as const };
    return { label: "UNPAID", variant: "destructive" as const };
  };
  const payStatus = getPaymentStatus();

  const statusBadgeClass = payStatus.variant === "success"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
    : payStatus.variant === "warning"
    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";

  const docStatusClass = invoice.status === "approved"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : invoice.status === "cancelled"
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

  // Print content builder
  const renderPrintTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
      <thead>
        <tr>
          {["#", "Product", "Qty", "Rate", "Discount", ...(totalVat > 0 ? ["VAT %", "VAT Amt"] : []), "Amount"].map((h, i) => (
            <th key={h} style={{ background: "#f8fafc", fontWeight: 600, textAlign: i >= 2 ? "right" : "left", padding: "10px 12px", borderBottom: "2px solid #e2e8f0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#475569" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {itemsWithVat.map((item, idx) => (
          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: "8px 12px", color: "#64748b" }}>{idx + 1}</td>
            <td style={{ padding: "8px 12px" }}><strong>{item.product_name}</strong><br /><span style={{ fontSize: "10px", color: "#94a3b8" }}>{item.product_code}</span></td>
            <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(item.quantity).toFixed(2)}</td>
            <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fc(item.price)}</td>
            <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fc(item.discount)}</td>
            {totalVat > 0 && <>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>{item.vatRate}%</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fc(item.vatAmount)}</td>
            </>}
            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fc(totalVat > 0 ? item.lineTotalWithVat : item.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPrintSummary = () => (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
      <div style={{ width: "280px", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ color: "#64748b" }}>Subtotal</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fc(subtotal)}</span>
        </div>
        {invoice.discount > 0 && (
          <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ color: "#64748b" }}>Discount</span><span style={{ color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>-{fc(invoice.discount)}</span>
          </div>
        )}
        {totalVat > 0 && (
          <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ color: "#64748b" }}>VAT Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fc(totalVat)}</span>
          </div>
        )}
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", background: "#f8fafc", fontWeight: 700, fontSize: "14px", borderBottom: "1px solid #e2e8f0" }}>
          <span>Grand Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fc(grandTotal)}</span>
        </div>
        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ color: "#16a34a" }}>Paid</span><span style={{ color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>{fc(paidAmount)}</span>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            Balance Due
            <span style={{
              padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 600,
              background: payStatus.variant === "success" ? "#dcfce7" : payStatus.variant === "warning" ? "#fef3c7" : "#fee2e2",
              color: payStatus.variant === "success" ? "#166534" : payStatus.variant === "warning" ? "#92400e" : "#991b1b",
            }}>{payStatus.label}</span>
          </span>
          <span style={{ color: dueAmount > 0 ? "#dc2626" : "#16a34a", fontVariantNumeric: "tabular-nums" }}>{fc(dueAmount)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate("/sales")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{invoice.invoice_number}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${docStatusClass}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Sales Invoice</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
            <Printer className="w-4 h-4 mr-1.5" />Print
          </Button>
          <Button size="sm" onClick={() => setPrintOpen(true)}>
            <Download className="w-4 h-4 mr-1.5" />PDF
          </Button>
        </div>
      </div>

      {/* Payment Status Banner */}
      <div className={`flex items-center justify-between px-5 py-3.5 rounded-xl border ${statusBadgeClass}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${payStatus.variant === "success" ? "bg-emerald-500" : payStatus.variant === "warning" ? "bg-amber-500" : "bg-red-500"}`} />
          <span className="font-semibold text-sm">
            {payStatus.label === "PAID" ? "Fully Paid" : payStatus.label === "PARTIAL" ? "Partially Paid" : "Payment Due"}
          </span>
        </div>
        <span className="font-bold text-lg tabular-nums">{fc(dueAmount)} due</span>
      </div>

      {/* Company & Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From (Company) */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</span>
            </div>
            <div className="space-y-1">
              {settings?.company_logo_url && (
                <img src={settings.company_logo_url} alt="Logo" className="h-10 mb-2" />
              )}
              <p className="font-semibold text-foreground">{settings?.company_name || "Company"}</p>
              {settings?.address && <p className="text-sm text-muted-foreground">{settings.address}</p>}
              <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                {settings?.phone && <span>📞 {settings.phone}</span>}
                {settings?.email && <span>✉ {settings.email}</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* To (Customer) */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bill To</span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{customerName || "Walk-in Customer"}</p>
              {customerInfo?.address && <p className="text-sm text-muted-foreground">{customerInfo.address}</p>}
              <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                {customerInfo?.phone && <span>📞 {customerInfo.phone}</span>}
                {customerInfo?.email && <span>✉ {customerInfo.email}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Meta */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice No</span>
              </div>
              <p className="font-semibold font-mono text-foreground">{invoice.invoice_number}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</span>
              </div>
              <p className="font-semibold text-foreground">{invoice.invoice_date}</p>
            </div>
            {branchName && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Branch</span>
                </div>
                <p className="font-semibold text-foreground">{branchName}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
              <Badge className={`${docStatusClass} text-[10px]`}>{invoice.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 font-semibold">#</TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="text-right font-semibold">Qty</TableHead>
                <TableHead className="text-right font-semibold">Rate</TableHead>
                <TableHead className="text-right font-semibold">Discount</TableHead>
                {totalVat > 0 && <>
                  <TableHead className="text-right font-semibold">VAT %</TableHead>
                  <TableHead className="text-right font-semibold">VAT Amt</TableHead>
                </>}
                <TableHead className="text-right font-semibold">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsWithVat.map((item, i) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-muted-foreground font-mono text-xs">{String(i + 1).padStart(2, '0')}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium text-foreground">{item.product_name}</span>
                      <span className="block text-xs text-muted-foreground font-mono">{item.product_code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Number(item.quantity).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(item.price)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(item.discount)}</TableCell>
                  {totalVat > 0 && <>
                    <TableCell className="text-right tabular-nums">{item.vatRate}%</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(item.vatAmount)}</TableCell>
                  </>}
                  <TableCell className="text-right tabular-nums font-semibold">{fc(totalVat > 0 ? item.lineTotalWithVat : item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary Box */}
      <div className="flex justify-end">
        <Card className="border-0 shadow-sm w-full max-w-sm">
          <CardContent className="p-0 divide-y divide-border">
            <div className="flex justify-between px-5 py-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-medium">{fc(subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums font-medium text-destructive">-{fc(invoice.discount)}</span>
              </div>
            )}
            {totalVat > 0 && (
              <div className="flex justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">VAT Total</span>
                <span className="tabular-nums font-medium">{fc(totalVat)}</span>
              </div>
            )}
            <div className="flex justify-between px-5 py-3.5 bg-muted/50">
              <span className="font-bold">Grand Total</span>
              <span className="tabular-nums font-bold text-lg">{fc(grandTotal)}</span>
            </div>
            <div className="flex justify-between px-5 py-3 text-sm">
              <span className="text-emerald-600 font-medium">Paid</span>
              <span className="tabular-nums font-medium text-emerald-600">{fc(paidAmount)}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3.5">
              <span className="font-bold flex items-center gap-2">
                Balance Due
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusBadgeClass}`}>
                  {payStatus.label}
                </span>
              </span>
              <span className={`tabular-nums font-bold text-lg ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>
                {fc(dueAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes & Terms */}
      {invoice.notes && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Terms & Conditions</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Payment is due within the agreed credit terms. Late payments may be subject to additional charges.
            Goods once sold will not be taken back. All disputes are subject to local jurisdiction.
          </p>
        </CardContent>
      </Card>

      {/* Print Preview */}
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
          {renderPrintTable()}
          {renderPrintSummary()}
          <div style={{ fontSize: "10px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "8px" }}>
            <strong>Terms:</strong> Payment is due within the agreed credit terms. Goods once sold will not be taken back.
          </div>
        </PrintLayout>
      )}
    </div>
  );
};

export default SalesInvoiceDetailPage;
