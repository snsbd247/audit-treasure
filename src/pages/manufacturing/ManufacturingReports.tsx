import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart3, Search } from "lucide-react";
import { ReportHeader } from "@/components/ReportHeader";
import { useCurrency } from "@/contexts/CurrencyContext";

const ManufacturingReports = () => {
  const [tab, setTab] = useState("production");
  const { fc } = useCurrency();
  const [productions, setProductions] = useState<any[]>([]);
  const [consumptions, setConsumptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    let prodQuery = supabase.from("production_entries").select("*").order("production_date", { ascending: false });
    if (dateFrom) prodQuery = prodQuery.gte("production_date", dateFrom);
    if (dateTo) prodQuery = prodQuery.lte("production_date", dateTo);
    const { data: prodData } = await prodQuery;

    // Get product names from item_master
    const { data: products } = await supabase.from("item_master").select("id, item_name");
    const prodMap = new Map((products || []).map((p: any) => [p.id, p.item_name]));

    setProductions((prodData || []).map((p: any) => ({ ...p, product_name: prodMap.get(p.product_id) || "—" })));

    // Material consumption
    const { data: matData } = await supabase.from("production_materials").select("*, production_entries!inner(production_date, production_number)");
    const { data: mats } = await supabase.from("item_master").select("id, item_name, item_code").eq("item_type", "raw_material");
    const matMap = new Map((mats || []).map((m: any) => [m.id, { material_name: m.item_name, material_code: m.item_code }]));

    setConsumptions((matData || []).map((c: any) => ({
      ...c,
      material_name: matMap.get(c.material_id)?.material_name || "—",
      material_code: matMap.get(c.material_id)?.material_code || "—",
      production_number: c.production_entries?.production_number,
      production_date: c.production_entries?.production_date,
    })));

    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const totalProdCost = productions.reduce((s, p) => s + Number(p.total_cost), 0);
  const totalMatCost = productions.reduce((s, p) => s + Number(p.raw_material_cost), 0);
  const totalLabor = productions.reduce((s, p) => s + Number(p.labor_cost), 0);

  return (
    <div className="p-6 space-y-4">
      <ReportHeader reportTitle="Manufacturing & Production Reports" />
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Manufacturing Reports</h1>
      </div>

      <div className="flex gap-4 items-end">
        <div className="space-y-2"><Label>From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
        <div className="space-y-2"><Label>To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
        <Button onClick={fetchReports} size="sm"><Search className="w-4 h-4 mr-1" />Filter</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Production Cost</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{fc(totalProdCost)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Material Cost</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{fc(totalMatCost)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Labor Cost</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{fc(totalLabor)}</div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="production">Production Report</TabsTrigger>
          <TabsTrigger value="consumption">Material Consumption</TabsTrigger>
          <TabsTrigger value="cost">Production Cost</TabsTrigger>
        </TabsList>

        <TabsContent value="production">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Production #</TableHead><TableHead>Date</TableHead><TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Total Cost</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                : productions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-geist-mono text-xs">{p.production_number}</TableCell>
                    <TableCell>{p.production_date}</TableCell>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fc(Number(p.total_cost))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="consumption">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Production #</TableHead><TableHead>Date</TableHead><TableHead>Material</TableHead>
                <TableHead className="text-right">Qty Used</TableHead><TableHead className="text-right">Cost</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {consumptions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-geist-mono text-xs">{c.production_number}</TableCell>
                    <TableCell>{c.production_date}</TableCell>
                    <TableCell className="font-medium">{c.material_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(c.quantity)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(Number(c.cost))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="cost">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Production #</TableHead><TableHead>Product</TableHead>
                <TableHead className="text-right">Material</TableHead><TableHead className="text-right">Labor</TableHead>
                <TableHead className="text-right">Electricity</TableHead><TableHead className="text-right">Total</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {productions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-geist-mono text-xs">{p.production_number}</TableCell>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(Number(p.raw_material_cost))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(Number(p.labor_cost))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fc(Number(p.electricity_cost))}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fc(Number(p.total_cost))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ManufacturingReports;
