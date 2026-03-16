import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TABLES_ORDER = [
  "branches",
  "financial_years",
  "chart_of_accounts",
  "product_categories",
  "suppliers",
  "customers",
  "custom_roles",
  "role_permissions",
  "products",
  "raw_materials",
  "number_sequences",
  "backup_settings",
  "acc_vouchers",
  "voucher_entries",
  "purchases",
  "purchase_items",
  "purchase_returns",
  "purchase_return_items",
  "sales_invoices",
  "sales_invoice_items",
  "sales_returns",
  "sales_return_items",
  "stock_movements",
  "bill_of_materials",
  "bom_items",
  "production_entries",
  "production_materials",
  "profiles",
  "user_roles",
  "user_custom_roles",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check super_admin role only
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin");
    if (!roleCheck?.length) throw new Error("Super Admin access required for restore");

    const body = await req.json();
    const { content, format, file_name } = body;

    if (!content) throw new Error("No backup content provided");

    let restoreData: Record<string, unknown[]>;
    let totalRestored = 0;
    const errors: string[] = [];

    if (format === "json") {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      // Support both v1 (flat) and v2 (with meta.data) formats
      restoreData = parsed.data || parsed;

      // Validate structure
      if (typeof restoreData !== "object" || Array.isArray(restoreData)) {
        throw new Error("Invalid backup file structure");
      }
    } else {
      throw new Error("SQL restore must be executed directly in the Supabase SQL editor. Use JSON format for programmatic restore.");
    }

    // Restore in dependency order
    for (const table of TABLES_ORDER) {
      if (!restoreData[table] || !Array.isArray(restoreData[table]) || restoreData[table].length === 0) continue;
      
      try {
        const { error } = await adminClient
          .from(table)
          .upsert(restoreData[table] as any[], { onConflict: "id" } as any);
        
        if (error) {
          errors.push(`${table}: ${error.message}`);
        } else {
          totalRestored += restoreData[table].length;
        }
      } catch (e) {
        errors.push(`${table}: ${(e as Error).message}`);
      }
    }

    // Record in backup_history
    await adminClient.from("backup_history").insert({
      file_name: file_name || "restore-upload",
      file_size: new Blob([typeof content === "string" ? content : JSON.stringify(content)]).size,
      backup_type: "restore",
      format: format || "json",
      status: errors.length ? "completed_with_errors" : "completed",
      tables_count: TABLES_ORDER.filter(t => restoreData[t]?.length).length,
      records_count: totalRestored,
      created_by: user.id,
      error_message: errors.length ? errors.join("; ") : null,
    });

    // Audit log
    await adminClient.from("audit_log").insert({
      user_id: user.id,
      user_name: user.email,
      action: "backup_restored",
      module: "backup",
      details: `Database restored from ${file_name || "upload"}: ${totalRestored} records${errors.length ? `, ${errors.length} errors` : ""}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        records_restored: totalRestored,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
