import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phone, message, event_type, reference_id } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "Phone and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SMS settings from system_settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sms_api_key", "sms_sender_id", "sms_enabled"]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    if (settingsMap["sms_enabled"] !== "true") {
      return new Response(JSON.stringify({ error: "SMS is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = settingsMap["sms_api_key"];
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "SMS API key not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const senderId = settingsMap["sms_sender_id"] || "";

    // Greenweb SMS API call
    // API docs: https://greenweb.com.bd/api-doc
    const smsApiUrl = "http://api.greenweb.com.bd/api.php";
    const params = new URLSearchParams({
      token: apiKey,
      to: phone,
      message: message,
    });
    if (senderId) params.set("from", senderId);

    let smsStatus = "sent";
    let smsResponse = "";

    try {
      const response = await fetch(`${smsApiUrl}?${params.toString()}`);
      smsResponse = await response.text();

      // Greenweb returns "Ok" or similar on success
      if (!response.ok || smsResponse.toLowerCase().includes("error")) {
        smsStatus = "failed";
      }
    } catch (smsError: any) {
      smsStatus = "failed";
      smsResponse = smsError.message || "Network error";
    }

    // Log the SMS
    await supabase.from("sms_logs").insert({
      phone,
      message,
      status: smsStatus,
      response: smsResponse,
      event_type: event_type || null,
      reference_id: reference_id || null,
    });

    return new Response(
      JSON.stringify({ success: smsStatus === "sent", status: smsStatus, response: smsResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("SMS send error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
