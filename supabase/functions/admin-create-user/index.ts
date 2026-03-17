import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify calling user is authenticated
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check caller is Super Admin (employee_id IS NULL in profiles)
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("employee_id")
      .eq("id", caller.id)
      .single();

    const isSuperAdmin = callerProfile && (callerProfile.employee_id === null || callerProfile.employee_id === undefined);
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Super Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { email, password, name, username, phone, branch_id, status, employee_id, custom_role_id } = body;

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: "Email, password and name are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create user with admin API (no confirmation email, no session switch)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = newUser.user.id;

    // Upsert profile with employee_id link
    await adminClient.from("profiles").upsert({
      id: userId,
      name: name,
      email: email,
      username: username || null,
      phone: phone || null,
      branch_id: branch_id || null,
      employee_id: employee_id || null,
      status: status || "active",
    }, { onConflict: "id" });

    // Assign custom role if provided
    if (custom_role_id && custom_role_id !== "none") {
      await adminClient.from("user_roles").insert({ user_id: userId, role_id: custom_role_id });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId, user: { id: userId } }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
