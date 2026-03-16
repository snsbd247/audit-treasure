/**
 * Unified Transaction Service
 * Central service layer that coordinates accounting, inventory, and stock
 * operations across all ERP modules.
 */

import { supabase } from "@/integrations/supabase/client";
import { nextNumber } from "@/lib/db-utils";
import { validateFinancialYear } from "@/lib/financial-year-utils";
import { autoPostAccounting, findAccountByName } from "@/lib/accounting-utils";
import { updateWarehouseStock, createStockMovement } from "@/lib/stock-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionContext {
  date: string;
  branchId: string | null;
  userId?: string;
  financialYearId?: string | null;
}

interface LineItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  discount?: number;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validateTransaction(date: string): Promise<{ valid: boolean; yearId: string | null; error?: string }> {
  return validateFinancialYear(date);
}

// ─── Accounting Integration ───────────────────────────────────────────────────

interface PostAccountingParams {
  debitAccountName: string;
  creditAccountName: string;
  amount: number;
  description: string;
  voucherType: "journal" | "payment" | "receipt" | "contra";
  ctx: TransactionContext;
}

/**
 * Post a double-entry accounting voucher. Fails silently if accounts not found.
 */
export async function postAccounting(params: PostAccountingParams): Promise<void> {
  try {
    const [debitId, creditId] = await Promise.all([
      findAccountByName(params.debitAccountName),
      findAccountByName(params.creditAccountName),
    ]);
    if (!debitId || !creditId) {
      console.warn(`Accounting auto-post skipped: account "${params.debitAccountName}" or "${params.creditAccountName}" not found`);
      return;
    }
    await autoPostAccounting({
      voucher_type: params.voucherType,
      voucher_date: params.ctx.date,
      description: params.description,
      branch_id: params.ctx.branchId,
      financial_year_id: params.ctx.financialYearId,
      created_by: params.ctx.userId,
      entries: [
        { account_id: debitId, debit: params.amount, credit: 0, narration: params.description },
        { account_id: creditId, debit: 0, credit: params.amount, narration: params.description },
      ],
    });
  } catch (err) {
    console.warn("Auto-posting accounting entry failed:", err);
  }
}

// ─── Stock Integration ────────────────────────────────────────────────────────

interface StockMovementParams {
  product_id: string;
  quantity: number; // positive = increase, negative = decrease
  movement_type: string;
  reference_type: string;
  reference_id: string;
  branchId: string | null;
  warehouseId?: string;
  itemId?: string;
}

/**
 * Record a stock movement and optionally update warehouse stock.
 */
export async function recordStockMovement(params: StockMovementParams): Promise<void> {
  await createStockMovement({
    product_id: params.product_id,
    item_id: params.itemId,
    warehouse_id: params.warehouseId,
    branch_id: params.branchId,
    movement_type: params.movement_type,
    reference_type: params.reference_type,
    reference_id: params.reference_id,
    quantity: params.quantity,
  });

  // If warehouse-level tracking is specified, update warehouse stock
  if (params.warehouseId && params.itemId) {
    await updateWarehouseStock(params.itemId, params.warehouseId, params.quantity);
  }
}

/**
 * Record stock movements for multiple line items at once.
 */
export async function recordBulkStockMovements(
  items: { product_id: string; quantity: number }[],
  movementType: string,
  referenceType: string,
  referenceId: string,
  branchId: string | null,
  quantityMultiplier: number = 1
): Promise<void> {
  const movements = items.map((i) => ({
    product_id: i.product_id,
    branch_id: branchId,
    movement_type: movementType,
    reference_type: referenceType,
    reference_id: referenceId,
    quantity: i.quantity * quantityMultiplier,
  }));
  const { error } = await supabase.from("stock_movements").insert(movements);
  if (error) throw new Error("Failed to create stock movements: " + error.message);
}

// ─── Purchase Service ─────────────────────────────────────────────────────────

