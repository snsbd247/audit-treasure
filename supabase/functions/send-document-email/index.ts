import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, documentHtml, documentTitle } = await req.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'subject'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Resend or any SMTP relay. For now, we use a simple fetch to Resend API.
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      // Fallback: return the HTML so client can use mailto or download
      return new Response(
        JSON.stringify({ 
          error: "Email service not configured. Please add RESEND_API_KEY secret to enable email sending.",
          fallback: true 
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <pre style="white-space: pre-wrap; font-family: inherit;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #888;">This email includes the document as an HTML attachment.</p>
      </div>
    `;

    // Convert HTML document to base64 for attachment
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(documentHtml);
    const base64Html = btoa(String.fromCharCode(...htmlBytes));

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "noreply@resend.dev",
        to: [to],
        subject,
        html: emailHtml,
        attachments: [
          {
            filename: `${documentTitle || "document"}.html`,
            content: base64Html,
            content_type: "text/html",
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-document-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
