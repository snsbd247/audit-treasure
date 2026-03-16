interface VoucherIdFieldProps {
  voucherNumber: string;
}

export function VoucherIdField({ voucherNumber }: VoucherIdFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Voucher</span>
      <div className="px-3 py-1.5 rounded-md bg-secondary font-geist-mono text-base font-medium text-muted-foreground select-none tabular-nums">
        {voucherNumber}
      </div>
    </div>
  );
}