export async function createPurchase(
  ctx: TransactionContext,
  supplierId: string | null,
  paymentMethod: string,
  notes: string,
  items: LineItem[]
) {
  const fyResult = await validateTransaction(ctx.date);
  if (!fyResult.valid) throw new Error(fyResult.error);
  ctx.financialYearId = fyResult.yearId;

  const purchaseNumber = await nextNumber("purchase");
  const totalAmount = items.reduce((s, i) => s + i.total, 0);

  const { data, error } = await supabase.from("purchases").insert({
    purchase_number: purchaseNumber,
    purchase_date: ctx.date,
    supplier_id: supplierId || null,
    branch_id: ctx.branchId,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    notes,
    created_by: ctx.userId,
  }).select().single();
  if (error) throw error;

  const purchaseId = (data as any).id;

  // Insert line items
  const rows = items.map((i) => ({
    purchase_id: purchaseId,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    total: i.total,
  }));
  await supabase.from("purchase_items").insert(rows);

  // Stock movements (increase)
  await recordBulkStockMovements(items, "purchase", "purchase", purchaseId, ctx.branchId, 1);

  // Accounting: Debit Purchase, Credit Accounts Payable
  await postAccounting({
    debitAccountName: "Purchase",
    creditAccountName: "Accounts Payable",
    amount: totalAmount,
    description: `Purchase ${purchaseNumber}`,
    voucherType: "journal",
    ctx,
  });

  return { purchaseNumber, purchaseId };
}

export async function createPurchaseReturn(
  ctx: TransactionContext,
  supplierId: string | null,
  reason: string,
  items: LineItem[]
) {
  const fyResult = await validateTransaction(ctx.date);
  if (!fyResult.valid) throw new Error(fyResult.error);
  ctx.financialYearId = fyResult.yearId;

  const returnNumber = await nextNumber("purchase_return");
  const totalAmount = items.reduce((s, i) => s + i.total, 0);

  const { data, error } = await supabase.from("purchase_returns").insert({
    return_number: returnNumber,
    return_date: ctx.date,
    supplier_id: supplierId || null,
    branch_id: ctx.branchId,
    total_amount: totalAmount,
    reason,
    created_by: ctx.userId,
  }).select().single();
  if (error) throw error;

  const returnId = (data as any).id;

  const rows = items.map((i) => ({
    purchase_return_id: returnId,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    total: i.total,
  }));
  await supabase.from("purchase_return_items").insert(rows);

  // Stock movements (decrease)
  await recordBulkStockMovements(items, "purchase_return", "purchase_return", returnId, ctx.branchId, -1);

  // Accounting: Debit Accounts Payable, Credit Purchase Return
  await postAccounting({
    debitAccountName: "Accounts Payable",
    creditAccountName: "Purchase Return",
    amount: totalAmount,
    description: `Purchase Return ${returnNumber}`,
    voucherType: "journal",
    ctx,
  });

  return { returnNumber, returnId };
}

// ─── Sales Service ────────────────────────────────────────────────────────────

export async function createSalesInvoice(
  ctx: TransactionContext,
  customerId: string | null,
  discount: number,
  notes: string,
  items: { product_id: string; quantity: number; price: number; discount: number; total: number }[]
) {
  const fyResult = await validateTransaction(ctx.date);
  if (!fyResult.valid) throw new Error(fyResult.error);
  ctx.financialYearId = fyResult.yearId;

  const invoiceNumber = await nextNumber("sales_invoice");
  const totalAmount = items.reduce((s, i) => s + i.total, 0);
  const netAmount = totalAmount - discount;

  const { data, error } = await supabase.from("sales_invoices").insert({
    invoice_number: invoiceNumber,
    invoice_date: ctx.date,
    customer_id: customerId || null,
    branch_id: ctx.branchId,
    total_amount: totalAmount,
    discount,
    net_amount: netAmount,
    notes,
    created_by: ctx.userId,
  }).select().single();
  if (error) throw error;

  const invoiceId = (data as any).id;

  const rows = items.map((i) => ({
    sales_invoice_id: invoiceId,
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.price,
    discount: i.discount,
    total: i.total,
  }));
  await supabase.from("sales_invoice_items").insert(rows);

  // Stock movements (decrease)
  await recordBulkStockMovements(
    items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    "sale", "sales_invoice", invoiceId, ctx.branchId, -1
  );

  // Accounting: Debit Accounts Receivable, Credit Sales
  await postAccounting({
    debitAccountName: "Accounts Receivable",
    creditAccountName: "Sales",
    amount: netAmount,
    description: `Sales Invoice ${invoiceNumber}`,
    voucherType: "journal",
    ctx,
  });

  return { invoiceNumber, invoiceId };
}

