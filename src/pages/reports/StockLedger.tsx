import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search } from "lucide-react";

interface Product { id: string; product_name: string; product_code: string; }
interface Branch { id: string; name: string; }

const StockLedger = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [filterProduct, setFilterProduct] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [pRes, bRes] = await Promise.all([
        supabase.from("products").select("id, product_name, product_code").order("product_name"),
        supabase.from("branches").select("id, name"),
      ]);
      setProducts((pRes.data || []) as Product[]);
      setBranches((bRes.data || []) as Branch[]);
    };
    init();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    let query = supabase.from("stock_movements").select("*").order("created_at", { ascending: true });
    if (filterProduct && filterProduct !== "__all__") query = query.eq("product_id", filterProduct);
    if (filterBranch && filterBranch !== "__all__") query = query.eq("branch_id", filterBranch);

    const { data } = await query;
    const prodMap = new Map(products.map((p) => [p.id, p]));
    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    let runBal = 0;
    const mapped = (data || []).map((m: any) => {
      const qty = Number(m.quantity);
      runBal += qty;
      return {
        ...m,
        product_name: prodMap.get(m.product_id)?.product_name || "—",
        product_code: prodMap.get(m.product_id)?.product_code || "—",
        branch_name: branchMap.get(m.branch_id) || "—",
        qty_in: qty > 0 ? qty : 0,
        qty_out: qty < 0 ? Math.abs(qty) : 0,
        balance: runBal,
      };
    });
    setMovements(mapped);
    setLoading(false);
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "Purchase", purchase_return: "Purchase Return", sale: "Sale", sale_return: "Sales Return",
      production_in: "Production In", production_out: "Production Out", adjustment: "Adjustment",
    };
    return labels[type] || type;
  };

  const typeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    if (type.includes("return") || type === "production_out" || type === "sale") return "destructive";
    return "default";
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Stock Ledger</h1></div>

      <div className="flex gap-4 items-end flex-wrap">
        <div className="space-y-2 w-52"><Label>Product</Label>
          <Select value={filterProduct} onValueChange={setFilterProduct}><SelectTrigger><SelectValue placeholder="All products" /></SelectTrigger>
            <SelectContent><SelectItem value="__all__">All</SelectItem>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2 w-48"><Label>Branch</Label>
          <Select value={filterBranch} onValueChange={setFilterBranch}><SelectTrigger><SelectValue placeholder="All branches" /></SelectTrigger>
            <SelectContent><SelectItem value="__all__">All</SelectItem>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>From</Label><Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} /></div>
        <div className="space-y-2"><Label>To</Label><Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} /></div>
        <Button size="sm" onClick={fetchMovements}><Search className="w-4 h-4 mr-1" />View</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Product</TableHead><TableHead>Type</TableHead><TableHead>Reference</TableHead>
            <TableHead className="text-right">Qty In</TableHead><TableHead className="text-right">Qty Out</TableHead>
            <TableHead className="text-right">Balance</TableHead><TableHead>Branch</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : movements.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Select filters and click View</TableCell></TableRow>
            : movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{m.product_name}</TableCell>
                <TableCell><Badge variant={typeVariant(m.movement_type)} className="text-xs">{typeLabel(m.movement_type)}</Badge></TableCell>
                <TableCell className="font-geist-mono text-xs text-muted-foreground">{m.reference_type || "—"}</TableCell>
                <TableCell className="text-right tabular-nums text-green-700">{m.qty_in > 0 ? m.qty_in : ""}</TableCell>
                <TableCell className="text-right tabular-nums text-destructive">{m.qty_out > 0 ? m.qty_out : ""}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{m.balance}</TableCell>
                <TableCell className="text-muted-foreground">{m.branch_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};
export default StockLedger;
