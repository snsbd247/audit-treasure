import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, FolderTree, ChevronRight, ChevronDown } from "lucide-react";

interface Category { id: string; name: string; parent_id: string | null; description: string | null; is_active: boolean; }

const ItemCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formParent, setFormParent] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from("item_categories" as any).select("*").order("name");
    setCategories((data || []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const tree = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories.forEach((c) => {
      const key = c.parent_id || "__root__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return map;
  }, [categories]);

  const hasChildren = (id: string) => tree.has(id);
  const toggleExpand = (id: string) => {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const openCreate = () => { setEditCat(null); setFormName(""); setFormParent(""); setFormDesc(""); setFormActive(true); setDialogOpen(true); };
  const openEdit = (c: Category) => { setEditCat(c); setFormName(c.name); setFormParent(c.parent_id || ""); setFormDesc(c.description || ""); setFormActive(c.is_active); setDialogOpen(true); };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        name: formName,
        parent_id: (formParent && formParent !== "__none__") ? formParent : null,
        description: formDesc || null,
        is_active: formActive,
      };
      if (editCat) {
        const { error } = await supabase.from("item_categories" as any).update(payload).eq("id", editCat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("item_categories" as any).insert(payload);
        if (error) throw error;
      }
      toast({ title: editCat ? "Category updated" : "Category created" });
      setDialogOpen(false); fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const renderRows = (parentId: string, depth: number): JSX.Element[] => {
    const children = tree.get(parentId) || [];
    return children.flatMap((c) => {
      const isExpanded = expanded.has(c.id);
      const hasKids = hasChildren(c.id);
      return [
        <TableRow key={c.id}>
          <TableCell>
            <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
              {hasKids ? (
                <button onClick={() => toggleExpand(c.id)} className="p-0.5 hover:bg-muted rounded">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ) : <span className="w-5" />}
              <span className="font-medium">{c.name}</span>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground text-sm">{c.description || "—"}</TableCell>
          <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge></TableCell>
          <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button></TableCell>
        </TableRow>,
        ...(isExpanded ? renderRows(c.id, depth + 1) : []),
      ];
    });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><FolderTree className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Item Categories</h1></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Category</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead className="w-16">Edit</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : categories.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No categories</TableCell></TableRow>
            : renderRows("__root__", 0)}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Parent Category</Label>
              <Select value={formParent || "__none__"} onValueChange={(v) => setFormParent(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None (root)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (root level)</SelectItem>
                  {categories.filter((c) => c.id !== editCat?.id).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={formActive} onCheckedChange={setFormActive} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemCategoriesPage;
