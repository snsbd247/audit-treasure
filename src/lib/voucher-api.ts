import { supabase } from "@/integrations/supabase/client";

const FUNCTION_NAME = "voucher-api";

async function invoke<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body,
  });
  if (error) throw new Error(error.message || "API error");
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const voucherApi = {
  list: (voucher_type: string) =>
    invoke<{ data: any[] }>({ action: "list", voucher_type }),

  get: (id: string) =>
    invoke<{ voucher: any; entries: any[] }>({ action: "get", id }),

  create: (params: {
    voucher_type: string;
    voucher_date: string;
    branch_id?: string;
    financial_year_id?: string;
    description: string;
    entries: Array<{
      account_id: string;
      debit: number;
      credit: number;
      narration: string;
    }>;
    submit: boolean;
  }) => invoke<{ voucher: any }>({ action: "create", ...params }),

  approve: (id: string) => invoke({ action: "approve", id }),

  reject: (id: string, reason?: string) =>
    invoke({ action: "reject", id, reason }),

  editApproved: (params: {
    id: string;
    description?: string;
    entries?: Array<{
      account_id: string;
      debit: number;
      credit: number;
      narration: string;
    }>;
  }) => invoke({ action: "edit_approved", ...params }),

  deleteApproved: (id: string, reason: string) =>
    invoke({ action: "delete_approved", id, reason }),

  reopen: (id: string, reason: string) =>
    invoke({ action: "reopen", id, reason }),

  reverse: (id: string, reason: string) =>
    invoke({ action: "reverse", id, reason }),
};
