import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check } from "lucide-react";

const FinancialYearsPage = () => {
  const [years, setYears] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("financial_years").select("*").order("start_date", { ascending: false });
    setYears(data || []);
  };

  const save = async () => {
    const { error } = await supabase.from("financial_years").insert({ ...form });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Financial year created" });
    setOpen(false);
    setForm({ name: "", start_date: "", end_date: "" });
    load();
  };

  const setActive = async (id: string) => {
    await supabase.from("financial_years").update({ is_active: false }).neq("id", id);
    await supabase.from("financial_years").update({ is_active: true }).eq("id", id);
    toast({ title: "Active year updated" });
    load();
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Financial Years</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Year</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Financial Year</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="FY 2026-27" /></div>
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              <Button onClick={save} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((y) => (
                <TableRow key={y.id}>
                  <TableCell className="font-medium">{y.name}</TableCell>
                  <TableCell>{y.start_date}</TableCell>
                  <TableCell>{y.end_date}</TableCell>
                  <TableCell>
                    {y.is_active ? (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Active</span>
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!y.is_active && (
                      <Button size="sm" variant="outline" onClick={() => setActive(y.id)}>
                        <Check className="w-3 h-3 mr-1" />Set Active
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {years.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No financial years</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialYearsPage;
