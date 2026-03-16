import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  status: string;
}

const BranchesPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchBranches = async () => {
    setLoading(true);
    const { data } = await supabase.from("branches").select("*").order("name");
    setBranches((data || []) as Branch[]);
    setLoading(false);
  };

  useEffect(() => { fetchBranches(); }, []);

  const openCreate = () => {
    setEditBranch(null);
    setFormName(""); setFormCode(""); setFormAddress(""); setFormPhone(""); setFormStatus("active");
    setDialogOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditBranch(b);
    setFormName(b.name); setFormCode(b.code); setFormAddress(b.address || ""); setFormPhone(b.phone || ""); setFormStatus(b.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) return;
    setSaving(true);
    try {
      if (editBranch) {
        const { error } = await supabase.from("branches").update({
          name: formName, code: formCode, address: formAddress, phone: formPhone, status: formStatus,
          updated_at: new Date().toISOString(),
        }).eq("id", editBranch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("branches").insert({
          name: formName, code: formCode, address: formAddress, phone: formPhone, status: formStatus,
        });
        if (error) throw error;
      }
      toast({ title: editBranch ? "Branch updated" : "Branch created" });
      setDialogOpen(false);
      fetchBranches();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this branch?")) return;
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchBranches();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Branch Management</h1>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Add Branch</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : branches.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No branches yet</TableCell></TableRow>
              ) : branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />{b.name}
                  </TableCell>
                  <TableCell className="font-geist-mono text-xs">{b.code}</TableCell>
                  <TableCell className="text-muted-foreground">{b.address || "—"}</TableCell>
                  <TableCell>{b.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "active" ? "default" : "secondary"}>{b.status}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBranch ? "Edit Branch" : "Create Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch Code</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. BR-001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchesPage;
