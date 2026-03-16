import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple AES-like encryption using Web Crypto API with the ENCRYPTION_KEY secret
async function getKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ENCRYPTION_KEY") || "default-key-change-me";
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(secret.padEnd(32, "0").slice(0, 32)), "AES-GCM", false, ["encrypt", "decrypt"]);
  return keyMaterial;
}

async function encrypt(text: string): Promise<string> {
  if (!text) return "";
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encoded: string): Promise<string> {
  if (!encoded) return "";
  try {
    const key = await getKey();
    const data = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    // Check super admin
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isSuperAdmin = roles?.some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) throw new Error("Only Super Admin can manage backup settings");

    const { action, settings } = await req.json();

    if (action === "get") {
      // Return settings with sensitive values masked
      const { data: rows } = await supabase.from("system_settings").select("*").in("setting_key", [
        "google_client_id", "google_client_secret", "google_refresh_token", "google_drive_folder_id",
      ]);

      const result: Record<string, { value: string; masked: string; is_encrypted: boolean; has_value: boolean }> = {};
      for (const row of rows || []) {
        let plainValue = row.setting_value;
        if (row.is_encrypted && plainValue) {
          plainValue = await decrypt(plainValue);
        }
        const hasValue = !!plainValue && plainValue.length > 0;
        result[row.setting_key] = {
          value: "", // Never send actual value to frontend
          masked: hasValue ? "••••••••" + (plainValue.length > 4 ? plainValue.slice(-4) : "") : "",
          is_encrypted: row.is_encrypted,
          has_value: hasValue,
        };
      }

      return new Response(JSON.stringify({ success: true, settings: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      if (!settings || typeof settings !== "object") throw new Error("Invalid settings");

      const allowedKeys = ["google_client_id", "google_client_secret", "google_refresh_token", "google_drive_folder_id"];
      const encryptedKeys = ["google_client_secret", "google_refresh_token"];

      for (const [key, value] of Object.entries(settings)) {
        if (!allowedKeys.includes(key)) continue;
        const strValue = String(value || "");
        const shouldEncrypt = encryptedKeys.includes(key);
        const storedValue = shouldEncrypt && strValue ? await encrypt(strValue) : strValue;

        await supabase.from("system_settings").update({
          setting_value: storedValue,
          is_encrypted: shouldEncrypt,
          updated_at: new Date().toISOString(),
        }).eq("setting_key", key);
      }

      // Audit log
      await supabase.from("audit_log").insert({
        user_id: user.id,
        user_name: user.email,
        module: "Backup",
        action: "Updated Google Drive Settings",
        details: `Updated keys: ${Object.keys(settings).join(", ")}`,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "test") {
      // Load credentials, decrypt, and test Google Drive connection
      const { data: rows } = await supabase.from("system_settings").select("*").in("setting_key", [
        "google_client_id", "google_client_secret", "google_refresh_token", "google_drive_folder_id",
      ]);

      const creds: Record<string, string> = {};
      for (const row of rows || []) {
        creds[row.setting_key] = row.is_encrypted && row.setting_value ? await decrypt(row.setting_value) : row.setting_value;
      }

      if (!creds.google_client_id || !creds.google_client_secret || !creds.google_refresh_token) {
        return new Response(JSON.stringify({ success: false, error: "Missing required credentials. Please save Client ID, Client Secret, and Refresh Token." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try to refresh access token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: creds.google_client_id,
          client_secret: creds.google_client_secret,
          refresh_token: creds.google_refresh_token,
          grant_type: "refresh_token",
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        return new Response(JSON.stringify({ success: false, error: "Failed to authenticate with Google: " + (tokenData.error_description || tokenData.error || "Unknown error") }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Test listing files
      const aboutRes = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const aboutData = await aboutRes.json();

      return new Response(JSON.stringify({
        success: true,
        message: `Connected to Google Drive as ${aboutData.user?.displayName || aboutData.user?.emailAddress || "Unknown"}`,
        user: aboutData.user,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("backup-settings error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
