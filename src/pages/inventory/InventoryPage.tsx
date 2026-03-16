import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Warehouse, AlertTriangle, Package } from "lucide-react";

interface Product {
  id: string; product_name: string; product_code: string;
  unit: string; low_stock_threshold: number; category_name?: string; item_type?: string;
}

interface StockSummary {
  product_id: string; total_qty: number;
}

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("current");

  const fetchData = async () => {
    setLoading(true);
    const [pRes, smRes, cRes] = await Promise.all([
      supabase.from("item_master").select("*").eq("status", "active").order("item_name"),
      supabase.from("stock_movements").select("product_id, quantity"),
      supabase.from("item_categories").select("*"),
    ]);

    const cats = (cRes.data || []) as any[];
    const prods = (pRes.data || []).map((p: any) => ({
      id: p.id,
      product_name: p.item_name,
      product_code: p.item_code,
      unit: "pcs",
      low_stock_threshold: p.min_stock_level,
      item_type: p.item_type,
      category_name: cats.find((c: any) => c.id === p.category_id)?.name,
    })) as Product[];
    setProducts(prods);

    // Aggregate stock
    const map = new Map<string, number>();
    (smRes.data || []).forEach((m: any) => {
      map.set(m.product_id, (map.get(m.product_id) || 0) + Number(m.quantity));
    });
    setStockMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const lowStockProducts = products.filter((p) => {
    const qty = stockMap.get(p.id) || 0;
    return qty <= p.low_stock_threshold;
  });

  const totalProducts = products.length;
  const totalStock = Array.from(stockMap.values()).reduce((s, v) => s + v, 0);
  const lowStockCount = lowStockProducts.length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Warehouse className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{totalProducts}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Units</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{totalStock.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-warning">{lowStockCount}</div></CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="current">Current Stock</TabsTrigger>
          <TabsTrigger value="low">Low Stock Alert</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : products.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No products</TableCell></TableRow>
                  ) : products.map((p) => {
                    const qty = stockMap.get(p.id) || 0;
                    const isLow = qty <= p.low_stock_threshold;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.product_name}</TableCell>
                        <TableCell className="font-geist-mono text-xs">{p.product_code}</TableCell>
                        <TableCell className="text-muted-foreground">{p.category_name || "—"}</TableCell>
                        <TableCell>{p.unit}</TableCell>
                        <TableCell className={`text-right tabular-nums font-medium ${isLow ? "text-destructive" : ""}`}>
                          {qty.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{p.low_stock_threshold}</TableCell>
                        <TableCell>
                          {isLow ? (
                            <Badge variant="destructive" className="text-xs">Low</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                    <TableHead className="text-right">Shortfall</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No low stock items 🎉</TableCell></TableRow>
                  ) : lowStockProducts.map((p) => {
                    const qty = stockMap.get(p.id) || 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.product_name}</TableCell>
                        <TableCell className="font-geist-mono text-xs">{p.product_code}</TableCell>
                        <TableCell className="text-right tabular-nums text-destructive font-medium">{qty.toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.low_stock_threshold}</TableCell>
                        <TableCell className="text-right tabular-nums text-destructive">
                          {Math.max(0, p.low_stock_threshold - qty).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryPage;