export async function createSalesReturn(
  ctx: TransactionContext,
  customerId: string | null,
  reason: string,
  items: { product_id: string; quantity: number; price: number; total: number }[]
) {
  const fyResult = await validateTransaction(ctx.date);
  if (!fyResult.valid) throw new Error(fyResult.error);
  ctx.financialYearId = fyResult.yearId;

  const returnNumber = await nextNumber("sales_return");
  const totalAmount = items.reduce((s, i) => s + i.total, 0);

  const { data, error } = await supabase.from("sales_returns").insert({
    return_number: returnNumber,
    return_date: ctx.date,
    customer_id: customerId || null,
    branch_id: ctx.branchId,
    total_amount: totalAmount,
    reason,
    created_by: ctx.userId,
  }).select().single();
  if (error) throw error;

  const returnId = (data as any).id;

  const rows = items.map((i) => ({
    sales_return_id: returnId,
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.price,
    total: i.total,
  }));
  await supabase.from("sales_return_items").insert(rows);

  // Stock movements (increase - stock comes back)
  await recordBulkStockMovements(
    items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    "sale_return", "sales_return", returnId, ctx.branchId, 1
  );

  // Accounting: Debit Sales Return, Credit Accounts Receivable
  await postAccounting({
    debitAccountName: "Sales Return",
    creditAccountName: "Accounts Receivable",
    amount: totalAmount,
    description: `Sales Return ${returnNumber}`,
    voucherType: "journal",
    ctx,
  });

  return { returnNumber, returnId };
}

// ─── Production Service ───────────────────────────────────────────────────────

export async function createProductionEntry(
  ctx: TransactionContext,
  productId: string,
  bomId: string | null,
  quantity: number,
  laborCost: number,
  electricityCost: number,
  rawMaterialCost: number,
  notes: string,
  materials: { material_id: string; quantity: number; cost: number }[]
) {
  const fyResult = await validateTransaction(ctx.date);
  if (!fyResult.valid) throw new Error(fyResult.error);
  ctx.financialYearId = fyResult.yearId;

  const totalCost = rawMaterialCost + laborCost + electricityCost;
  const productionNumber = await nextNumber("production");

  const { data, error } = await supabase.from("production_entries").insert({
    production_number: productionNumber,
    production_date: ctx.date,
    product_id: productId,
    bom_id: bomId || null,
    quantity,
    branch_id: ctx.branchId,
    raw_material_cost: rawMaterialCost,
    labor_cost: laborCost,
    electricity_cost: electricityCost,
    total_cost: totalCost,
    notes,
    created_by: ctx.userId,
  }).select().single();
  if (error) throw error;

  const productionId = (data as any).id;

  // Save consumed materials
  if (materials.length > 0) {
    const matRows = materials.map((m) => ({
      production_id: productionId,
      material_id: m.material_id,
      quantity: m.quantity,
      cost: m.cost,
    }));
    await supabase.from("production_materials").insert(matRows);
  }

  // Stock movements: decrease raw materials, increase finished product
  const movements = [
    ...materials.map((m) => ({
      product_id: m.material_id,
      branch_id: ctx.branchId,
      movement_type: "production_out",
      reference_type: "production",
      reference_id: productionId,
      quantity: -m.quantity,
    })),
    {
      product_id: productId,
      branch_id: ctx.branchId,
      movement_type: "production_in",
      reference_type: "production",
      reference_id: productionId,
      quantity,
    },
  ];
  const { error: mvErr } = await supabase.from("stock_movements").insert(movements);
  if (mvErr) console.warn("Stock movement insert failed:", mvErr);

  // Accounting: Debit Work-in-Progress / Finished Goods, Credit Raw Materials
  if (totalCost > 0) {
    await postAccounting({
      debitAccountName: "Work in Progress",
      creditAccountName: "Raw Material",
      amount: rawMaterialCost,
      description: `Production ${productionNumber} - Materials`,
      voucherType: "journal",
      ctx,
    });
    if (laborCost + electricityCost > 0) {
      await postAccounting({
        debitAccountName: "Work in Progress",
        creditAccountName: "Manufacturing Overhead",
        amount: laborCost + electricityCost,
        description: `Production ${productionNumber} - Overhead`,
        voucherType: "journal",
        ctx,
      });
    }
  }

  return { productionNumber, productionId };
}

// ─── Stock Transfer Service ───────────────────────────────────────────────────

export async function createStockTransfer(
  ctx: TransactionContext,
  fromWarehouseId: string,
  toWarehouseId: string,
  itemId: string,
  quantity: number,
  notes: string
) {
  const transferNumber = await nextNumber("stock_transfer");

  const { error } = await supabase.from("stock_transfers" as any).insert({
    transfer_number: transferNumber,
    from_warehouse_id: fromWarehouseId,
    to_warehouse_id: toWarehouseId,
    item_id: itemId,
    quantity,
    notes: notes || null,
    created_by: ctx.userId,
  } as any);
  if (error) throw error;

  // Update warehouse stock atomically
  await updateWarehouseStock(itemId, fromWarehouseId, -quantity);
  await updateWarehouseStock(itemId, toWarehouseId, quantity);

  return { transferNumber };
}
