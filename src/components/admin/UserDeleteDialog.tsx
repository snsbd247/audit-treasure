import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Trash2, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
}

interface RelatedTable {
  table: string;
  column: string;
  count: number;
}

interface Props {
  user: UserRow;
  allUsers: UserRow[];
  isSuperAdmin: boolean;
  onDeleted: () => void;
}

const UserDeleteDialog = ({ user, allUsers, isSuperAdmin, onDeleted }: Props) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "has_data" | "transferring">("confirm");
  const [relatedTables, setRelatedTables] = useState<RelatedTable[]>([]);
  const [transferToUserId, setTransferToUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const otherUsers = allUsers.filter(u => u.id !== user.id);

  const handleOpen = async () => {
    if (!isSuperAdmin) {
      toast({ title: "Access Denied", description: "Only Super Admin can delete users", variant: "destructive" });
      return;
    }
    setOpen(true);
    setStep("confirm");
    setTransferToUserId("");
    setRelatedTables([]);
  };

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-delete-user", {
        body: { action: "check", user_id: user.id },
      });
      const errMsg = res.data?.error || res.error?.message;
      if (errMsg) throw new Error(errMsg);

      if (res.data.has_related_data) {
        setRelatedTables(res.data.related_tables);
        setStep("has_data");
      } else {
        // Direct delete
        await handleDirectDelete();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDelete = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-delete-user", {
        body: { action: "delete", user_id: user.id },
      });
      const errMsg = res.data?.error || res.error?.message;
      if (errMsg) throw new Error(errMsg);

      toast({ title: "User deleted successfully" });
      setOpen(false);
      setTimeout(() => onDeleted(), 300);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAndDelete = async () => {
    if (!transferToUserId) {
      toast({ title: "Please select a user to transfer data to", variant: "destructive" });
      return;
    }
    setStep("transferring");
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-delete-user", {
        body: {
          action: "transfer_and_delete",
          user_id: user.id,
          transfer_to_user_id: transferToUserId,
        },
      });
      const errMsg = res.data?.error || res.error?.message;
      if (errMsg) throw new Error(errMsg);

      const totalTransferred = (res.data.transfers || []).reduce(
        (sum: number, t: any) => sum + (t.updated || 0), 0
      );

      toast({
        title: "User deleted",
        description: `${totalTransferred} records transferred successfully`,
      });
      setOpen(false);
      setTimeout(() => onDeleted(), 300);
    } catch (err: any) {
      toast({ title: "Transfer Failed", description: err.message, variant: "destructive" });
      setStep("has_data");
    } finally {
      setLoading(false);
    }
  };

  const tableLabel = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleOpen} className="h-8 w-8 text-destructive hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          {step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Delete User
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <strong>{user.name}</strong>
                  {user.email ? ` (${user.email})` : ""}? This action will check for related data first.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} size="sm">Cancel</Button>
                <Button variant="destructive" onClick={handleCheck} disabled={loading} size="sm">
                  {loading ? "Checking..." : "Continue"}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "has_data" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-orange-500" />
                  Transfer Data Required
                </DialogTitle>
                <DialogDescription>
                  This user has existing data that must be transferred before deletion.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="bg-muted/50 rounded-md p-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Related Records Found:</p>
                  {relatedTables.map((rt, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{tableLabel(rt.table)} ({rt.column})</span>
                      <Badge variant="secondary" className="text-xs">{rt.count} records</Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Transfer all data to:</label>
                  <Select value={transferToUserId} onValueChange={setTransferToUserId}>
                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {otherUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} {u.email ? `(${u.email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} size="sm">Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={handleTransferAndDelete}
                  disabled={loading || !transferToUserId}
                  size="sm"
                >
                  Transfer & Delete
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "transferring" && (
            <>
              <DialogHeader>
                <DialogTitle>Transferring Data...</DialogTitle>
                <DialogDescription>
                  Please wait while data is being transferred. Do not close this window.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserDeleteDialog;
