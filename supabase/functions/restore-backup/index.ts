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

/**
 * Parse MySQL INSERT statements from SQL content.
 * Extracts table name, columns, and values from:
 * INSERT INTO table_name (col1, col2) VALUES ('v1', 'v2') ON DUPLICATE KEY UPDATE ...;
 */
function parseSQLInserts(sql: string): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {};
  
  // Match INSERT INTO statements - handle multiline
  const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+(?:\([^)]*\)[^)]*)*)\)/gi;
  
  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const table = match[1];
    const columns = match[2].split(",").map(c => c.trim());
    const valuesStr = match[3];
    
    // Parse values respecting quoted strings
    const values = parseValues(valuesStr);
    
    if (columns.length === values.length) {
      if (!result[table]) result[table] = [];
      const row: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        row[col] = values[i];
      });
      result[table].push(row);
    }
  }
  
  return result;
}

function parseValues(valuesStr: string): unknown[] {
  const values: unknown[] = [];
  let current = "";
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const ch = valuesStr[i];
    
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    
    if (ch === "\\") {
      escaped = true;
      current += ch;
      continue;
    }
    
    if (ch === "'" && !inString) {
      inString = true;
      continue;
    }
    
    if (ch === "'" && inString) {
      // Check for escaped quote ''
      if (i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
        current += "'";
        i++;
        continue;
      }
      inString = false;
      continue;
    }
    
    if (ch === "," && !inString) {
      values.push(convertValue(current.trim()));
      current = "";
      continue;
    }
    
    current += ch;
  }
  
  if (current.trim()) {
    values.push(convertValue(current.trim()));
  }
  
  return values;
}

function convertValue(val: string): unknown {
  if (val === "NULL") return null;
  if (val === "1" || val === "0") {
    // Could be boolean or number, keep as-is
    return Number(val);
  }
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
  // Remove surrounding backslash escapes
  return val.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
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

    // Super admin check
    const { data: profile } = await adminClient
      .from("profiles")
      .select("employee_id")
      .eq("id", user.id)
      .single();

    if (profile?.employee_id) throw new Error("Super Admin access required for restore");

    const body = await req.json();
    const { content, file_name } = body;

    if (!content) throw new Error("No backup content provided");

    // Parse SQL INSERT statements into table data
    const restoreData = parseSQLInserts(content);

    let totalRestored = 0;
    const errors: string[] = [];

    // Restore in dependency order
    for (const table of TABLES_ORDER) {
      if (!restoreData[table] || restoreData[table].length === 0) continue;

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
      file_name: file_name || "restore-upload.sql",
      file_size: new Blob([content]).size,
      backup_type: "restore",
      format: "sql",
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
      details: `Database restored from ${file_name || "upload.sql"}: ${totalRestored} records${errors.length ? `, ${errors.length} errors` : ""}`,
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
