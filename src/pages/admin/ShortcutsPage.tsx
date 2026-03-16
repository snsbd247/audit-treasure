import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Keyboard } from "lucide-react";

interface Shortcut {
  id: string;
  shortcut_code: string;
  page_name: string;
  page_url: string;
  module_name: string;
  is_active: boolean;
}

const emptyForm = { shortcut_code: "", page_name: "", page_url: "", module_name: "", is_active: true };

export default function ShortcutsPage() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("page_shortcuts")
      .select("*")
      .order("shortcut_code");
    if (data) setShortcuts(data as Shortcut[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    if (!form.shortcut_code || !form.page_name || !form.page_url || !form.module_name) {
      toast.error("All fields are required");
      return;
    }
    if (editId) {
      const { error } = await supabase
        .from("page_shortcuts")
        .update({ ...form, updated_at: new Date().toISOString() } as any)
        .eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Shortcut updated");
    } else {
      const { error } = await supabase.from("page_shortcuts").insert(form as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Shortcut created");
    }
    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm);
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shortcut?")) return;
    await supabase.from("page_shortcuts").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from("page_shortcuts").update({ is_active: !current } as any).eq("id", id);
    fetch();
  };

  const openEdit = (s: Shortcut) => {
    setEditId(s.id);
    setForm({ shortcut_code: s.shortcut_code, page_name: s.page_name, page_url: s.page_url, module_name: s.module_name, is_active: s.is_active });
    setDialogOpen(true);
  };

  const filtered = shortcuts.filter(
    (s) =>
      s.shortcut_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.page_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.module_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Keyboard className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Page Shortcuts</h1>
            <p className="text-sm text-muted-foreground">Manage navigation shortcut codes for the command palette</p>
          </div>
        </div>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Shortcut
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Shortcuts ({filtered.length})</CardTitle>
            <Input
              placeholder="Search shortcuts..."
              className="max-w-xs h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Page Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-semibold text-primary">{s.shortcut_code}</TableCell>
                  <TableCell className="font-medium">{s.page_name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{s.page_url}</TableCell>
                  <TableCell>{s.module_name}</TableCell>
                  <TableCell>
                    <Switch checked={s.is_active} onCheckedChange={() => handleToggleActive(s.id, s.is_active)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {loading ? "Loading..." : "No shortcuts found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Shortcut" : "Add Shortcut"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shortcut Code</Label>
                <Input placeholder="e.g. A10" value={form.shortcut_code} onChange={(e) => setForm({ ...form, shortcut_code: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-2">
                <Label>Module Name</Label>
                <Input placeholder="e.g. Accounts" value={form.module_name} onChange={(e) => setForm({ ...form, module_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Page Name</Label>
              <Input placeholder="e.g. Chart of Accounts" value={form.page_name} onChange={(e) => setForm({ ...form, page_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Page URL</Label>
              <Input placeholder="e.g. /accounts/chart" value={form.page_url} onChange={(e) => setForm({ ...form, page_url: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
