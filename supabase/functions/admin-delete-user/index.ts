import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RELATED_TABLES = [
  { table: "sales_invoices", column: "created_by" },
  { table: "purchases", column: "created_by" },
  { table: "acc_vouchers", column: "created_by" },
  { table: "acc_vouchers", column: "approved_by" },
  { table: "stock_ledger", column: "branch_id", skip: true }, // no created_by
  { table: "production_entries", column: "created_by" },
  { table: "purchase_returns", column: "created_by" },
  { table: "sales_returns", column: "created_by" },
  { table: "employee_documents", column: "generated_by" },
];

// Tables with created_by that can be transferred
const TRANSFERABLE_TABLES = [
  { table: "sales_invoices", column: "created_by" },
  { table: "purchases", column: "created_by" },
  { table: "acc_vouchers", column: "created_by" },
  { table: "acc_vouchers", column: "approved_by" },
  { table: "production_entries", column: "created_by" },
  { table: "purchase_returns", column: "created_by" },
  { table: "sales_returns", column: "created_by" },
  { table: "employee_documents", column: "generated_by" },
];

async function verifySuperAdmin(authHeader: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) throw new Error("Unauthorized");

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: callerRoles } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id);

  const roles = (callerRoles || []).map((r: any) => r.role);
  if (!roles.includes("super_admin")) {
    throw new Error("Only Super Admin can perform this action");
  }

  return { caller, adminClient };
}

async function checkRelatedData(adminClient: any, userId: string) {
  const results: { table: string; column: string; count: number }[] = [];

  for (const { table, column, skip } of RELATED_TABLES) {
    if (skip) continue;
    const { count, error } = await adminClient
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(column, userId);

    if (!error && count && count > 0) {
      results.push({ table, column, count });
    }
  }

  // Check user_roles and user_custom_roles (these get deleted with user, not blocking)
  // Check if user is linked to an employee
  const { count: empCount } = await adminClient
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (empCount && empCount > 0) {
    results.push({ table: "employees", column: "user_id", count: empCount });
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const respond = (body: any, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "Unauthorized" }, 401);

    const { caller, adminClient } = await verifySuperAdmin(authHeader);
    const body = await req.json();
    const { action, user_id, transfer_to_user_id } = body;

    if (!user_id) return respond({ error: "user_id is required" }, 400);

    // Prevent self-deletion
    if (user_id === caller.id) {
      return respond({ error: "You cannot delete your own account" }, 400);
    }

    // ACTION: check - Check if user has related data
    if (action === "check") {
      const related = await checkRelatedData(adminClient, user_id);
      return respond({
        has_related_data: related.length > 0,
        related_tables: related,
      });
    }

    // ACTION: transfer_and_delete - Transfer data then soft-delete
    if (action === "transfer_and_delete") {
      if (!transfer_to_user_id) {
        return respond({ error: "transfer_to_user_id is required" }, 400);
      }

      if (user_id === transfer_to_user_id) {
        return respond({ error: "Cannot transfer data to the same user" }, 400);
      }

      // Verify target user exists
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("id, name")
        .eq("id", transfer_to_user_id)
        .is("deleted_at", null)
        .single();

      if (!targetProfile) {
        return respond({ error: "Target user not found" }, 400);
      }

      // Get source user info for audit
      const { data: sourceProfile } = await adminClient
        .from("profiles")
        .select("id, name")
        .eq("id", user_id)
        .single();

      // Transfer all data
      const transferResults: { table: string; column: string; updated: number }[] = [];

      for (const { table, column } of TRANSFERABLE_TABLES) {
        const { data, error } = await adminClient
          .from(table)
          .update({ [column]: transfer_to_user_id })
          .eq(column, user_id)
          .select("id");

        if (error) {
          // Log and return error - manual rollback not possible with Supabase client
          return respond({
            error: `Failed to transfer data in ${table}.${column}: ${error.message}. Some transfers may have partially completed.`,
          }, 500);
        }

        transferResults.push({
          table,
          column,
          updated: data?.length || 0,
        });
      }

      // Unlink employee records
      await adminClient
        .from("employees")
        .update({ user_id: null })
        .eq("user_id", user_id);

      // Soft delete the user profile
      const { error: profileUpdateErr } = await adminClient
        .from("profiles")
        .update({
          deleted_at: new Date().toISOString(),
          status: "deleted",
        })
        .eq("id", user_id);

      if (profileUpdateErr) {
        console.error("Profile soft-delete error:", profileUpdateErr);
      }

      // Remove user roles
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      await adminClient.from("user_custom_roles").delete().eq("user_id", user_id);

      // Disable the auth user (ban instead of delete for safety)
      await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "876600h", // ~100 years
      });

      // Audit log
      await adminClient.from("audit_log").insert({
        user_id: caller.id,
        user_name: caller.user_metadata?.name || caller.email,
        module: "users",
        action: "Data Transfer & Delete",
        record_id: user_id,
        details: JSON.stringify({
          action: "transfer_and_delete",
          from_user: { id: user_id, name: sourceProfile?.name },
          to_user: { id: transfer_to_user_id, name: targetProfile.name },
          transfers: transferResults,
        }),
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
      });

      return respond({
        success: true,
        message: "Data transferred and user deleted successfully",
        transfers: transferResults,
      });
    }

    // ACTION: delete - Direct delete (only if no related data)
    if (action === "delete") {
      const related = await checkRelatedData(adminClient, user_id);
      if (related.length > 0) {
        return respond({
          error: "User cannot be deleted because related data exists. Transfer data before deletion.",
          related_tables: related,
        }, 400);
      }

      // Get user info for audit
      const { data: sourceProfile } = await adminClient
        .from("profiles")
        .select("id, name")
        .eq("id", user_id)
        .single();

      // Soft delete
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          deleted_at: new Date().toISOString(),
          status: "deleted",
        })
        .eq("id", user_id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return respond({ error: `Failed to soft-delete profile: ${updateError.message}` }, 500);
      }

      // Remove roles
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      await adminClient.from("user_custom_roles").delete().eq("user_id", user_id);

      // Ban auth user
      await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "876600h",
      });

      // Audit log
      await adminClient.from("audit_log").insert({
        user_id: caller.id,
        user_name: caller.user_metadata?.name || caller.email,
        module: "users",
        action: "User Deleted",
        record_id: user_id,
        details: JSON.stringify({
          action: "delete",
          deleted_user: { id: user_id, name: sourceProfile?.name },
        }),
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
      });

      return respond({ success: true, message: "User deleted successfully" });
    }

    return respond({ error: "Invalid action. Use: check, delete, transfer_and_delete" }, 400);
  } catch (err) {
    return respond({ error: err.message }, err.message.includes("Unauthorized") ? 401 : 500);
  }
});
