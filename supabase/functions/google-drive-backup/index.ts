import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");
    const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    // Check super admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isSuperAdmin = roles?.some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) throw new Error("Only Super Admin can perform cloud backups");

    const { action, backup_content, backup_file_name } = await req.json();

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Google Drive not configured. Please add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN secrets.",
          needs_setup: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error("Failed to refresh Google access token: " + JSON.stringify(tokenData));
    }
    const accessToken = tokenData.access_token;

    if (action === "upload") {
      if (!backup_content || !backup_file_name) {
        throw new Error("Missing backup_content or backup_file_name");
      }

      // Determine target folder
      let folderId: string;

      if (GOOGLE_DRIVE_FOLDER_ID && GOOGLE_DRIVE_FOLDER_ID.trim()) {
        // Use configured folder ID directly
        folderId = GOOGLE_DRIVE_FOLDER_ID.trim();
      } else {
        // Fallback: find or create "ERP Backups" folder in root
        const folderName = "ERP Backups";
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const searchData = await searchRes.json();

        if (searchData.files && searchData.files.length > 0) {
          folderId = searchData.files[0].id;
        } else {
          const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: folderName,
              mimeType: "application/vnd.google-apps.folder",
            }),
          });
          const createData = await createRes.json();
          folderId = createData.id;
        }
      }

      // Generate backup filename with timestamp
      const now = new Date();
      const ts = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}_${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}_${String(now.getMinutes()).padStart(2, "0")}`;
      const fileName = `erp_backup_${ts}.sql`;

      // Upload file using multipart
      const metadata = JSON.stringify({
        name: fileName,
        parents: [folderId],
      });

      const boundary = "backup_boundary_" + Date.now();
      const body = [
        `--${boundary}`,
        "Content-Type: application/json; charset=UTF-8",
        "",
        metadata,
        `--${boundary}`,
        "Content-Type: application/json",
        "",
        typeof backup_content === "string" ? backup_content : JSON.stringify(backup_content),
        `--${boundary}--`,
      ].join("\r\n");

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body,
        }
      );

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error("Google Drive upload failed: " + JSON.stringify(uploadData));
      }

      // Log to audit
      await supabase.from("audit_log").insert({
        user_id: user.id,
        user_name: user.email,
        module: "Backup",
        action: "Cloud Backup",
        details: `Uploaded ${fileName} to Google Drive folder ${folderId} (file ID: ${uploadData.id})`,
        record_id: uploadData.id,
      });

      // Store backup history
      await supabase.from("backup_history").insert({
        file_name: fileName,
        backup_type: "cloud",
        format: "sql",
        status: "completed",
        storage_path: `gdrive://${uploadData.id}`,
        created_by: user.id,
        file_size: typeof backup_content === "string" ? backup_content.length : JSON.stringify(backup_content).length,
      });

      return new Response(
        JSON.stringify({
          success: true,
          file_id: uploadData.id,
          file_name: fileName,
          web_link: uploadData.webViewLink,
          folder_id: folderId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list") {
      // List backups — search in configured folder or all
      let query = "name contains 'erp_backup' and trashed=false";
      if (GOOGLE_DRIVE_FOLDER_ID && GOOGLE_DRIVE_FOLDER_ID.trim()) {
        query += ` and '${GOOGLE_DRIVE_FOLDER_ID.trim()}' in parents`;
      }

      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&pageSize=20&fields=files(id,name,size,createdTime,webViewLink)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const listData = await listRes.json();

      return new Response(
        JSON.stringify({
          success: true,
          files: listData.files || [],
          folder_id: GOOGLE_DRIVE_FOLDER_ID || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_config") {
      return new Response(
        JSON.stringify({
          success: true,
          configured: true,
          has_folder_id: !!(GOOGLE_DRIVE_FOLDER_ID && GOOGLE_DRIVE_FOLDER_ID.trim()),
          folder_id: GOOGLE_DRIVE_FOLDER_ID || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Unknown action: " + action);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("google-drive-backup error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
