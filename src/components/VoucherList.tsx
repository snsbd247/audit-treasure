import { Voucher } from "@/types/voucher";
import { StatusBadge } from "./StatusBadge";

interface VoucherListProps {
  vouchers: Voucher[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function VoucherList({ vouchers, selectedId, onSelect }: VoucherListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Vouchers</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{vouchers.length} total</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {vouchers.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className={`w-full text-left px-4 py-3.5 border-b border-border transition-colors duration-200 hover:bg-secondary/50 ${
              selectedId === v.id ? "bg-secondary" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-geist-mono text-sm font-medium text-foreground tabular-nums">{v.number}</span>
              <StatusBadge status={v.status} />
            </div>
            <p className="text-sm text-foreground truncate">{v.description}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">{v.createdBy.name}</span>
              <span className="text-sm font-medium tabular-nums text-foreground">{formatCurrency(v.amount)}</span>
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">{formatDate(v.createdAt)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
