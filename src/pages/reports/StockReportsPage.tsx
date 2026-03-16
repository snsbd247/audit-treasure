import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart3, AlertTriangle, Search } from "lucide-react";
import { ReportHeader } from "@/components/ReportHeader";

interface WH { id: string; warehouse_name: string; warehouse_code: string; branch_id: string | null; }
interface Item { id: string; item_code: string; item_name: string; item_type: string; min_stock_level: number; }
interface WHStock { id: string; item_id: string; warehouse_id: string; quantity: number; }
interface Branch { id: string; name: string; }

const StockReportsPage = () => {
  const [tab, setTab] = useState("warehouse");
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stock, setStock] = useState<WHStock[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterWH, setFilterWH] = useState("__all__");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [wRes, iRes, sRes, bRes] = await Promise.all([
        supabase.from("warehouses" as any).select("*").order("warehouse_name"),
        supabase.from("item_master" as any).select("*").order("item_name"),
        supabase.from("warehouse_stock" as any).select("*"),
        supabase.from("branches").select("id, name"),
      ]);
      setWarehouses((wRes.data || []) as any);
      setItems((iRes.data || []) as any);
      setStock((sRes.data || []) as any);
      setBranches((bRes.data || []) as Branch[]);
      setLoading(false);
    };
    init();
  }, []);

  const whMap = new Map(warehouses.map((w) => [w.id, w]));
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Warehouse Stock Report
  const warehouseStock = filterWH === "__all__" ? stock : stock.filter((s) => s.warehouse_id === filterWH);

  // Item Stock Report — aggregate across warehouses
  const itemStockMap = new Map<string, number>();
  stock.forEach((s) => {
    itemStockMap.set(s.item_id, (itemStockMap.get(s.item_id) || 0) + s.quantity);
  });

  // Low Stock
  const lowStockItems = items.filter((i) => {
    const totalQty = itemStockMap.get(i.id) || 0;
    return i.min_stock_level > 0 && totalQty < i.min_stock_level;
  });

  const typeLabel = (t: string) => {
    const labels: Record<string, string> = { raw_material: "Raw Material", finished_goods: "Finished Goods", product: "Product", service: "Service", consumable: "Consumable" };
    return labels[t] || t;
  };

  return (
    <div className="p-6 space-y-4">
      <ReportHeader reportTitle="Inventory Reports" />
      <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Stock Reports</h1></div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="warehouse">Warehouse Stock</TabsTrigger>
          <TabsTrigger value="item">Item Stock</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock Alert</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouse">
          <div className="flex gap-3 items-end mb-4">
            <div className="space-y-2 w-52"><Label>Warehouse</Label>
              <Select value={filterWH} onValueChange={setFilterWH}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Warehouses</SelectItem>
                  {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Item Code</TableHead><TableHead>Item Name</TableHead><TableHead>Warehouse</TableHead>
                <TableHead>Branch</TableHead><TableHead className="text-right">Quantity</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : warehouseStock.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No stock data</TableCell></TableRow>
                : warehouseStock.map((s) => {
                  const item = itemMap.get(s.item_id);
                  const wh = whMap.get(s.warehouse_id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{item?.item_code || "—"}</TableCell>
                      <TableCell className="font-medium">{item?.item_name || "—"}</TableCell>
                      <TableCell>{wh?.warehouse_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{branchMap.get(wh?.branch_id || "") || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{s.quantity}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="item">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Item Code</TableHead><TableHead>Item Name</TableHead><TableHead>Type</TableHead>
                <TableHead className="text-right">Total Stock</TableHead><TableHead className="text-right">Min Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.filter((i) => i.item_type !== "service").map((i) => {
                  const totalQty = itemStockMap.get(i.id) || 0;
                  const isLow = i.min_stock_level > 0 && totalQty < i.min_stock_level;
                  return (
                    <TableRow key={i.id} className={isLow ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-xs">{i.item_code}</TableCell>
                      <TableCell className="font-medium">{i.item_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{typeLabel(i.item_type)}</Badge></TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${isLow ? "text-destructive" : ""}`}>{totalQty}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{i.min_stock_level}</TableCell>
                      <TableCell>{isLow ? <Badge variant="destructive" className="text-xs">Low</Badge> : <Badge variant="outline" className="text-xs">OK</Badge>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="lowstock">
          {lowStockItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">All items are above minimum stock levels.</CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead></TableHead><TableHead>Item Code</TableHead><TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead><TableHead className="text-right">Min Level</TableHead>
                  <TableHead className="text-right">Shortage</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {lowStockItems.map((i) => {
                    const totalQty = itemStockMap.get(i.id) || 0;
                    return (
                      <TableRow key={i.id} className="bg-destructive/5">
                        <TableCell><AlertTriangle className="w-4 h-4 text-destructive" /></TableCell>
                        <TableCell className="font-mono text-xs">{i.item_code}</TableCell>
                        <TableCell className="font-medium">{i.item_name}</TableCell>
                        <TableCell className="text-right tabular-nums text-destructive font-medium">{totalQty}</TableCell>
                        <TableCell className="text-right tabular-nums">{i.min_stock_level}</TableCell>
                        <TableCell className="text-right tabular-nums text-destructive font-bold">{i.min_stock_level - totalQty}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockReportsPage;
