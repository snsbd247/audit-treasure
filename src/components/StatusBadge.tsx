import { VoucherStatus } from "@/types/voucher";
import { STATUS_CONFIG } from "@/lib/voucher-utils";

interface StatusBadgeProps {
  status: VoucherStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums ${config.className}`}>
      {config.label}
    </span>
  );
}
