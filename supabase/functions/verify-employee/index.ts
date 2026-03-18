import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// HMAC-SHA256 digital signature
async function generateSignature(employeeCode: string, issuedAt: string): Promise<string> {
  const key = Deno.env.get("ENCRYPTION_KEY") || "default-verification-key";
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(`${employeeCode}:${issuedAt}`);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Expected: /verify-employee/{employee_code} or /verify-employee/{employee_code}/signature
    const employeeCode = pathParts[1] || url.searchParams.get("code");
    const action = pathParts[2]; // "signature" for sig generation

    if (!employeeCode) {
      return new Response(
        JSON.stringify({ success: false, message: "Employee code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find employee (safe fields only)
    const { data: emp, error } = await supabase
      .from("employees")
      .select("employee_code, first_name, last_name, photo_url, status, department_id, designation_id, joining_date")
      .eq("employee_code", employeeCode)
      .single();

    if (error || !emp) {
      return new Response(
        JSON.stringify({ success: false, message: "Employee not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get department & designation names
    let departmentName = "";
    let designationName = "";

    if (emp.department_id) {
      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", emp.department_id)
        .single();
      if (dept) departmentName = dept.name;
    }

    if (emp.designation_id) {
      const { data: desig } = await supabase
        .from("designations")
        .select("name")
        .eq("id", emp.designation_id)
        .single();
      if (desig) designationName = desig.name;
    }

    // Get company info
    const { data: company } = await supabase
      .from("company_settings")
      .select("company_name")
      .eq("id", "default")
      .single();

    // Experience calculation
    let experienceText = "";
    let experienceYears = 0;
    let badge = "";
    if (emp.joining_date) {
      const join = new Date(emp.joining_date);
      const now = new Date();
      let years = now.getFullYear() - join.getFullYear();
      let months = now.getMonth() - join.getMonth();
      if (months < 0) { years--; months += 12; }
      experienceYears = years + months / 12;
      experienceText = years > 0
        ? `${years} Year${years > 1 ? "s" : ""} ${months} Month${months !== 1 ? "s" : ""}`
        : `${months} Month${months !== 1 ? "s" : ""}`;
      if (experienceYears < 1) badge = "New Employee";
      else if (experienceYears < 3) badge = "Junior";
      else if (experienceYears < 5) badge = "Mid-Level";
      else badge = "Senior";
    }

    const issuedAt = new Date().toISOString();
    const signature = await generateSignature(emp.employee_code, issuedAt);

    const baseData = {
      name: `${emp.first_name} ${emp.last_name}`,
      employee_id: emp.employee_code,
      designation: designationName,
      department: departmentName,
      status: emp.status,
      company: company?.company_name || "",
      joining_date: emp.joining_date || null,
      experience_text: experienceText || null,
      experience_years: Math.round(experienceYears * 10) / 10,
      badge: badge || null,
    };

    if (action === "signature") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...baseData,
            digital_signature: {
              hash: signature,
              hash_short: signature.substring(0, 16).toUpperCase(),
              issued_at: issuedAt,
              algorithm: "HMAC-SHA256",
            },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { ...baseData, photo_url: emp.photo_url },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
