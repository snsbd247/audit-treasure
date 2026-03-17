import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TABLES = [
  "branches",
  "financial_years",
  "chart_of_accounts",
  "company_settings",
  "departments",
  "designations",
  "shifts",
  "units",
  "item_categories",
  "item_master",
  "warehouses",
  "product_categories",
  "products",
  "raw_materials",
  "suppliers",
  "customers",
  "custom_roles",
  "role_permissions",
  "profiles",
  "employees",
  "employee_bank_info",
  "employee_education",
  "employee_emergency_contacts",
  "employee_experience",
  "salary_structures",
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
  "stock_ledger",
  "stock_transfers",
  "bill_of_materials",
  "bom_items",
  "production_entries",
  "production_materials",
  "attendance",
  "leave_types",
  "leave_requests",
  "overtime_records",
  "payroll",
  "number_sequences",
  "backup_settings",
  "module_settings",
  "system_settings",
  "page_shortcuts",
];

function escapeMySQL(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "object") {
    const str = JSON.stringify(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `'${str}'`;
  }
  const str = String(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `'${str}'`;
}

function generateMySQLInsert(table: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return `-- No data for ${table}\n`;

  const cols = Object.keys(rows[0]);
  const updateCols = cols.filter(c => c !== "id");
  const updateClause = updateCols.map(c => `${c}=VALUES(${c})`).join(", ");

  const lines = rows.map((row) => {
    const vals = cols.map((c) => escapeMySQL(row[c])).join(", ");
    return `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals})\nON DUPLICATE KEY UPDATE ${updateClause};`;
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

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: profile } = await adminClient
      .from("profiles")
      .select("employee_id")
      .eq("id", user.id)
      .single();

    // Super admin check: no employee_id means super admin
    const isSuperAdmin = !profile?.employee_id;
    if (!isSuperAdmin) throw new Error("Super Admin access required");

    const body = await req.json().catch(() => ({}));
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

    // Generate MySQL-compatible SQL
    const sqlParts = [
      `-- ERP System Database Backup (MySQL Compatible)`,
      `-- Generated: ${new Date().toISOString()}`,
      `-- Tables: ${tablesCount}`,
      `-- Records: ${totalRecords}`,
      `-- Format: SQL (INSERT with ON DUPLICATE KEY UPDATE)`,
      ``,
      `SET FOREIGN_KEY_CHECKS = 0;`,
      ``,
    ];

    for (const table of TABLES) {
      if (allData[table]) {
        sqlParts.push(generateMySQLInsert(table, allData[table] as Record<string, unknown>[]));
      }
    }

    sqlParts.push(`SET FOREIGN_KEY_CHECKS = 1;`);
    const content = sqlParts.join("\n");

    const fileName = `erp_backup_${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "_")}.sql`;
    const filePath = `sql/${fileName}`;
    const fileBlob = new Blob([content], { type: "text/sql" });

    // Upload to storage
    const { error: uploadErr } = await adminClient.storage
      .from("backups")
      .upload(filePath, fileBlob, { contentType: "text/sql", upsert: false });

    if (uploadErr) console.warn("Storage upload failed:", uploadErr.message);

    // Record in backup_history
    await adminClient.from("backup_history").insert({
      file_name: fileName,
      file_size: new Blob([content]).size,
      backup_type: backupType,
      format: "sql",
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
      details: `SQL backup created: ${fileName} (${tablesCount} tables, ${totalRecords} records)`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        file_name: fileName,
        storage_path: filePath,
        format: "sql",
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
