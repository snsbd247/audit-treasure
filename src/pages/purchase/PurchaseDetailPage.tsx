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
import { ArrowLeft, Printer, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchaseData {
  id: string; purchase_number: string; purchase_date: string; supplier_id: string | null;
  total_amount: number; payment_method: string; status: string; notes: string | null;
  branch_id: string | null;
}

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

  if (!purchase) return (
    <div className="p-6">
      <p className="text-muted-foreground">Purchase not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/purchase")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
    </div>
  );

  const dueAmount = Math.max(0, purchase.total_amount - paidAmount);
  const statusColor = purchase.status === "approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    : purchase.status === "cancelled" ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

  const paymentBadge = dueAmount <= 0
    ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">PAID</Badge>
    : paidAmount > 0
    ? <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">PARTIAL</Badge>
    : <Badge variant="destructive">UNPAID</Badge>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/purchase")}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Purchase {purchase.purchase_number}</h1>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {purchase.status}
          </span>
          {paymentBadge}
        </div>
        <Button size="sm" onClick={() => setPrintOpen(true)}><Printer className="w-4 h-4 mr-1" />Print / PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Purchase Details</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Purchase #</span><span className="font-medium font-mono">{purchase.purchase_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{purchase.purchase_date}</span></div>
            {branchName && <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span className="font-medium">{branchName}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium capitalize">{purchase.payment_method}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{purchase.status}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Supplier</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{supplierName || "—"}</span></div>
            {supplierInfo?.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{supplierInfo.phone}</span></div>}
            {supplierInfo?.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{supplierInfo.email}</span></div>}
            {supplierInfo?.address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{supplierInfo.address}</span></div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell><span className="font-mono text-xs text-muted-foreground">{item.product_code}</span> — {item.product_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(item.quantity).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fc(item.unit_price)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fc(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total Amount</span><span className="tabular-nums">{fc(purchase.total_amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums text-emerald-600">{fc(paidAmount)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span className="flex items-center gap-2">Balance Due {paymentBadge}</span>
              <span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{fc(dueAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {purchase.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground italic">Notes: {purchase.notes}</p>
          </CardContent>
        </Card>
      )}

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
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <thead>
              <tr>
                {["#", "Product", "Qty", "Unit Price", "Amount"].map((h, i) => (
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
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(item.unit_price)}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 600 }}>{fc(item.total)}</td>
                </tr>
              ))}
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td colSpan={4} style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>Total Amount</td>
                <td style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(purchase.total_amount)}</td>
              </tr>
              <tr>
                <td colSpan={4} style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>Paid</td>
                <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", color: "#166534" }}>{fc(paidAmount)}</td>
              </tr>
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td colSpan={4} style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>
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

export default PurchaseDetailPage;
