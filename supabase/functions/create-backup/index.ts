import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TABLES = [
  "branches",
  "chart_of_accounts",
  "products",
  "product_categories",
  "raw_materials",
  "suppliers",
  "customers",
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
  "production_entries",
  "production_materials",
  "bill_of_materials",
  "bom_items",
  "custom_roles",
  "role_permissions",
  "user_custom_roles",
  "user_roles",
  "profiles",
  "financial_years",
  "number_sequences",
  "backup_settings",
];

function escapeSQL(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

function generateInsertSQL(table: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return `-- No data for ${table}\n`;
  const cols = Object.keys(rows[0]);
  const lines = rows.map((row) => {
    const vals = cols.map((c) => escapeSQL(row[c])).join(", ");
    return `INSERT INTO public.${table} (${cols.join(", ")}) VALUES (${vals}) ON CONFLICT (id) DO UPDATE SET ${cols.filter(c => c !== "id").map(c => `${c} = EXCLUDED.${c}`).join(", ")};`;
  });
  return `-- Table: ${table} (${rows.length} rows)\n${lines.join("\n")}\n`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user is admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);
    if (!roleCheck?.length) throw new Error("Admin access required");

    const body = await req.json().catch(() => ({}));
    const format = "sql"; // SQL-only backup system
    const backupType = body.backup_type || "manual";

    // Export all tables
    const allData: Record<string, unknown[]> = {};
    let totalRecords = 0;
    let tablesCount = 0;

    for (const table of TABLES) {
      const { data, error } = await adminClient.from(table).select("*");
      if (error) {
        console.warn(`Skipping ${table}: ${error.message}`);
        continue;
      }
      allData[table] = data || [];
      totalRecords += (data?.length || 0);
      if (data?.length) tablesCount++;
    }

    let content: string;
    let fileExt: string;
    let contentType: string;

    if (format === "sql") {
      const sqlParts = [
        `-- ERP System Database Backup`,
        `-- Generated: ${new Date().toISOString()}`,
        `-- Tables: ${tablesCount}`,
        `-- Records: ${totalRecords}`,
        `-- Format: SQL (INSERT with ON CONFLICT)`,
        ``,
        `BEGIN;`,
        ``,
      ];
      for (const table of TABLES) {
        if (allData[table]) {
          sqlParts.push(generateInsertSQL(table, allData[table] as Record<string, unknown>[]));
        }
      }
      sqlParts.push(`COMMIT;`);
      content = sqlParts.join("\n");
      fileExt = "sql";
      contentType = "text/sql";
    } else {
      const meta = {
        version: "2.0",
        generated_at: new Date().toISOString(),
        tables_count: tablesCount,
        records_count: totalRecords,
        format: "json",
      };
      content = JSON.stringify({ meta, data: allData }, null, 2);
      fileExt = "json";
      contentType = "application/json";
    }

    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.${fileExt}`;
    const filePath = `${format}/${fileName}`;
    const fileBlob = new Blob([content], { type: contentType });

    // Upload to storage
    const { error: uploadErr } = await adminClient.storage
      .from("backups")
      .upload(filePath, fileBlob, { contentType, upsert: false });

    if (uploadErr) console.warn("Storage upload failed:", uploadErr.message);

    // Record in backup_history
    await adminClient.from("backup_history").insert({
      file_name: fileName,
      file_size: new Blob([content]).size,
      backup_type: backupType,
      format,
      status: "completed",
      tables_count: tablesCount,
      records_count: totalRecords,
      storage_path: filePath,
      created_by: user.id,
    });

    // Audit log
    await adminClient.from("audit_log").insert({
      user_id: user.id,
      user_name: user.email,
      action: "backup_created",
      module: "backup",
      details: `${format.toUpperCase()} backup created: ${fileName} (${tablesCount} tables, ${totalRecords} records)`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        file_name: fileName,
        storage_path: filePath,
        format,
        tables_count: tablesCount,
        records_count: totalRecords,
        content,
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
