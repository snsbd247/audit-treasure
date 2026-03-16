import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Dept { id: string; name: string; description: string | null; status: string; created_at: string; }

export default function DepartmentsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Dept[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("departments" as any).select("*").order("name");
    if (data) setItems(data as any);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const payload: any = { name, description: description || null, updated_at: new Date().toISOString() };
    if (editId) {
      const { error } = await supabase.from("departments" as any).update(payload).eq("id", editId);
      if (error) toast.error(error.message); else { toast.success("Updated"); setDialogOpen(false); fetch(); }
    } else {
      const { error } = await supabase.from("departments" as any).insert(payload);
      if (error) toast.error(error.message); else { toast.success("Created"); setDialogOpen(false); fetch(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("departments" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetch(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Departments</h1><p className="text-muted-foreground">Manage departments</p></div>
        {isAdmin && <Button onClick={() => { setEditId(null); setName(""); setDescription(""); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Department</Button>}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
            <TableBody>
              {items.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground">{d.description || "-"}</TableCell>
                  <TableCell><Badge variant="default" className="capitalize">{d.status}</Badge></TableCell>
                  {isAdmin && (
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditId(d.id); setName(d.name); setDescription(d.description || ""); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No departments</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Department</DialogTitle></DialogHeader>
          <div className="space-y-4"><div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div><div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
