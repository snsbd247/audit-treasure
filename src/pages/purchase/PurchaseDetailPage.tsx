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
import { ArrowLeft, Printer, Download, Building2, User, FileText, CalendarDays, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchaseData {
  id: string; purchase_number: string; purchase_date: string; supplier_id: string | null;
  total_amount: number; payment_method: string; status: string; notes: string | null;
  branch_id: string | null;
}

const DEFAULT_VAT_RATE = 0;

const PurchaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fc } = useCurrency();
  const { settings } = useCompanySettings();
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [supplierInfo, setSupplierInfo] = useState<any>(null);
  const [branchName, setBranchName] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [purRes, itemsRes, allocRes] = await Promise.all([
        supabase.from("purchases").select("*").eq("id", id).single(),
        supabase.from("purchase_items").select("*").eq("purchase_id", id),
        supabase.from("payment_allocations" as any).select("allocated_amount").eq("invoice_id", id).eq("invoice_type", "purchase"),
      ]);
      if (purRes.data) {
        setPurchase(purRes.data as any);
        if (purRes.data.supplier_id) {
          const { data: sup } = await supabase.from("suppliers").select("*").eq("id", purRes.data.supplier_id).single();
          if (sup) { setSupplierName(sup.name); setSupplierInfo(sup); }
        }
        if (purRes.data.branch_id) {
          const { data: br } = await supabase.from("branches").select("name").eq("id", purRes.data.branch_id).single();
          if (br) setBranchName(br.name);
        }
      }
      const prodItems = (itemsRes.data || []) as any[];
      if (prodItems.length > 0) {
        const productIds = [...new Set(prodItems.map(p => p.product_id))];
        const { data: prods } = await supabase.from("item_master").select("id, item_name, item_code").in("id", productIds);
        const prodMap = new Map((prods || []).map((p: any) => [p.id, p]));
        setItems(prodItems.map(item => ({
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

  if (!purchase) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground text-lg">Purchase not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/purchase")}><ArrowLeft className="w-4 h-4 mr-1" />Back to Purchases</Button>
    </div>
  );

  const itemsWithVat = items.map(item => {
    const vatRate = item.vat_rate || 0;
    const lineTotal = Number(item.total) || 0;
    const vatAmount = lineTotal * (vatRate / 100);
    return { ...item, vatRate, vatAmount, lineTotalWithVat: lineTotal + vatAmount };
  });
  const subtotal = purchase.total_amount;
  const totalVat = itemsWithVat.reduce((s, i) => s + i.vatAmount, 0);
  const grandTotal = subtotal + totalVat;
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

  const docStatusClass = purchase.status === "approved"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : purchase.status === "cancelled"
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

  const renderPrintTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
      <thead>
        <tr>
          {["#", "Product", "Qty", "Unit Price", ...(totalVat > 0 ? ["VAT %", "VAT Amt"] : []), "Amount"].map((h, i) => (
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
            <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fc(item.unit_price)}</td>
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
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate("/purchase")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{purchase.purchase_number}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${docStatusClass}`}>
                {purchase.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Purchase Invoice</p>
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

      {/* Company & Supplier Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</span>
            </div>
            <div className="space-y-1">
              {settings?.company_logo_url && <img src={settings.company_logo_url} alt="Logo" className="h-10 mb-2" />}
              <p className="font-semibold text-foreground">{settings?.company_name || "Company"}</p>
              {settings?.address && <p className="text-sm text-muted-foreground">{settings.address}</p>}
              <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                {settings?.phone && <span>📞 {settings.phone}</span>}
                {settings?.email && <span>✉ {settings.email}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{supplierName || "—"}</p>
              {supplierInfo?.address && <p className="text-sm text-muted-foreground">{supplierInfo.address}</p>}
              <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                {supplierInfo?.phone && <span>📞 {supplierInfo.phone}</span>}
                {supplierInfo?.email && <span>✉ {supplierInfo.email}</span>}
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
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase No</span>
              </div>
              <p className="font-semibold font-mono text-foreground">{purchase.purchase_number}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</span>
              </div>
              <p className="font-semibold text-foreground">{purchase.purchase_date}</p>
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
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Payment</span>
              <p className="font-semibold capitalize text-foreground">{purchase.payment_method}</p>
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
                <TableHead className="text-right font-semibold">Unit Price</TableHead>
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
                  <TableCell className="text-right tabular-nums">{fc(item.unit_price)}</TableCell>
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

      {purchase.notes && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground">{purchase.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Terms & Conditions</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Payment is due within the agreed credit terms. Late payments may be subject to additional charges.
            All disputes are subject to local jurisdiction.
          </p>
        </CardContent>
      </Card>

      {/* Print */}
      {printOpen && (
        <PrintLayout
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          title="Purchase Invoice"
          docNumber={purchase.purchase_number}
          docDate={purchase.purchase_date}
          branch={branchName || undefined}
          partyLabel="Supplier"
          partyName={supplierName || undefined}
          partyEmail={supplierInfo?.email}
          notes={purchase.notes || undefined}
        >
          {supplierInfo && (
            <div style={{ marginBottom: "12px", fontSize: "12px", color: "#1a1a1a" }}>
              {supplierInfo.phone && <div>Phone: {supplierInfo.phone}</div>}
              {supplierInfo.email && <div>Email: {supplierInfo.email}</div>}
              {supplierInfo.address && <div>Address: {supplierInfo.address}</div>}
            </div>
          )}
          {renderPrintTable()}
          {renderPrintSummary()}
          <div style={{ fontSize: "10px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "8px" }}>
            <strong>Terms:</strong> Payment is due within the agreed credit terms. All disputes are subject to local jurisdiction.
          </div>
        </PrintLayout>
      )}
    </div>
  );
};

export default PurchaseDetailPage;
