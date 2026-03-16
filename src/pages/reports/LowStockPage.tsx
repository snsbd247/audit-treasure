import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { ReportHeader } from "@/components/ReportHeader";

const LowStockPage = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [prodRes, movRes] = await Promise.all([
        supabase.from("products").select("*").eq("status", "active"),
        supabase.from("stock_movements").select("product_id, movement_type, quantity"),
      ]);
      const movements = movRes.data || [];
      const stockMap: Record<string, number> = {};
      movements.forEach((m) => {
        const q = Number(m.quantity);
        if (!stockMap[m.product_id]) stockMap[m.product_id] = 0;
        if (["purchase_in", "production_in", "sales_return_in"].includes(m.movement_type)) stockMap[m.product_id] += q;
        else stockMap[m.product_id] -= q;
      });
      const lowStock = (prodRes.data || [])
        .map((p) => ({ ...p, stock: stockMap[p.id] || 0 }))
        .filter((p) => p.stock <= p.low_stock_threshold)
        .sort((a, b) => a.stock - b.stock);
      setProducts(lowStock);
    })();
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" />Low Stock Alerts
      </h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.product_code}</TableCell>
                  <TableCell className="font-medium">{p.product_name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={p.stock <= 0 ? "text-destructive font-bold" : "text-warning font-medium"}>{p.stock}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.low_stock_threshold}</TableCell>
                </TableRow>
              ))}
              {products.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">All products are above stock threshold</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockPage;
