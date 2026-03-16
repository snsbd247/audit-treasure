import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { createStockTransfer } from "@/lib/transaction-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowRightLeft, Printer, Check, X } from "lucide-react";
import { PrintLayout } from "@/components/PrintLayout";
import { getDocumentStatusConfig } from "@/hooks/useDocumentRules";
import { documentApi } from "@/lib/document-api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WH { id: string; warehouse_code: string; warehouse_name: string; branch_id: string | null; }
interface Item { id: string; item_code: string; item_name: string; }
interface Transfer { id: string; transfer_number: string; transfer_date: string; from_warehouse_id: string; to_warehouse_id: string; item_id: string; quantity: number; notes: string | null; status: string; created_at: string; }

const StockTransferPage = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { userBranchId } = useBranch();
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [fromWH, setFromWH] = useState("");
  const [toWH, setToWH] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");

  // Print state
  const [printTransfer, setPrintTransfer] = useState<Transfer | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "cancel" | null>(null);
  const [actionTarget, setActionTarget] = useState<Transfer | null>(null);
  const [actionReason, setActionReason] = useState("");

  const handleDocAction = async () => {
    if (!actionTarget || !actionType) return;
    setSaving(true);
    try {
      if (actionType === "approve") {
        await documentApi.approve("stock_transfer", actionTarget.id);
        toast({ title: `Transfer ${actionTarget.transfer_number} approved` });
      } else if (actionType === "cancel") {
        await documentApi.cancel("stock_transfer", actionTarget.id, actionReason);
        toast({ title: `Transfer ${actionTarget.transfer_number} cancelled` });
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
    const [wRes, iRes, tRes] = await Promise.all([
      supabase.from("warehouses" as any).select("id, warehouse_code, warehouse_name, branch_id").eq("status", "active").order("warehouse_name"),
      supabase.from("item_master" as any).select("id, item_code, item_name").eq("status", "active").order("item_name"),
      supabase.from("stock_transfers" as any).select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setWarehouses((wRes.data || []) as any);
    setItems((iRes.data || []) as any);
    setTransfers((tRes.data || []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const whMap = new Map(warehouses.map((w) => [w.id, w.warehouse_name]));
  const itemMap = new Map(items.map((i) => [i.id, `${i.item_code} — ${i.item_name}`]));
  const itemNameMap = new Map(items.map((i) => [i.id, i.item_name]));

  const handleTransfer = async () => {
    if (!fromWH || !toWH || !itemId || fromWH === toWH) {
      toast({ title: "Invalid transfer", description: "Select different warehouses and an item", variant: "destructive" });
      return;
    }
    const quantity = parseFloat(qty);
    if (!quantity || quantity <= 0) { toast({ title: "Invalid quantity", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const ctx = { date: new Date().toISOString().slice(0, 10), branchId: userBranchId, userId: user?.id };
      const result = await createStockTransfer(ctx, fromWH, toWH, itemId, quantity, notes);
      toast({ title: `Transfer ${result.transferNumber} completed` });
      setDialogOpen(false);
      setFromWH(""); setToWH(""); setItemId(""); setQty("1"); setNotes("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Stock Transfers</h1></div>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />New Transfer</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Transfer #</TableHead><TableHead>Date</TableHead><TableHead>Item</TableHead>
            <TableHead>From</TableHead><TableHead>To</TableHead>
            <TableHead className="text-right">Qty</TableHead><TableHead>Status</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : transfers.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No transfers yet</TableCell></TableRow>
            : transfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.transfer_number}</TableCell>
                <TableCell>{t.transfer_date}</TableCell>
                <TableCell className="font-medium">{itemMap.get(t.item_id) || "—"}</TableCell>
                <TableCell>{whMap.get(t.from_warehouse_id) || "—"}</TableCell>
                <TableCell>{whMap.get(t.to_warehouse_id) || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
                <TableCell><Badge variant="default">{t.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPrintTransfer(t)} title="Print">
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Item *</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>{items.map((i) => <SelectItem key={i.id} value={i.id}>{i.item_code} — {i.item_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>From Warehouse *</Label>
                <Select value={fromWH} onValueChange={setFromWH}>
                  <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>To Warehouse *</Label>
                <Select value={toWH} onValueChange={setToWH}>
                  <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                  <SelectContent>{warehouses.filter((w) => w.id !== fromWH).map((w) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Quantity *</Label><Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleTransfer} disabled={saving}>{saving ? "Processing..." : "Transfer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Preview */}
      {printTransfer && (
        <PrintLayout
          open={!!printTransfer}
          onClose={() => setPrintTransfer(null)}
          title="Stock Transfer"
          docNumber={printTransfer.transfer_number}
          docDate={printTransfer.transfer_date}
          notes={printTransfer.notes || undefined}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd", fontWeight: 600, width: "30%", background: "#f0f0f0" }}>Item</td>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd" }}>{itemMap.get(printTransfer.item_id) || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd", fontWeight: 600, background: "#f0f0f0" }}>From Warehouse</td>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd" }}>{whMap.get(printTransfer.from_warehouse_id) || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd", fontWeight: 600, background: "#f0f0f0" }}>To Warehouse</td>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd" }}>{whMap.get(printTransfer.to_warehouse_id) || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd", fontWeight: 600, background: "#f0f0f0" }}>Quantity</td>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd", fontVariantNumeric: "tabular-nums" }}>{printTransfer.quantity}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd", fontWeight: 600, background: "#f0f0f0" }}>Status</td>
                <td style={{ padding: "8px 12px", border: "1px solid #ddd", textTransform: "capitalize" }}>{printTransfer.status}</td>
              </tr>
            </tbody>
          </table>
        </PrintLayout>
      )}
    </div>
  );
};

export default StockTransferPage;
