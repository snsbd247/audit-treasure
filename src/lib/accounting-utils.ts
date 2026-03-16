import { supabase } from "@/integrations/supabase/client";
import { nextNumber } from "@/lib/db-utils";

interface AccountingEntry {
  account_id: string;
  debit: number;
  credit: number;
  narration?: string;
}

interface AutoPostParams {
  voucher_type: "journal" | "payment" | "receipt" | "contra";
  voucher_date: string;
  description: string;
  branch_id?: string | null;
  financial_year_id?: string | null;
  entries: AccountingEntry[];
  reference_type?: string;
  reference_id?: string;
  created_by?: string;
  auto_approve?: boolean;
}

/**
 * Auto-post an accounting voucher from a transaction module.
 * Creates an acc_voucher + voucher_entries in one go.
 */
export async function autoPostAccounting(params: AutoPostParams) {
  const {
    voucher_type,
    voucher_date,
    description,
    branch_id,
    financial_year_id,
    entries,
    created_by,
    auto_approve = true,
  } = params;

  // Validate balanced
  const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Accounting entries not balanced: Debit=${totalDebit}, Credit=${totalCredit}`);
  }

  // Map voucher_type to sequence id
  const seqMap: Record<string, string> = {
    journal: "journal_voucher",
    payment: "payment_voucher",
    receipt: "receipt_voucher",
    contra: "contra_voucher",
  };

  const seqId = seqMap[voucher_type];
  if (!seqId) throw new Error(`Unknown voucher type: ${voucher_type}`);

  const voucherNumber = await nextNumber(seqId);

  const { data: voucher, error: vErr } = await supabase
    .from("acc_vouchers")
    .insert({
      voucher_number: voucherNumber,
      voucher_type,
      voucher_date,
      description,
      branch_id: branch_id || null,
      financial_year_id: financial_year_id || null,
      total_amount: totalDebit,
      status: auto_approve ? "approved" : "draft",
      created_by: created_by || null,
      approved_at: auto_approve ? new Date().toISOString() : null,
      approved_by: auto_approve ? created_by || null : null,
    })
    .select()
    .single();

  if (vErr) throw new Error("Failed to create accounting voucher: " + vErr.message);

  const entryRows = entries.map((e, idx) => ({
    voucher_id: (voucher as any).id,
    account_id: e.account_id,
    debit: e.debit || 0,
    credit: e.credit || 0,
    narration: e.narration || "",
    sort_order: idx,
  }));

  const { error: eErr } = await supabase.from("voucher_entries").insert(entryRows);
  if (eErr) throw new Error("Failed to create voucher entries: " + eErr.message);

  return { voucherNumber, voucherId: (voucher as any).id };
}

/**
 * Find an account by partial name match (case-insensitive).
 * Useful for finding system accounts like "Sales Revenue", "Cash", etc.
 */
export async function findAccountByName(namePart: string): Promise<string | null> {
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .ilike("account_name", `%${namePart}%`)
    .eq("is_active", true)
    .limit(1)
    .single();
  return data?.id || null;
}

/**
 * Find an account by account code.
 */
export async function findAccountByCode(code: string): Promise<string | null> {
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_code", code)
    .eq("is_active", true)
    .limit(1)
    .single();
  return data?.id || null;
}
