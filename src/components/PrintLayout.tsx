import { useRef, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Download, Mail, X } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PrintLayoutProps {
  open: boolean;
  onClose: () => void;
  title: string;
  docNumber: string;
  docDate: string;
  branch?: string;
  partyLabel?: string;
  partyName?: string;
  partyEmail?: string;
  notes?: string;
  children: ReactNode;
}

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px; color: #1a1a1a; padding: 20px; background: #fff; }
  .print-header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
  .print-header h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
  .print-header p { font-size: 11px; color: #666; }
  .doc-info { display: flex; justify-content: space-between; margin-bottom: 16px; padding: 8px 12px; background: #f8f8f8; border-radius: 4px; }
  .doc-info div { font-size: 12px; }
  .doc-info .label { font-weight: 600; color: #333; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f0f0f0; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 6px 10px; border: 1px solid #ddd; font-size: 12px; }
  .text-right { text-align: right; }
  .tabular { font-variant-numeric: tabular-nums; }
  .total-row { background: #f0f0f0; font-weight: 700; }
  .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 48px; }
  .sig-block { text-align: center; min-width: 150px; }
  .sig-line { border-top: 1px solid #666; padding-top: 4px; font-size: 11px; color: #666; }
  .notes { font-size: 11px; color: #555; margin-bottom: 8px; font-style: italic; }
  .timestamp { font-size: 10px; color: #999; text-align: right; margin-top: 16px; }
  @media print { body { padding: 0; } }
`;

export const PrintLayout = ({
  open, onClose, title, docNumber, docDate, branch, partyLabel, partyName, partyEmail, notes, children,
}: PrintLayoutProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { settings } = useCompanySettings();
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sending, setSending] = useState(false);

  const getHtmlContent = () => {
    const content = printRef.current;
    if (!content) return "";
    return `<!DOCTYPE html><html><head><title>${title} - ${docNumber}</title><style>${PRINT_STYLES}</style></head><body>${content.innerHTML}</body></html>`;
  };

  const handlePrint = () => {
    const html = getHtmlContent();
    if (!html) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handlePDF = () => handlePrint();

  const openEmailDialog = () => {
    setEmailTo(partyEmail || "");
    setEmailSubject(`${title} — ${docNumber}`);
    setEmailBody(`Dear ${partyName || "Sir/Madam"},\n\nPlease find attached ${title} ${docNumber} dated ${docDate}.\n\nRegards,\n${settings?.company_name || "Company"}`);
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast({ title: "Email required", description: "Please enter a recipient email.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const html = getHtmlContent();
      const { error } = await supabase.functions.invoke("send-document-email", {
        body: {
          to: emailTo,
          subject: emailSubject,
          body: emailBody,
          documentHtml: html,
          documentTitle: `${title}_${docNumber}`,
        },
      });
      if (error) throw error;
      toast({ title: "Email sent", description: `Document sent to ${emailTo}` });
      setEmailDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Email failed", description: err.message || "Could not send email.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Print Preview — {title}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={openEmailDialog}>
                  <Mail className="w-4 h-4 mr-1" />Email
                </Button>
                <Button size="sm" variant="outline" onClick={handlePDF}>
                  <Download className="w-4 h-4 mr-1" />PDF
                </Button>
                <Button size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1" />Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Force white background regardless of dark mode */}
          <div ref={printRef} className="print-preview-area p-6 rounded border" style={{ background: "#fff", color: "#1a1a1a" }}>
            {/* Header */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: "12px", marginBottom: "16px" }}>
              {settings?.company_logo_url && (
                <img src={settings.company_logo_url} alt="Logo" style={{ height: "48px", margin: "0 auto 8px", display: "block" }} />
              )}
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}>{settings?.company_name || "Company Name"}</h1>
              {settings?.address && <p style={{ fontSize: "11px", color: "#666" }}>{settings.address}</p>}
              <p style={{ fontSize: "11px", color: "#666" }}>
                {[settings?.phone && `Phone: ${settings.phone}`, settings?.email && `Email: ${settings.email}`].filter(Boolean).join(" | ")}
              </p>
              <h2 style={{ fontSize: "14px", fontWeight: 600, marginTop: "8px", textTransform: "uppercase", letterSpacing: "1px", color: "#1a1a1a" }}>{title}</h2>
            </div>

            {/* Doc Info */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", padding: "8px 12px", background: "#f8f8f8", borderRadius: "4px" }}>
              <div style={{ color: "#1a1a1a" }}><span style={{ fontWeight: 600 }}>Document #:</span> {docNumber}</div>
              <div style={{ color: "#1a1a1a" }}><span style={{ fontWeight: 600 }}>Date:</span> {docDate}</div>
              {branch && <div style={{ color: "#1a1a1a" }}><span style={{ fontWeight: 600 }}>Branch:</span> {branch}</div>}
              {partyName && <div style={{ color: "#1a1a1a" }}><span style={{ fontWeight: 600 }}>{partyLabel || "Party"}:</span> {partyName}</div>}
            </div>

            {/* Body */}
            {children}

            {/* Footer */}
            <div style={{ marginTop: "32px", borderTop: "1px solid #ddd", paddingTop: "16px" }}>
              {notes && <p style={{ fontSize: "11px", color: "#555", fontStyle: "italic", marginBottom: "8px" }}>Notes: {notes}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "48px" }}>
                {["Prepared By", "Checked By", "Authorized By"].map((label) => (
                  <div key={label} style={{ textAlign: "center", minWidth: "150px" }}>
                    <div style={{ borderTop: "1px solid #666", paddingTop: "4px", fontSize: "11px", color: "#666" }}>{label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "10px", color: "#999", textAlign: "right", marginTop: "16px" }}>
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Email Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>To</Label>
              <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSendEmail} disabled={sending}>
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
