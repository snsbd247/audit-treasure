import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart3, Search } from "lucide-react";

const ManufacturingReports = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("production_entries")
      .select("*, product:item_master(item_name)")
      .eq("status", "completed")
      .order("production_date", { ascending: false });

    if (fromDate) query = query.gte("production_date", fromDate);
    if (toDate) query = query.lte("production_date", toDate);

    const { data } = await query;
    setEntries((data || []) as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalCost = entries.reduce((s, e) => s + Number(e.total_cost), 0);
  const totalQty = entries.reduce((s, e) => s + Number(e.quantity), 0);
  const totalLabor = entries.reduce((s, e) => s + Number(e.labor_cost), 0);
  const totalMaterial = entries.reduce((s, e) => s + Number(e.raw_material_cost), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Manufacturing Reports</h1>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-36" />
        </div>
        <Button size="sm" onClick={fetchData} className="h-9"><Search className="w-4 h-4 mr-1" />Filter</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Productions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{entries.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Quantity</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{totalQty.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Material Cost</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{totalMaterial.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Cost</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{totalCost.toFixed(2)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Material</TableHead>
                <TableHead className="text-right">Labor</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : entries.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No completed productions</TableCell></TableRow>
              ) : entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.production_number}</TableCell>
                  <TableCell>{new Date(e.production_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{e.product?.item_name || "—"}</TableCell>
                  <TableCell className="text-right">{Number(e.quantity).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(e.raw_material_cost).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(e.labor_cost).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{Number(e.total_cost).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManufacturingReports;
