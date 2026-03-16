import { supabase } from "@/integrations/supabase/client";

/**
 * Update warehouse stock for an item.
 * Positive qty = increase, negative qty = decrease.
 */
export async function updateWarehouseStock(
  itemId: string,
  warehouseId: string,
  quantityChange: number
) {
  const { data: existing } = await supabase
    .from("warehouse_stock")
    .select("id, quantity")
    .eq("item_id", itemId)
    .eq("warehouse_id", warehouseId)
    .single();

  if (existing) {
    const newQty = Number((existing as any).quantity) + quantityChange;
    await supabase
      .from("warehouse_stock")
      .update({ quantity: newQty, updated_at: new Date().toISOString() } as any)
      .eq("id", (existing as any).id);
  } else {
    await supabase.from("warehouse_stock").insert({
      item_id: itemId,
      warehouse_id: warehouseId,
      quantity: quantityChange,
    });
  }
}

/**
 * Create a stock movement record for the stock ledger.
 */
export async function createStockMovement(params: {
  product_id: string;
  item_id?: string;
  warehouse_id?: string;
  branch_id?: string | null;
  movement_type: string;
  reference_type?: string;
  reference_id?: string;
  quantity: number;
}) {
  const { error } = await supabase.from("stock_movements").insert({
    product_id: params.product_id,
    item_id: params.item_id || null,
    warehouse_id: params.warehouse_id || null,
    branch_id: params.branch_id || null,
    movement_type: params.movement_type,
    reference_type: params.reference_type || null,
    reference_id: params.reference_id || null,
    quantity: params.quantity,
  });
  if (error) throw new Error("Failed to create stock movement: " + error.message);
}
