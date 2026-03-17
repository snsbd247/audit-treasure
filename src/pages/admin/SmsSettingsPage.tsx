import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Send, Settings, Phone, FileText } from "lucide-react";

interface SmsLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  response: string | null;
  event_type: string | null;
  created_at: string;
}

export default function SmsSettingsPage() {
  const { isSuperAdmin } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [senderId, setSenderId] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Test SMS from ERP System");
  const [sending, setSending] = useState(false);

  // Load settings from system_settings
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("system_settings" as any).select("*").in("setting_key", ["sms_api_key", "sms_sender_id", "sms_enabled"]);
      if (data) {
        (data as any[]).forEach((s: any) => {
          if (s.setting_key === "sms_api_key") setApiKey(s.setting_value || "");
          if (s.setting_key === "sms_sender_id") setSenderId(s.setting_value || "");
          if (s.setting_key === "sms_enabled") setSmsEnabled(s.setting_value === "true");
        });
      }
      // Load logs
      const { data: logData } = await supabase.from("sms_logs" as any).select("*").order("created_at", { ascending: false }).limit(100);
      if (logData) setLogs(logData as any);
    })();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("system_settings" as any).select("id").eq("setting_key", key).single();
    if (existing) {
      await supabase.from("system_settings" as any).update({ setting_value: value } as any).eq("setting_key", key);
    } else {
      await supabase.from("system_settings" as any).insert({ setting_key: key, setting_value: value } as any);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("sms_api_key", apiKey),
        saveSetting("sms_sender_id", senderId),
        saveSetting("sms_enabled", smsEnabled ? "true" : "false"),
      ]);
      toast.success("SMS settings saved");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const sendTestSms = async () => {
    if (!testPhone || !testMessage) { toast.error("Phone and message required"); return; }
    setSending(true);
    try {
      // Call edge function
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { phone: testPhone, message: testMessage, event_type: "test" },
      });
      if (error) throw error;
      toast.success("Test SMS sent successfully");
      setTestDialog(false);
      // Refresh logs
      const { data: logData } = await supabase.from("sms_logs" as any).select("*").order("created_at", { ascending: false }).limit(100);
      if (logData) setLogs(logData as any);
    } catch (e: any) {
      toast.error(e.message || "Failed to send SMS");
    }
    setSending(false);
  };

  const statusBadge = (s: string) => {
    const v = s === "sent" ? "default" : s === "failed" ? "destructive" : "secondary";
    return <Badge variant={v} className="capitalize">{s}</Badge>;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SMS Integration</h1>
          <p className="text-muted-foreground">Greenweb Bulk SMS — Configure API and view logs</p>
        </div>
        <Button onClick={() => setTestDialog(true)} disabled={!apiKey}>
          <Send className="w-4 h-4 mr-2" />Send Test SMS
        </Button>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">SMS Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="events">Event Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Greenweb SMS API Configuration</CardTitle>
              <CardDescription>Enter your Greenweb SMS API credentials. Get your API key from <a href="https://greenweb.com.bd" target="_blank" rel="noopener noreferrer" className="text-primary underline">greenweb.com.bd</a></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                <Label>Enable SMS Notifications</Label>
              </div>
              <div>
                <Label>API Key / Token</Label>
                <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your Greenweb API key" />
              </div>
              <div>
                <Label>Sender ID (Masking)</Label>
                <Input value={senderId} onChange={e => setSenderId(e.target.value)} placeholder="e.g. YourCompany" />
                <p className="text-xs text-muted-foreground mt-1">Approved masking name from Greenweb. Leave empty for default.</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />SMS Delivery Log</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{l.phone}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">{l.message}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{l.event_type || "-"}</Badge></TableCell>
                      <TableCell>{statusBadge(l.status)}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No SMS logs yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />SMS Event Rules</CardTitle>
              <CardDescription>Automatic SMS notifications for the following events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { event: "Sales Invoice Created", description: "Send SMS to customer when a sales invoice is created.", message: "Invoice Generated: Amount ৳{amount}. Thank you." },
                  { event: "Payroll Generated", description: "Send SMS to employee when payroll is approved.", message: "Salary credited: ৳{net_salary} for {month}/{year}." },
                  { event: "Leave Approved", description: "Send SMS to employee when leave is approved.", message: "Your leave request has been approved." },
                ].map((rule) => (
                  <div key={rule.event} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground text-sm">{rule.event}</h3>
                      <Badge variant="default" className="text-xs">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
                    <div className="bg-muted rounded p-2 text-xs font-mono">{rule.message}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test SMS Dialog */}
      <Dialog open={testDialog} onOpenChange={setTestDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Test SMS</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Phone Number</Label><Input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="01XXXXXXXXX" /></div>
            <div><Label>Message</Label><Textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialog(false)}>Cancel</Button>
            <Button onClick={sendTestSms} disabled={sending}>{sending ? "Sending..." : "Send SMS"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
