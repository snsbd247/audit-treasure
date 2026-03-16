import { supabase } from "@/integrations/supabase/client";

const FUNCTION_NAME = "document-api";

async function invoke<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body,
  });
  if (error) throw new Error(error.message || "API error");
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export type DocumentType = "sales_invoice" | "purchase" | "production" | "stock_transfer";

export const documentApi = {
  approve: (docType: DocumentType, id: string) =>
    invoke({ action: "approve", doc_type: docType, id }),

  cancel: (docType: DocumentType, id: string, reason?: string) =>
    invoke({ action: "cancel", doc_type: docType, id, reason }),

  editApproved: (docType: DocumentType, id: string, updates?: Record<string, any>, newItems?: any[]) =>
    invoke({ action: "edit_approved", doc_type: docType, id, updates, new_items: newItems }),

  deleteApproved: (docType: DocumentType, id: string, reason: string) =>
    invoke({ action: "delete_approved", doc_type: docType, id, reason }),
};
