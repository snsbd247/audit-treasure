import { useState } from "react";
import { motion } from "framer-motion";
import { Voucher } from "@/types/voucher";
import { StatusBadge } from "./StatusBadge";
import { VoucherIdField } from "./VoucherIdField";
import { ActivityLog } from "./ActivityLog";
import { FileDropzone } from "./FileDropzone";
import { CheckCircle, XCircle, Send, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VoucherDetailProps {
  voucher: Voucher;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSubmit: (id: string) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function VoucherDetail({ voucher, onApprove, onReject, onSubmit }: VoucherDetailProps) {
  const [approving, setApproving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    setConfirmAction(null);
    setApproving(true);
    await new Promise((r) => setTimeout(r, 600));
    onApprove(voucher.id);
    setApproving(false);
  };

  const handleReject = () => {
    setConfirmAction(null);
    onReject(voucher.id, rejectReason);
    setRejectReason("");
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <VoucherIdField voucherNumber={voucher.number} />
            <p className="text-lg font-medium text-foreground mt-2 tracking-tight">{voucher.description}</p>
            <p className="text-sm text-muted-foreground mt-1">Created by {voucher.createdBy.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={voucher.status} />
            <span className="text-xl font-medium tabular-nums text-foreground">{formatCurrency(voucher.amount)}</span>
          </div>
        </div>

        {/* Line Items */}
        <div className="shadow-card rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Price</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {voucher.lineItems.map((item, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2.5 text-foreground">{item.description}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">{formatCurrency(item.total)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-medium text-foreground">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-foreground">{formatCurrency(voucher.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <FileDropzone
            attachments={voucher.attachments}
            readOnly={voucher.status !== "draft"}
          />
        </div>

        {/* Actions */}
        {voucher.status === "draft" && (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onSubmit(voucher.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
              Submit for Approval
            </motion.button>
          </div>
        )}

        {voucher.status === "pending" && (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setConfirmAction("approve")}
              disabled={approving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-success text-success-foreground text-sm font-medium transition-colors hover:bg-success/90 disabled:opacity-50"
            >
              {approving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {approving ? "Processing..." : "Approve"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setConfirmAction("reject")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium transition-colors hover:bg-destructive/90"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </motion.button>
          </div>
        )}
      </div>

      {/* Activity Log Sidebar */}
      <div className="w-72 border-l border-border p-4 overflow-y-auto bg-secondary/20">
        <ActivityLog entries={voucher.activityLog} />
      </div>

      {/* Confirm Dialogs */}
      <AlertDialog open={confirmAction === "approve"} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Voucher {voucher.number}</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve the voucher for {formatCurrency(voucher.amount)}. This action will be logged and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} className="bg-success text-success-foreground hover:bg-success/90">
              Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === "reject"} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Voucher {voucher.number}</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejection. This action will be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
