import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

// ---------- helpers ----------

async function getUserRoles(admin: any, userId: string): Promise<string[]> {
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data || []).map((r: any) => r.role);
}

async function getUserProfile(admin: any, userId: string) {
  const { data } = await admin
    .from("profiles")
    .select("name, username, email")
    .eq("id", userId)
    .single();
  return data;
}

function isSuperAdmin(roles: string[]) {
  return roles.includes("super_admin");
}

function isAdminOrSuper(roles: string[]) {
  return roles.includes("admin") || roles.includes("super_admin");
}

async function logAudit(
  admin: any,
  params: {
    userId: string;
    userName: string;
    module: string;
    action: string;
    recordId: string;
    details: string;
    ipAddress: string | null;
  }
) {
  await admin.from("audit_log").insert({
    user_id: params.userId,
    user_name: params.userName,
    module: params.module,
    action: params.action,
    record_id: params.recordId,
    details: params.details,
    ip_address: params.ipAddress,
  });
}

// Document type configuration
const DOC_CONFIG: Record<string, {
  table: string;
  itemsTable?: string;
  itemsFk?: string;
  numberField: string;
  module: string;
  hasStock: boolean;
  stockMovementType?: string;
}> = {
  sales_invoice: {
    table: "sales_invoices",
    itemsTable: "sales_invoice_items",
    itemsFk: "sales_invoice_id",
    numberField: "invoice_number",
    module: "sales",
    hasStock: true,
    stockMovementType: "sale",
  },
  purchase: {
    table: "purchases",
    itemsTable: "purchase_items",
    itemsFk: "purchase_id",
    numberField: "purchase_number",
    module: "purchase",
    hasStock: true,
    stockMovementType: "purchase",
  },
  sales_return: {
    table: "sales_returns",
    itemsTable: "sales_return_items",
    itemsFk: "sales_return_id",
    numberField: "return_number",
    module: "sales",
    hasStock: true,
    stockMovementType: "sales_return",
  },
  purchase_return: {
    table: "purchase_returns",
    itemsTable: "purchase_return_items",
    itemsFk: "purchase_return_id",
    numberField: "return_number",
    module: "purchase",
    hasStock: true,
    stockMovementType: "purchase_return",
  },
  production: {
    table: "production_entries",
    itemsTable: "production_materials",
    itemsFk: "production_id",
    numberField: "production_number",
    module: "manufacturing",
    hasStock: true,
    stockMovementType: "production",
  },
  stock_transfer: {
    table: "stock_transfers",
    numberField: "transfer_number",
    module: "inventory",
    hasStock: true,
    stockMovementType: "transfer",
  },
  acc_voucher: {
    table: "acc_vouchers",
    itemsTable: "voucher_entries",
    itemsFk: "voucher_id",
    numberField: "voucher_number",
    module: "accounts",
    hasStock: false,
  },
  customer: {
    table: "customers",
    numberField: "name",
    module: "sales",
    hasStock: false,
  },
  supplier: {
    table: "suppliers",
    numberField: "name",
    module: "purchase",
    hasStock: false,
  },
};

