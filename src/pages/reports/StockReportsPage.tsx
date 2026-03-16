import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart3, AlertTriangle, Printer } from "lucide-react";
import { ReportHeader } from "@/components/ReportHeader";
import { useCurrency } from "@/contexts/CurrencyContext";

interface WH { id: string; warehouse_name: string; warehouse_code: string; branch_id: string | null; }
interface Item { id: string; item_code: string; item_name: string; item_type: string; min_stock_level: number; }
interface WHStock { id: string; item_id: string; warehouse_id: string; quantity: number; }
interface Branch { id: string; name: string; }
interface StockMovement {
  id: string; product_id: string; item_id: string | null; warehouse_id: string | null;
  branch_id: string | null; movement_type: string; quantity: number; created_at: string;
  reference_type: string | null;
}

const StockReportsPage = () => {
  const [tab, setTab] = useState("summary");
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stock, setStock] = useState<WHStock[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filterWH, setFilterWH] = useState("__all__");
  const [filterBranch, setFilterBranch] = useState("__all__");
  const [loading, setLoading] = useState(true);
  const { fc } = useCurrency();

  useEffect(() => {
    const init = async () => {
      const [wRes, iRes, sRes, bRes, mRes] = await Promise.all([
        supabase.from("warehouses").select("*").order("warehouse_name"),
        supabase.from("item_master").select("*").order("item_name"),
        supabase.from("warehouse_stock").select("*"),
        supabase.from("branches").select("id, name"),
        supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(1000),
      ]);
      setWarehouses((wRes.data || []) as any);
      setItems((iRes.data || []) as any);
      setStock((sRes.data || []) as any);
      setBranches((bRes.data || []) as Branch[]);
      setMovements((mRes.data || []) as any);
      setLoading(false);
    };
    init();
  }, []);

  const whMap = new Map(warehouses.map((w) => [w.id, w]));
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Stock In/Out breakdown per item
  const stockBreakdown = useMemo(() => {
    const map = new Map<string, { stockIn: number; stockOut: number; itemId: string }>();
    movements.forEach((m) => {
      const key = m.item_id || m.product_id;
      if (!key) return;
      const cur = map.get(key) || { stockIn: 0, stockOut: 0, itemId: key };
      if (m.quantity > 0) cur.stockIn += m.quantity;
      else cur.stockOut += Math.abs(m.quantity);
      map.set(key, cur);
    });
    return map;
  }, [movements]);

  // Filter stock by warehouse and branch
  const filteredStock = useMemo(() => {
    let filtered = stock;
    if (filterWH !== "__all__") filtered = filtered.filter((s) => s.warehouse_id === filterWH);
    if (filterBranch !== "__all__") {
      const branchWHs = new Set(warehouses.filter((w) => w.branch_id === filterBranch).map((w) => w.id));
      filtered = filtered.filter((s) => branchWHs.has(s.warehouse_id));
    }
    return filtered;
  }, [stock, filterWH, filterBranch, warehouses]);

  // Aggregate item totals
  const itemStockMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredStock.forEach((s) => {
      map.set(s.item_id, (map.get(s.item_id) || 0) + s.quantity);
    });
    return map;
  }, [filteredStock]);

  // Low Stock
  const lowStockItems = items.filter((i) => {
    const totalQty = itemStockMap.get(i.id) || 0;
    return i.min_stock_level > 0 && totalQty < i.min_stock_level;
  });

  const typeLabel = (t: string) => {
    const labels: Record<string, string> = { raw_material: "Raw Material", finished_goods: "Finished Goods", product: "Product", service: "Service", consumable: "Consumable" };
    return labels[t] || t;
  };

  const movementTypeLabel = (t: string) => {
    const labels: Record<string, string> = { purchase: "Purchase", sale: "Sale", production_in: "Production In", production_out: "Production Out", adjustment: "Adjustment", transfer_in: "Transfer In", transfer_out: "Transfer Out", return_in: "Return In", return_out: "Return Out" };
    return labels[t] || t;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-4">
      <ReportHeader reportTitle="Inventory Reports" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Stock Reports</h1></div>
        <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" />Print</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 flex flex-wrap gap-4 items-end">
          <div className="space-y-1 w-48">
            <Label className="text-xs">Warehouse</Label>
            <Select value={filterWH} onValueChange={setFilterWH}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Warehouses</SelectItem>
                {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-48">
            <Label className="text-xs">Branch</Label>
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Branches</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setFilterWH("__all__"); setFilterBranch("__all__"); }}>Clear</Button>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="summary">Stock Summary</TabsTrigger>
          <TabsTrigger value="warehouse">By Warehouse</TabsTrigger>
          <TabsTrigger value="inout">Stock In/Out</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock Alert</TabsTrigger>
        </TabsList>

        {/* Stock Summary — aggregate by item */}
        <TabsContent value="summary">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Item Code</TableHead><TableHead>Item Name</TableHead><TableHead>Type</TableHead>
                <TableHead className="text-right">Stock In</TableHead>
                <TableHead className="text-right">Stock Out</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Min Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : items.filter((i) => i.item_type !== "service").map((i) => {
                  const totalQty = itemStockMap.get(i.id) || 0;
                  const breakdown = stockBreakdown.get(i.id) || { stockIn: 0, stockOut: 0 };
                  const isLow = i.min_stock_level > 0 && totalQty < i.min_stock_level;
                  return (
                    <TableRow key={i.id} className={isLow ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-xs">{i.item_code}</TableCell>
                      <TableCell className="font-medium">{i.item_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{typeLabel(i.item_type)}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums text-green-600">{breakdown.stockIn > 0 ? `+${breakdown.stockIn}` : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-600">{breakdown.stockOut > 0 ? `-${breakdown.stockOut}` : "—"}</TableCell>
                      <TableCell className={`text-right tabular-nums font-semibold ${isLow ? "text-destructive" : ""}`}>{totalQty}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{i.min_stock_level}</TableCell>
                      <TableCell>{isLow ? <Badge variant="destructive" className="text-xs">Low</Badge> : <Badge variant="outline" className="text-xs">OK</Badge>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* By Warehouse */}
        <TabsContent value="warehouse">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Item Code</TableHead><TableHead>Item Name</TableHead><TableHead>Warehouse</TableHead>
                <TableHead>Branch</TableHead><TableHead className="text-right">Quantity</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : filteredStock.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No stock data</TableCell></TableRow>
                : filteredStock.map((s) => {
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

        {/* Stock In/Out Movements */}
        <TabsContent value="inout">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Movement Type</TableHead>
                <TableHead>Warehouse</TableHead><TableHead>Reference</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : movements.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No movements</TableCell></TableRow>
                : movements.slice(0, 200).map((m) => {
                  const item = itemMap.get(m.item_id || "") || itemMap.get(m.product_id);
                  const wh = whMap.get(m.warehouse_id || "");
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{item?.item_name || m.product_id?.slice(0, 8) || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={m.quantity > 0 ? "default" : "destructive"} className="text-xs">
                          {movementTypeLabel(m.movement_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{wh?.warehouse_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.reference_type || "—"}</TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${m.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Low Stock */}
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
