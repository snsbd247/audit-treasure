import { useState, useCallback } from "react";
import { Voucher, VoucherStatus } from "@/types/voucher";
import { createSampleVouchers, generateVoucherNumber } from "@/lib/voucher-utils";
import { VoucherList } from "@/components/VoucherList";
import { VoucherDetail } from "@/components/VoucherDetail";
import { BackupStatus } from "@/components/BackupStatus";
import { Plus, FileText } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>(createSampleVouchers);
  const [selectedId, setSelectedId] = useState<string | null>("1");

  const selectedVoucher = vouchers.find((v) => v.id === selectedId) || null;

  const updateVoucherStatus = useCallback((id: string, status: VoucherStatus, logEntry: { action: string; user: string; detail: string }) => {
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              status,
              updatedAt: new Date(),
              activityLog: [
                ...v.activityLog,
                { id: `l-${Date.now()}`, ...logEntry, timestamp: new Date() },
              ],
            }
          : v
      )
    );
  }, []);

  const handleApprove = useCallback((id: string) => {
    updateVoucherStatus(id, "approved", {
      action: "approved",
      user: "Michael Torres",
      detail: "Voucher approved",
    });
  }, [updateVoucherStatus]);

  const handleReject = useCallback((id: string, reason: string) => {
    updateVoucherStatus(id, "rejected", {
      action: "rejected",
      user: "Michael Torres",
      detail: `Rejected — ${reason}`,
    });
  }, [updateVoucherStatus]);

  const handleSubmit = useCallback((id: string) => {
    updateVoucherStatus(id, "pending", {
      action: "submitted",
      user: vouchers.find((v) => v.id === id)?.createdBy.name || "Unknown",
      detail: "Submitted for approval",
    });
  }, [updateVoucherStatus, vouchers]);

  const handleNewVoucher = useCallback(() => {
    const newVoucher: Voucher = {
      id: String(Date.now()),
      number: generateVoucherNumber(),
      description: "",
      amount: 0,
      currency: "USD",
      status: "draft",
      createdBy: { name: "Current User", avatar: "CU" },
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: [],
      activityLog: [
        { id: `l-${Date.now()}`, action: "created", user: "Current User", timestamp: new Date(), detail: "Voucher created" },
      ],
      lineItems: [],
    };
    setVouchers((prev) => [newVoucher, ...prev]);
    setSelectedId(newVoucher.id);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-base font-medium text-foreground tracking-tight">Voucher Management</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNewVoucher}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Voucher
        </motion.button>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar list */}
        <div className="w-80 border-r border-border overflow-hidden flex flex-col">
          <VoucherList
            vouchers={vouchers}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-hidden">
          {selectedVoucher ? (
            <VoucherDetail
              voucher={selectedVoucher}
              onApprove={handleApprove}
              onReject={handleReject}
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a voucher to view details
            </div>
          )}
        </div>
      </div>

      {/* Backup footer */}
      <BackupStatus />
    </div>
  );
};

export default Index;
