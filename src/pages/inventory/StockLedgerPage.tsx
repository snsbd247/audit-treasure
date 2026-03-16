import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ScrollText } from "lucide-react";

interface LedgerEntry {
  id: string;
  transaction_type: string;
  item_id: string;
  warehouse_id: string | null;
  branch_id: string | null;
  quantity_in: number;
  quantity_out: number;
  balance_quantity: number;
  unit_cost: number;
  total_value: number;
  reference_number: string | null;
  transaction_date: string;
  created_at: string;
}

interface Item { id: string; item_code: string; item_name: string; }
interface Warehouse { id: string; warehouse_name: string; }

export default function StockLedgerPage() {
  const { fc } = useCurrency();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filterItem, setFilterItem] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    const [itemRes, whRes] = await Promise.all([
      supabase.from("item_master").select("id, item_code, item_name").eq("is_stock_item", true),
      supabase.from("warehouses" as any).select("id, warehouse_name"),
    ]);
    if (itemRes.data) setItems(itemRes.data);
    if (whRes.data) setWarehouses(whRes.data as any);

    let query = supabase.from("stock_ledger" as any).select("*").order("transaction_date", { ascending: false }).order("created_at", { ascending: false }).limit(500);
    if (filterItem !== "all") query = query.eq("item_id", filterItem);
    if (filterType !== "all") query = query.eq("transaction_type", filterType);
    if (dateFrom) query = query.gte("transaction_date", dateFrom);
    if (dateTo) query = query.lte("transaction_date", dateTo);

    const { data } = await query;
    if (data) setEntries(data as any);
  }, [filterItem, filterType, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getItemName = (id: string) => items.find(i => i.id === id)?.item_name || "-";
  const getWhName = (id: string | null) => id ? warehouses.find(w => w.id === id)?.warehouse_name || "-" : "-";

  const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    purchase: "default", sales: "destructive", production_output: "default",
    production_consumption: "destructive", stock_transfer_in: "default",
    stock_transfer_out: "secondary", purchase_return: "secondary",
    sales_return: "default", stock_adjustment: "outline",
  };

  const txTypes = ["purchase", "purchase_return", "sales", "sales_return", "production_consumption", "production_output", "stock_transfer_in", "stock_transfer_out", "stock_adjustment"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Ledger</h1>
        <p className="text-muted-foreground">Complete inventory movement history</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <Label className="text-xs">Item</Label>
              <Select value={filterItem} onValueChange={setFilterItem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.item_code} - {i.item_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {txTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Qty In</TableHead>
                <TableHead className="text-right">Qty Out</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{e.transaction_date}</TableCell>
                  <TableCell className="font-medium text-sm">{getItemName(e.item_id)}</TableCell>
                  <TableCell>
                    <Badge variant={typeColors[e.transaction_type] || "outline"} className="text-xs capitalize">
                      {e.transaction_type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.reference_number || "-"}</TableCell>
                  <TableCell className="text-sm">{getWhName(e.warehouse_id)}</TableCell>
                  <TableCell className="text-right font-mono text-success">{e.quantity_in > 0 ? `+${e.quantity_in}` : ""}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{e.quantity_out > 0 ? `-${e.quantity_out}` : ""}</TableCell>
                  <TableCell className="text-right font-bold">{e.balance_quantity}</TableCell>
                  <TableCell className="text-right text-sm">{fc(e.total_value)}</TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No stock ledger entries</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
