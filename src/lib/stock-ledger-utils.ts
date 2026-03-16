import { supabase } from "@/integrations/supabase/client";

/**
 * Create a stock ledger entry and recalculate running balance.
 */
export async function createStockLedgerEntry(params: {
  transaction_type: string;
  transaction_id?: string;
  item_id: string;
  branch_id?: string | null;
  warehouse_id?: string | null;
  quantity_in: number;
  quantity_out: number;
  unit_cost?: number;
  reference_number?: string;
  transaction_date?: string;
}) {
  // Get current balance for this item+warehouse
  const { data: lastEntry } = await supabase
    .from("stock_ledger" as any)
    .select("balance_quantity")
    .eq("item_id", params.item_id)
    .eq("warehouse_id", params.warehouse_id || "")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const prevBalance = lastEntry ? Number((lastEntry as any).balance_quantity) : 0;
  const newBalance = prevBalance + params.quantity_in - params.quantity_out;
  const unitCost = params.unit_cost || 0;
  const totalValue = (params.quantity_in - params.quantity_out) * unitCost;

  const { error } = await supabase.from("stock_ledger" as any).insert({
    transaction_type: params.transaction_type,
    transaction_id: params.transaction_id || null,
    item_id: params.item_id,
    branch_id: params.branch_id || null,
    warehouse_id: params.warehouse_id || null,
    quantity_in: params.quantity_in,
    quantity_out: params.quantity_out,
    balance_quantity: newBalance,
    unit_cost: unitCost,
    total_value: Math.abs(totalValue),
    reference_number: params.reference_number || null,
    transaction_date: params.transaction_date || new Date().toISOString().split("T")[0],
  } as any);

  if (error) throw new Error("Failed to create stock ledger entry: " + error.message);
  return newBalance;
}

/**
 * Get current stock balance for an item (optionally by warehouse).
 */
export async function getStockBalance(itemId: string, warehouseId?: string): Promise<number> {
  let query = supabase
    .from("stock_ledger" as any)
    .select("balance_quantity")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (warehouseId) query = query.eq("warehouse_id", warehouseId);

  const { data } = await query.single();
  return data ? Number((data as any).balance_quantity) : 0;
}
