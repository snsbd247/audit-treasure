import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { createProductionEntry } from "@/lib/transaction-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Factory, Printer, Check, X, ShieldAlert, Eye, Pencil, Trash2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PrintLayout } from "@/components/PrintLayout";
import { getDocumentStatusConfig } from "@/hooks/useDocumentRules";
import { documentApi } from "@/lib/document-api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product { id: string; product_name: string; product_code: string; }
interface Branch { id: string; name: string; }
interface RawMaterial { id: string; material_name: string; material_code: string; unit: string; cost_price: number; }
interface BOM { id: string; product_id: string; name: string; }
interface MatRow { id: string; material_id: string; quantity: number; cost: number; unit: string; }

interface ProdEntry {
  id: string; production_number: string; production_date: string; product_id: string;
  quantity: number; raw_material_cost: number; labor_cost: number; electricity_cost: number;
  total_cost: number; notes: string | null; product_name?: string; branch_id?: string | null;
}

const ProductionPage = () => {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const isAdmin = hasPermission("manufacturing", "can_edit");
  const { userBranchId } = useBranch();
  const { toast } = useToast();
  const { fc } = useCurrency();
  const [entries, setEntries] = useState<ProdEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formProduct, setFormProduct] = useState("");
  const [formBom, setFormBom] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formBranch, setFormBranch] = useState("");
  const [formLabor, setFormLabor] = useState("0");
  const [formElec, setFormElec] = useState("0");
  const [formNotes, setFormNotes] = useState("");
  const [matRows, setMatRows] = useState<MatRow[]>([]);

  // Print state
  const [printEntry, setPrintEntry] = useState<ProdEntry | null>(null);
  const [printMaterials, setPrintMaterials] = useState<any[]>([]);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "cancel" | null>(null);
  const [actionTarget, setActionTarget] = useState<ProdEntry | null>(null);
  const [actionReason, setActionReason] = useState("");

  // View dialog
  const [viewEntry, setViewEntry] = useState<ProdEntry | null>(null);
  const [viewMaterials, setViewMaterials] = useState<any[]>([]);

  const userCanEdit = hasPermission("manufacturing", "can_edit") || isSuperAdmin;
  const userCanDelete = hasPermission("manufacturing", "can_delete") || isSuperAdmin;

  const openView = async (entry: ProdEntry) => {
    const { data } = await supabase.from("production_materials").select("*").eq("production_id", entry.id);
    const enriched = (data || []).map((d: any) => {
      const mat = materials.find((m) => m.id === d.material_id);
      return { ...d, material_name: mat?.material_name || "—", unit: mat?.unit || "pcs" };
    });
    setViewMaterials(enriched);
    setViewEntry(entry);
  };

  const canEditDoc = (status: string) => {
    if (status === "cancelled") return false;
    if (status === "approved" || status === "completed") return isSuperAdmin;
    return userCanEdit;
  };

  const canDeleteDoc = (status: string) => {
    if (status === "cancelled") return false;
    if (status === "approved" || status === "completed") return isSuperAdmin;
    return userCanDelete;
  };

  const handleDocAction = async () => {
    if (!actionTarget || !actionType) return;
    setSaving(true);
    try {
      if (actionType === "approve") {
        await documentApi.approve("production", actionTarget.id);
        toast({ title: `Production ${actionTarget.production_number} approved` });
      } else if (actionType === "cancel") {
        await documentApi.cancel("production", actionTarget.id, actionReason);
        toast({ title: `Production ${actionTarget.production_number} cancelled` });
      }
      setActionDialogOpen(false);
      setActionTarget(null);
      setActionReason("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const fetchData = async () => {
    setLoading(true);
    const [eRes, pRes, bRes, mRes, bomRes] = await Promise.all([
      supabase.from("production_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("item_master").select("id, item_name, item_code").eq("status", "active").in("item_type", ["product", "finished_goods"]),
      supabase.from("branches").select("id, name").eq("status", "active"),
      supabase.from("item_master").select("id, item_name, item_code, cost_price, item_type").eq("status", "active").eq("item_type", "raw_material"),
      supabase.from("bill_of_materials").select("*"),
    ]);
    const prods = (pRes.data || []).map((i: any) => ({ id: i.id, product_name: i.item_name, product_code: i.item_code })) as Product[];
    setProducts(prods);
    setBranches((bRes.data || []) as Branch[]);
    setMaterials((mRes.data || []).map((i: any) => ({ id: i.id, material_name: i.item_name, material_code: i.item_code, unit: "pcs", cost_price: i.cost_price })) as RawMaterial[]);
    setBoms((bomRes.data || []) as BOM[]);
    setEntries((eRes.data || []).map((e: any) => ({ ...e, product_name: prods.find((p) => p.id === e.product_id)?.product_name })));
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const productBoms = boms.filter((b) => b.product_id === formProduct);

  const loadBomMaterials = async (bomId: string) => {
    const { data } = await supabase.from("bom_items").select("*").eq("bom_id", bomId);
    const qty = parseFloat(formQty) || 1;
    const rows: MatRow[] = (data || []).map((i: any) => {
      const mat = materials.find((m) => m.id === i.material_id);
      const neededQty = Number(i.quantity) * qty;
      return {
        id: i.id, material_id: i.material_id, quantity: neededQty,
        cost: neededQty * (mat?.cost_price || 0), unit: mat?.unit || "pcs",
      };
    });
    setMatRows(rows);
  };

  useEffect(() => {
    if (formBom) loadBomMaterials(formBom);
  }, [formBom, formQty]);

  const rawMaterialCost = matRows.reduce((s, r) => s + r.cost, 0);
  const totalCost = rawMaterialCost + (parseFloat(formLabor) || 0) + (parseFloat(formElec) || 0);

  const openCreate = () => {
    setFormDate(new Date().toISOString().slice(0, 10)); setFormProduct(""); setFormBom("");
    setFormQty("1"); setFormBranch(""); setFormLabor("0"); setFormElec("0"); setFormNotes(""); setMatRows([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formProduct || matRows.length === 0) { toast({ title: "Select product and BOM", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const ctx = { date: formDate, branchId: formBranch || userBranchId || null, userId: user?.id };
      const result = await createProductionEntry(
        ctx, formProduct, formBom || null, parseFloat(formQty) || 1,
        parseFloat(formLabor) || 0, parseFloat(formElec) || 0, rawMaterialCost, formNotes,
        matRows.map((r) => ({ material_id: r.material_id, quantity: r.quantity, cost: r.cost }))
      );
      toast({ title: `Production ${result.productionNumber} recorded` });
      setDialogOpen(false); fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const openPrint = async (entry: ProdEntry) => {
    const { data } = await supabase.from("production_materials").select("*").eq("production_id", entry.id);
    const enriched = (data || []).map((d: any) => {
      const mat = materials.find((m) => m.id === d.material_id);
      return { ...d, material_name: mat?.material_name || "—", material_code: mat?.material_code || "", unit: mat?.unit || "pcs" };
    });
    setPrintMaterials(enriched);
    setPrintEntry(entry);
  };

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Factory className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Production</h1></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />New Production</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Production #</TableHead><TableHead>Date</TableHead><TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Material Cost</TableHead>
            <TableHead className="text-right">Labor</TableHead><TableHead className="text-right">Total Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-56">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : entries.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No production entries</TableCell></TableRow>
            : entries.map((e) => {
              const statusCfg = getDocumentStatusConfig(e.notes === null && !("status" in e) ? "completed" : (e as any).status || "completed");
              const status = (e as any).status || "completed";
              const isCancelled = status === "cancelled";
              return (
              <TableRow key={e.id} className={isCancelled ? "opacity-60" : ""}>
                <TableCell className="font-geist-mono text-xs font-medium">{e.production_number}</TableCell>
                <TableCell>{e.production_date}</TableCell>
                <TableCell className="font-medium">{e.product_name}</TableCell>
                <TableCell className="text-right tabular-nums">{e.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">{fc(e.raw_material_cost)}</TableCell>
                <TableCell className="text-right tabular-nums">{fc(e.labor_cost)}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{fc(e.total_cost)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {/* View */}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openView(e)} title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {/* Edit - not implemented for production yet, but show button based on permissions */}
                    {canEditDoc(status) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Edit not available", description: "Production editing coming soon" })} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {/* Print */}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPrint(e)} title="Print">
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                    {/* Delete */}
                    {canDeleteDoc(status) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setActionTarget(e); setActionType("cancel"); setActionDialogOpen(true); }} title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                    {/* Approve */}
                    {!isCancelled && (status === "draft" || status === "completed") && (isAdmin || isSuperAdmin) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setActionTarget(e); setActionType("approve"); setActionDialogOpen(true); }} title="Approve">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Production Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Product</Label>
                <Select value={formProduct} onValueChange={(v) => { setFormProduct(v); setFormBom(""); setMatRows([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Quantity to Produce</Label><Input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Bill of Materials</Label>
                <Select value={formBom} onValueChange={setFormBom}><SelectTrigger><SelectValue placeholder="Select BOM" /></SelectTrigger>
                  <SelectContent>{productBoms.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Branch</Label>
                <Select value={formBranch} onValueChange={setFormBranch}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>

            {matRows.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Materials to Consume</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Material</TableHead><TableHead className="text-right">Qty Needed</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Cost</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {matRows.map((r) => {
                        const mat = materials.find((m) => m.id === r.material_id);
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{mat?.material_name || "—"}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                            <TableCell>{r.unit}</TableCell>
                            <TableCell className="text-right tabular-nums">{fc(r.cost)}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={3} className="text-right">Raw Material Cost</TableCell>
                        <TableCell className="text-right tabular-nums">{fc(rawMaterialCost)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Labor Cost</Label><Input type="number" value={formLabor} onChange={(e) => setFormLabor(e.target.value)} /></div>
              <div className="space-y-2"><Label>Electricity Cost</Label><Input type="number" value={formElec} onChange={(e) => setFormElec(e.target.value)} /></div>
              <div className="space-y-2"><Label>Total Production Cost</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-muted text-foreground font-medium tabular-nums">{fc(totalCost)}</div></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Production"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Preview */}
      {printEntry && (
        <PrintLayout
          open={!!printEntry}
          onClose={() => setPrintEntry(null)}
          title="Production Entry"
          docNumber={printEntry.production_number}
          docDate={printEntry.production_date}
          branch={printEntry.branch_id ? branchMap.get(printEntry.branch_id) : undefined}
          notes={printEntry.notes || undefined}
        >
          <div style={{ marginBottom: "12px", fontSize: "12px" }}>
            <strong>Product:</strong> {printEntry.product_name} &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Quantity Produced:</strong> {printEntry.quantity}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <thead>
              <tr>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "left", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>#</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "left", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Material</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Qty</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "left", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Unit</th>
                <th style={{ background: "#f0f0f0", fontWeight: 600, textAlign: "right", padding: "8px 10px", border: "1px solid #ddd", fontSize: "11px" }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {printMaterials.map((m: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{idx + 1}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{m.material_code} — {m.material_name}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{m.quantity}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{m.unit}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 600 }}>{fc(m.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table style={{ width: "50%", marginLeft: "auto", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>Raw Material Cost</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(printEntry.raw_material_cost)}</td></tr>
              <tr><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>Labor Cost</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(printEntry.labor_cost)}</td></tr>
              <tr><td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>Electricity Cost</td><td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(printEntry.electricity_cost)}</td></tr>
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}><td style={{ padding: "8px 10px", border: "1px solid #ddd" }}>Total Production Cost</td><td style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "right" }}>{fc(printEntry.total_cost)}</td></tr>
            </tbody>
          </table>
        </PrintLayout>
      )}

      {/* Action Confirm Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Production" : "Cancel Production"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? `Approve production ${actionTarget?.production_number}?`
                : `Cancel production ${actionTarget?.production_number}? Stock movements will be reversed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionType === "cancel" && (
            <div className="space-y-2 px-1">
              <Label>Reason</Label>
              <Input value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Reason..." />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={handleDocAction} disabled={saving}>
              {saving ? "Processing..." : actionType === "approve" ? "Approve" : "Cancel Production"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* View Production Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Production {viewEntry?.production_number}</DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{viewEntry.production_date}</span></div>
                <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{viewEntry.product_name}</span></div>
                <div><span className="text-muted-foreground">Quantity:</span> <span className="font-medium">{viewEntry.quantity}</span></div>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>#</TableHead><TableHead>Material</TableHead><TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead><TableHead className="text-right">Cost</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {viewMaterials.map((m: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{m.material_name}</TableCell>
                      <TableCell className="text-right tabular-nums">{m.quantity}</TableCell>
                      <TableCell>{m.unit}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fc(m.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-muted-foreground">Raw Material:</span> <span className="font-medium">{fc(viewEntry.raw_material_cost)}</span></div>
                <div><span className="text-muted-foreground">Labor:</span> <span className="font-medium">{fc(viewEntry.labor_cost)}</span></div>
                <div><span className="text-muted-foreground">Total Cost:</span> <span className="font-bold">{fc(viewEntry.total_cost)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewEntry(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ProductionPage;
