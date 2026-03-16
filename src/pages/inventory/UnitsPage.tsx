import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Ruler, Trash2 } from "lucide-react";

interface Unit { id: string; name: string; abbreviation: string; }

const UnitsPage = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [formName, setFormName] = useState("");
  const [formAbbr, setFormAbbr] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchUnits = async () => {
    setLoading(true);
    const { data } = await supabase.from("units" as any).select("*").order("name");
    setUnits((data || []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchUnits(); }, []);

  const openCreate = () => { setEditUnit(null); setFormName(""); setFormAbbr(""); setDialogOpen(true); };
  const openEdit = (u: Unit) => { setEditUnit(u); setFormName(u.name); setFormAbbr(u.abbreviation); setDialogOpen(true); };

  const handleSave = async () => {
    if (!formName.trim() || !formAbbr.trim()) return;
    setSaving(true);
    try {
      if (editUnit) {
        const { error } = await supabase.from("units" as any).update({ name: formName, abbreviation: formAbbr.toUpperCase() } as any).eq("id", editUnit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("units" as any).insert({ name: formName, abbreviation: formAbbr.toUpperCase() } as any);
        if (error) throw error;
      }
      toast({ title: editUnit ? "Unit updated" : "Unit created" });
      setDialogOpen(false);
      fetchUnits();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("units" as any).delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Unit deleted" }); fetchUnits(); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Ruler className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Units of Measurement</h1></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Unit</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Abbreviation</TableHead><TableHead className="w-24">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : units.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No units found</TableCell></TableRow>
            : units.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell><span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{u.abbreviation}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(u.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editUnit ? "Edit Unit" : "Add Unit"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Unit Name *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Kilogram" /></div>
            <div className="space-y-2"><Label>Abbreviation *</Label><Input value={formAbbr} onChange={(e) => setFormAbbr(e.target.value)} placeholder="KG" maxLength={10} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitsPage;