// ---------- main handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return err("Missing authorization", 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();
  if (authErr || !user) return err("Unauthorized", 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const roles = await getUserRoles(admin, user.id);
  const profile = await getUserProfile(admin, user.id);
  const userName = profile?.name || profile?.username || user.email || "Unknown";
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    null;

  const body = await req.json().catch(() => ({}));
  const { action, doc_type } = body;

  const config = DOC_CONFIG[doc_type];
  if (!config) {
    return err(`Unknown document type: ${doc_type}`);
  }

  try {
    switch (action) {
      // ============ APPROVE DOCUMENT ============
      case "approve": {
        if (!isAdminOrSuper(roles)) return err("Only admins can approve documents", 403);
        const { id } = body;

        const { data: doc } = await admin.from(config.table).select("*").eq("id", id).single();
        if (!doc) return err("Document not found", 404);
        if (doc.status !== "draft" && doc.status !== "pending" && doc.status !== "completed") {
          return err("Only draft/pending/completed documents can be approved");
        }

        const { error } = await admin
          .from(config.table)
          .update({ status: "approved" })
          .eq("id", id);
        if (error) return err(error.message, 500);

        await logAudit(admin, {
          userId: user.id,
          userName,
          module: config.module,
          action: "document_approved",
          recordId: id,
          details: JSON.stringify({
            document_type: doc_type,
            document_number: doc[config.numberField],
            previous_status: doc.status,
          }),
          ipAddress,
        });

        return json({ success: true });
      }

      // ============ CANCEL DOCUMENT ============
      case "cancel": {
        const { id, reason } = body;

        const { data: doc } = await admin.from(config.table).select("*").eq("id", id).single();
        if (!doc) return err("Document not found", 404);

        if (doc.status === "approved" && !isSuperAdmin(roles)) {
          return err("Only Super Admin can cancel approved documents", 403);
        }
        if (doc.status === "cancelled") {
          return err("Document is already cancelled");
        }

        const { error } = await admin
          .from(config.table)
          .update({ status: "cancelled" })
          .eq("id", id);
        if (error) return err(error.message, 500);

        // Reverse stock movements if cancelling an approved document with stock impact
        if (doc.status === "approved" && config.hasStock) {
          const { data: movements } = await admin
            .from("stock_movements")
            .select("*")
            .eq("reference_id", id);

          if (movements && movements.length > 0) {
            const reversals = movements.map((m: any) => ({
              product_id: m.product_id,
              branch_id: m.branch_id,
              item_id: m.item_id,
              warehouse_id: m.warehouse_id,
              movement_type: `${m.movement_type}_reversal`,
              reference_type: `${m.reference_type}_cancellation`,
              reference_id: id,
              quantity: -m.quantity,
            }));
            await admin.from("stock_movements").insert(reversals);

            if (doc_type === "stock_transfer") {
              const { data: whStock1 } = await admin
                .from("warehouse_stock")
                .select("*")
                .eq("item_id", doc.item_id)
                .eq("warehouse_id", doc.from_warehouse_id)
                .single();
              if (whStock1) {
                await admin.from("warehouse_stock").update({
                  quantity: whStock1.quantity + doc.quantity,
                }).eq("id", whStock1.id);
              }
              const { data: whStock2 } = await admin
                .from("warehouse_stock")
                .select("*")
                .eq("item_id", doc.item_id)
                .eq("warehouse_id", doc.to_warehouse_id)
                .single();
              if (whStock2) {
                await admin.from("warehouse_stock").update({
                  quantity: whStock2.quantity - doc.quantity,
                }).eq("id", whStock2.id);
              }
            }
          }

          // Reverse accounting entries
          const docNumber = doc[config.numberField];
          const { data: relatedVouchers } = await admin
            .from("acc_vouchers")
            .select("id")
            .like("description", `%${docNumber}%`)
            .eq("status", "approved");

          if (relatedVouchers) {
            for (const v of relatedVouchers) {
              await admin.from("acc_vouchers").update({ status: "cancelled" }).eq("id", v.id);
            }
          }
        }

        await logAudit(admin, {
          userId: user.id,
          userName,
          module: config.module,
          action: "document_cancelled",
          recordId: id,
          details: JSON.stringify({
            document_type: doc_type,
            document_number: doc[config.numberField],
            reason: reason || "No reason provided",
            previous_status: doc.status,
            stock_reversed: doc.status === "approved" && config.hasStock,
          }),
          ipAddress,
        });

        return json({ success: true });
      }

      // ============ SUPER ADMIN EDIT APPROVED DOCUMENT ============
      case "edit_approved": {
        if (!isSuperAdmin(roles)) {
          return err("Only Super Admin can edit approved documents", 403);
        }
        const { id, updates, new_items } = body;

        const { data: oldDoc } = await admin.from(config.table).select("*").eq("id", id).single();
        if (!oldDoc) return err("Document not found", 404);
        if (oldDoc.status !== "approved" && oldDoc.status !== "completed") {
          return err("Document is not in approved/completed status");
        }

        // Get old items for audit trail
        let oldItems: any[] = [];
        if (config.itemsTable && config.itemsFk) {
          const { data } = await admin.from(config.itemsTable).select("*").eq(config.itemsFk, id);
          oldItems = data || [];
        }

        // Apply header updates
        if (updates && Object.keys(updates).length > 0) {
          const { error } = await admin.from(config.table).update(updates).eq("id", id);
          if (error) return err(error.message, 500);
        }

        // Replace line items if provided
        if (new_items && config.itemsTable && config.itemsFk) {
          await admin.from(config.itemsTable).delete().eq(config.itemsFk, id);
          const rows = new_items.map((item: any) => ({
            ...item,
            [config.itemsFk!]: id,
          }));
          if (rows.length > 0) {
            const { error } = await admin.from(config.itemsTable).insert(rows);
            if (error) return err(error.message, 500);
          }

          // Recalculate totals
          if (doc_type === "sales_invoice") {
            const total = new_items.reduce((s: number, i: any) => s + (i.total || 0), 0);
            const disc = updates?.discount ?? oldDoc.discount ?? 0;
            await admin.from(config.table).update({
              total_amount: total,
              net_amount: total - disc,
            }).eq("id", id);
          } else if (doc_type === "purchase" || doc_type === "sales_return" || doc_type === "purchase_return") {
            const total = new_items.reduce((s: number, i: any) => s + (i.total || 0), 0);
            await admin.from(config.table).update({ total_amount: total }).eq("id", id);
          } else if (doc_type === "acc_voucher") {
            const totalDebit = new_items.reduce((s: number, i: any) => s + (i.debit || 0), 0);
            await admin.from(config.table).update({ total_amount: totalDebit }).eq("id", id);
          }

          // Reverse old stock movements and create new ones
          if (config.hasStock) {
            await admin.from("stock_movements").delete().eq("reference_id", id);

            if (doc_type === "sales_invoice") {
              const movements = new_items.map((i: any) => ({
                product_id: i.product_id,
                branch_id: oldDoc.branch_id,
                movement_type: "sale",
                reference_type: "sales_invoice",
                reference_id: id,
                quantity: -(i.quantity || 0),
              }));
              await admin.from("stock_movements").insert(movements);
            } else if (doc_type === "purchase") {
              const movements = new_items.map((i: any) => ({
                product_id: i.product_id,
                branch_id: oldDoc.branch_id,
                movement_type: "purchase",
                reference_type: "purchase",
                reference_id: id,
                quantity: i.quantity || 0,
              }));
              await admin.from("stock_movements").insert(movements);
            } else if (doc_type === "sales_return") {
              const movements = new_items.map((i: any) => ({
                product_id: i.product_id,
                branch_id: oldDoc.branch_id,
                movement_type: "sales_return",
                reference_type: "sales_return",
                reference_id: id,
                quantity: i.quantity || 0,
              }));
              await admin.from("stock_movements").insert(movements);
            } else if (doc_type === "purchase_return") {
              const movements = new_items.map((i: any) => ({
                product_id: i.product_id,
                branch_id: oldDoc.branch_id,
                movement_type: "purchase_return",
                reference_type: "purchase_return",
                reference_id: id,
                quantity: -(i.quantity || 0),
              }));
              await admin.from("stock_movements").insert(movements);
            }

            // Recalculate accounting entries
            const docNumber = oldDoc[config.numberField];
            const { data: relatedVouchers } = await admin
              .from("acc_vouchers")
              .select("id")
              .like("description", `%${docNumber}%`);

            if (relatedVouchers) {
              for (const v of relatedVouchers) {
                const newTotal = doc_type === "sales_invoice"
                  ? new_items.reduce((s: number, i: any) => s + (i.total || 0), 0) - (updates?.discount ?? oldDoc.discount ?? 0)
                  : new_items.reduce((s: number, i: any) => s + (i.total || 0), 0);

                await admin.from("acc_vouchers").update({ total_amount: newTotal }).eq("id", v.id);

                const { data: entries } = await admin
                  .from("voucher_entries")
                  .select("*")
                  .eq("voucher_id", v.id)
                  .order("sort_order");

                if (entries && entries.length >= 2) {
                  await admin.from("voucher_entries").update({
                    debit: newTotal, credit: 0,
                  }).eq("id", entries[0].id);
                  await admin.from("voucher_entries").update({
                    debit: 0, credit: newTotal,
                  }).eq("id", entries[1].id);
                }
              }
            }
          }
        }

        // Full audit trail
        await logAudit(admin, {
          userId: user.id,
          userName,
          module: config.module,
          action: "approved_document_edited",
          recordId: id,
          details: JSON.stringify({
            document_type: doc_type,
            document_number: oldDoc[config.numberField],
            old_data: { ...oldDoc, items: oldItems },
            new_data: { updates, new_items },
            timestamp: new Date().toISOString(),
          }),
          ipAddress,
        });

        return json({ success: true });
      }

      // ============ DELETE APPROVED DOCUMENT (SUPER ADMIN ONLY) ============
      case "delete_approved": {
        if (!isSuperAdmin(roles)) {
          return err("Only Super Admin can delete approved documents", 403);
        }
        const { id, reason } = body;

        const { data: doc } = await admin.from(config.table).select("*").eq("id", id).single();
        if (!doc) return err("Document not found", 404);

        // Get items for audit
        let oldItems: any[] = [];
        if (config.itemsTable && config.itemsFk) {
          const { data } = await admin.from(config.itemsTable).select("*").eq(config.itemsFk, id);
          oldItems = data || [];
        }

        // Reverse stock movements
        if (config.hasStock) {
          await admin.from("stock_movements").delete().eq("reference_id", id);
        }

        // Cancel related vouchers
        const docNumber = doc[config.numberField];
        if (doc_type !== "acc_voucher") {
          const { data: relatedVouchers } = await admin
            .from("acc_vouchers")
            .select("id")
            .like("description", `%${docNumber}%`);
          if (relatedVouchers) {
            for (const v of relatedVouchers) {
              await admin.from("acc_vouchers").update({ status: "cancelled" }).eq("id", v.id);
            }
          }
        }

        // Delete items then document
        if (config.itemsTable && config.itemsFk) {
          await admin.from(config.itemsTable).delete().eq(config.itemsFk, id);
        }
        await admin.from(config.table).delete().eq("id", id);

        // Reverse warehouse stock for transfers
        if (doc_type === "stock_transfer") {
          const { data: whStock1 } = await admin
            .from("warehouse_stock")
            .select("*")
            .eq("item_id", doc.item_id)
            .eq("warehouse_id", doc.from_warehouse_id)
            .single();
          if (whStock1) {
            await admin.from("warehouse_stock").update({
              quantity: whStock1.quantity + doc.quantity,
            }).eq("id", whStock1.id);
          }
          const { data: whStock2 } = await admin
            .from("warehouse_stock")
            .select("*")
            .eq("item_id", doc.item_id)
            .eq("warehouse_id", doc.to_warehouse_id)
            .single();
          if (whStock2) {
            await admin.from("warehouse_stock").update({
              quantity: whStock2.quantity - doc.quantity,
            }).eq("id", whStock2.id);
          }
        }

        await logAudit(admin, {
          userId: user.id,
          userName,
          module: config.module,
          action: "approved_document_deleted",
          recordId: id,
          details: JSON.stringify({
            document_type: doc_type,
            document_number: doc[config.numberField],
            reason: reason || "No reason provided",
            deleted_document: doc,
            deleted_items: oldItems,
          }),
          ipAddress,
        });

        return json({ success: true });
      }

      default:
        return err(`Unknown action: ${action}`, 400);
    }
  } catch (e: any) {
    console.error("document-api error:", e);
    return err(e.message || "Internal error", 500);
  }
});
