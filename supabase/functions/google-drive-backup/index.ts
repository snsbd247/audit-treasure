import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getDecryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ENCRYPTION_KEY") || "default-key-change-me";
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret.padEnd(32, "0").slice(0, 32)), "AES-GCM", false, ["decrypt"]);
}

async function decrypt(encoded: string): Promise<string> {
  if (!encoded) return "";
  try {
    const key = await getDecryptionKey();
    const data = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return "";
  }
}

async function loadCredentials(supabase: any): Promise<Record<string, string>> {
  const { data: rows } = await supabase.from("system_settings").select("*").in("setting_key", [
    "google_client_id", "google_client_secret", "google_refresh_token", "google_drive_folder_id",
  ]);
  const creds: Record<string, string> = {};
  for (const row of rows || []) {
    creds[row.setting_key] = row.is_encrypted && row.setting_value ? await decrypt(row.setting_value) : (row.setting_value || "");
  }
  return creds;
}

async function getAccessToken(creds: Record<string, string>): Promise<string> {
  if (!creds.google_client_id || !creds.google_client_secret || !creds.google_refresh_token) {
    throw new Error("Google Drive not configured. Please add credentials in Backup Settings.");
  }
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
    throw new Error("Failed to refresh Google access token: " + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isSuperAdmin = roles?.some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) throw new Error("Only Super Admin can perform cloud backups");

    const { action, backup_content, backup_file_name } = await req.json();

    // Load credentials from DB (encrypted)
    const creds = await loadCredentials(supabase);

    if (!creds.google_client_id || !creds.google_client_secret || !creds.google_refresh_token) {
      return new Response(JSON.stringify({
        success: false,
        error: "Google Drive not configured. Please add credentials in Backup Settings.",
        needs_setup: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const accessToken = await getAccessToken(creds);
    const folderId = creds.google_drive_folder_id?.trim() || null;

    if (action === "upload") {
      if (!backup_content || !backup_file_name) throw new Error("Missing backup_content or backup_file_name");

      // Determine target folder
      let targetFolderId: string;
      if (folderId) {
        targetFolderId = folderId;
      } else {
        const folderName = "ERP Backups";
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const searchData = await searchRes.json();
        if (searchData.files?.length > 0) {
          targetFolderId = searchData.files[0].id;
        } else {
          const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ name: folderName, mimeType: "application/vnd.google-apps.folder" }),
          });
          targetFolderId = (await createRes.json()).id;
        }
      }

      const now = new Date();
      const ts = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}_${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}_${String(now.getMinutes()).padStart(2, "0")}`;
      const fileName = `erp_backup_${ts}.sql`;

      const metadata = JSON.stringify({ name: fileName, parents: [targetFolderId] });
      const boundary = "backup_boundary_" + Date.now();
      const content = typeof backup_content === "string" ? backup_content : JSON.stringify(backup_content);
      const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink",
        { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body }
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error("Google Drive upload failed: " + JSON.stringify(uploadData));

      await supabase.from("audit_log").insert({
        user_id: user.id, user_name: user.email, module: "Backup", action: "Cloud Backup",
        details: `Uploaded ${fileName} to Google Drive folder ${targetFolderId} (file ID: ${uploadData.id})`,
        record_id: uploadData.id,
      });

      await supabase.from("backup_history").insert({
        file_name: fileName, backup_type: "cloud", format: "sql", status: "completed",
        storage_path: `gdrive://${uploadData.id}`, created_by: user.id,
        file_size: content.length,
      });

      return new Response(JSON.stringify({
        success: true, file_id: uploadData.id, file_name: fileName,
        web_link: uploadData.webViewLink, folder_id: targetFolderId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      let query = "name contains 'erp_backup' and trashed=false";
      if (folderId) query += ` and '${folderId}' in parents`;

      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&pageSize=20&fields=files(id,name,size,createdTime,webViewLink)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const listData = await listRes.json();

      return new Response(JSON.stringify({
        success: true, files: listData.files || [], folder_id: folderId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "check_config") {
      return new Response(JSON.stringify({
        success: true, configured: true,
        has_folder_id: !!folderId, folder_id: folderId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Unknown action: " + action);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("google-drive-backup error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
