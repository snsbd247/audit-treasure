import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, Database, Clock, FileText, Trash2, AlertTriangle, CheckCircle, XCircle, Settings, RefreshCw, Cloud, Eye, EyeOff, Save, Wifi, WifiOff, Shield } from "lucide-react";

interface BackupRecord {
  id: string; file_name: string; file_size: number; backup_type: string; format: string;
  status: string; tables_count: number; records_count: number; storage_path: string | null;
  created_at: string; error_message: string | null;
}

interface BackupSettings {
  auto_backup_enabled: boolean; schedule_interval: string; retention_days: number;
  last_auto_backup_at: string | null;
}

interface GDriveSettingInfo {
  masked: string; is_encrypted: boolean; has_value: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

const GDRIVE_FIELDS = [
  { key: "google_client_id", label: "Google Client ID", desc: "From Google Cloud Console → Credentials", sensitive: false },
  { key: "google_client_secret", label: "Google Client Secret", desc: "From Google Cloud Console → Credentials", sensitive: true },
  { key: "google_refresh_token", label: "Google Refresh Token", desc: "Generated via OAuth 2.0 Playground", sensitive: true },
  { key: "google_drive_folder_id", label: "Google Drive Folder ID", desc: "Optional — Target folder ID in Google Drive", sensitive: false },
];

const BackupPage = () => {
  const { toast } = useToast();
  const { isSuperAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState("local");
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<"json" | "sql">("json");
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [cloudUploading, setCloudUploading] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<any[]>([]);

  // Google Drive settings state
  const [gdriveInfo, setGdriveInfo] = useState<Record<string, GDriveSettingInfo>>({});
  const [gdriveValues, setGdriveValues] = useState<Record<string, string>>({});
  const [gdriveVisible, setGdriveVisible] = useState<Record<string, boolean>>({});
  const [savingGdrive, setSavingGdrive] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    return session;
  };

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await supabase.from("backup_history").select("*").order("created_at", { ascending: false }).limit(50);
    setHistory((data as any as BackupRecord[]) || []);
    setLoadingHistory(false);
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from("backup_settings").select("*").eq("id", "default").single();
    if (data) setSettings(data as any as BackupSettings);
  }, []);

  const fetchGdriveSettings = useCallback(async () => {
    try {
      const session = await getSession();
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/backup-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: "get" }),
      });
      const result = await res.json();
      if (result.success) setGdriveInfo(result.settings);
    } catch { /* silently fail */ }
  }, [projectId]);

  useEffect(() => {
    fetchHistory();
    fetchSettings();
    fetchGdriveSettings();
    fetchCloudFiles();
  }, [fetchHistory, fetchSettings, fetchGdriveSettings]);

  const handleExport = async () => {
    setExporting(true); setProgress(10);
    try {
      const session = await getSession();
      setProgress(30);
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/create-backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ format: exportFormat, backup_type: "manual" }),
      });
      setProgress(70);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      const blob = new Blob([result.content], { type: exportFormat === "sql" ? "text/sql" : "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = result.file_name; a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Backup created", description: `${result.tables_count} tables, ${result.records_count} records exported.` });
      fetchHistory();
    } catch (err: any) {
      toast({ title: "Backup failed", description: err.message, variant: "destructive" });
    } finally { setTimeout(() => { setExporting(false); setProgress(0); }, 500); }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.name.endsWith(".json") && !file.name.endsWith(".sql")) {
      toast({ title: "Invalid file", description: "Please select a .json or .sql backup file.", variant: "destructive" });
      e.target.value = ""; return;
    }
    setRestoreFile(file); setConfirmRestore(true); e.target.value = "";
  };

  const executeRestore = async () => {
    if (!restoreFile) return;
    setConfirmRestore(false); setRestoring(true); setProgress(10);
    try {
      const session = await getSession();
      const text = await restoreFile.text();
      const format = restoreFile.name.endsWith(".sql") ? "sql" : "json";
      if (format === "sql") {
        toast({ title: "SQL Restore", description: "SQL backups must be restored via the Supabase SQL Editor.", variant: "destructive" });
        setRestoring(false); setProgress(0); return;
      }
      let parsed; try { parsed = JSON.parse(text); } catch { throw new Error("Invalid JSON file"); }
      setProgress(30);
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/restore-backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ content: parsed, format: "json", file_name: restoreFile.name }),
      });
      setProgress(80);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setProgress(100);
      toast({ title: "Restore completed", description: `${result.records_restored} records restored.` });
      fetchHistory();
    } catch (err: any) {
      toast({ title: "Restore failed", description: err.message, variant: "destructive" });
    } finally { setTimeout(() => { setRestoring(false); setProgress(0); setRestoreFile(null); }, 500); }
  };

  const handleDownloadFromHistory = async (record: BackupRecord) => {
    if (!record.storage_path) { toast({ title: "File not available", variant: "destructive" }); return; }
    if (record.storage_path.startsWith("gdrive://")) {
      toast({ title: "Cloud backup", description: "Download cloud backups from Google Drive directly." }); return;
    }
    try {
      const { data, error } = await supabase.storage.from("backups").download(record.storage_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a"); a.href = url; a.download = record.file_name; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) { toast({ title: "Download failed", description: err.message, variant: "destructive" }); }
  };

  const handleDeleteBackup = async (id: string) => {
    const record = history.find((h) => h.id === id);
    if (record?.storage_path && !record.storage_path.startsWith("gdrive://")) {
      await supabase.storage.from("backups").remove([record.storage_path]);
    }
    await supabase.from("backup_history").delete().eq("id", id);
    setConfirmDelete(null); fetchHistory();
    toast({ title: "Backup deleted" });
  };

  const saveScheduleSettings = async (updates: Partial<BackupSettings>) => {
    setSavingSettings(true);
    const newSettings = { ...settings, ...updates, updated_by: user?.id, updated_at: new Date().toISOString() };
    await supabase.from("backup_settings").update(newSettings as any).eq("id", "default");
    setSettings({ ...settings!, ...updates }); setSavingSettings(false);
    toast({ title: "Settings saved" });
  };

  const handleCloudBackup = async () => {
    setCloudUploading(true);
    try {
      const session = await getSession();
      const backupRes = await fetch(`https://${projectId}.supabase.co/functions/v1/create-backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ format: "json", backup_type: "cloud" }),
      });
      const backupResult = await backupRes.json();
      if (!backupResult.success) throw new Error(backupResult.error);

      const driveRes = await fetch(`https://${projectId}.supabase.co/functions/v1/google-drive-backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: "upload", backup_content: backupResult.content, backup_file_name: backupResult.file_name }),
      });
      const driveResult = await driveRes.json();
      if (!driveResult.success) {
        if (driveResult.needs_setup) {
          toast({ title: "Google Drive not configured", description: "Go to the Settings tab to configure Google Drive credentials.", variant: "destructive" });
          setActiveTab("settings");
        } else throw new Error(driveResult.error);
        return;
      }
      toast({ title: "Cloud backup successful", description: `Uploaded ${driveResult.file_name} to Google Drive` });
      fetchCloudFiles(); fetchHistory();
    } catch (err: any) {
      toast({ title: "Cloud backup failed", description: err.message, variant: "destructive" });
    } finally { setCloudUploading(false); }
  };

  const fetchCloudFiles = async () => {
    try {
      const session = await getSession();
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/google-drive-backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: "list" }),
      });
      const result = await res.json();
      if (result.success) setCloudFiles(result.files || []);
    } catch { /* silently fail */ }
  };

  const handleSaveGdriveSettings = async () => {
    const nonEmptyValues = Object.fromEntries(Object.entries(gdriveValues).filter(([, v]) => v !== ""));
    if (Object.keys(nonEmptyValues).length === 0) {
      toast({ title: "No changes", description: "Enter values to save.", variant: "destructive" }); return;
    }
    setSavingGdrive(true);
    try {
      const session = await getSession();
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/backup-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: "save", settings: nonEmptyValues }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Credentials saved", description: "Google Drive credentials have been encrypted and stored securely." });
      setGdriveValues({});
      fetchGdriveSettings();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSavingGdrive(false); }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true); setConnectionStatus(null);
    try {
      const session = await getSession();
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/backup-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: "test" }),
      });
      const result = await res.json();
      setConnectionStatus({ ok: result.success, message: result.success ? result.message : result.error });
    } catch (err: any) {
      setConnectionStatus({ ok: false, message: err.message });
    } finally { setTestingConnection(false); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="default" className="bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "completed_with_errors": return <Badge variant="secondary" className="bg-yellow-600 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Partial</Badge>;
      default: return <Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-destructive font-medium">Access Denied</p>
          <p className="text-sm text-muted-foreground">Only Super Admins can access Backup & Restore.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Backup & Restore</h1>
      </div>

      {(exporting || restoring) && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{exporting ? "Creating backup..." : "Restoring data..."}</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="local">Local Backup</TabsTrigger>
          <TabsTrigger value="cloud">Google Drive</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Local Backup Tab */}
        <TabsContent value="local">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4" />Create Backup</CardTitle>
                <CardDescription>Export database as JSON or SQL file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label className="text-sm whitespace-nowrap">Format:</Label>
                  <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "json" | "sql")}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {exportFormat === "json" ? "JSON format — portable, supports programmatic restore." : "SQL format — INSERT statements with ON CONFLICT."}
                </p>
                <Button onClick={handleExport} disabled={exporting || restoring}>
                  <Download className="w-4 h-4 mr-2" />{exporting ? "Exporting..." : "Download Backup"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4" />Restore Database</CardTitle>
                <CardDescription>Upload a backup file to restore data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">Upload a .json backup file. SQL files must be run in Supabase SQL Editor.</p>
                <label>
                  <input type="file" accept=".json,.sql" onChange={handleRestoreFile} className="hidden" disabled={exporting || restoring} />
                  <Button asChild variant="outline" className={restoring ? "pointer-events-none opacity-50" : ""}>
                    <span><Upload className="w-4 h-4 mr-2" />{restoring ? "Restoring..." : "Upload & Restore"}</span>
                  </Button>
                </label>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Google Drive Tab */}
        <TabsContent value="cloud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Cloud className="w-4 h-4" />Google Drive Cloud Backup</CardTitle>
              <CardDescription>Upload backups to Google Drive for offsite cloud storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button onClick={handleCloudBackup} disabled={cloudUploading || exporting || restoring}>
                  <Cloud className="w-4 h-4 mr-2" />{cloudUploading ? "Uploading to Drive..." : "Backup to Google Drive"}
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("settings")}>
                  <Settings className="w-4 h-4 mr-2" />Configure
                </Button>
              </div>

              {cloudFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Recent Cloud Backups:</p>
                  {cloudFiles.slice(0, 8).map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between text-xs p-2 rounded border border-border">
                      <span className="font-mono truncate max-w-[300px]">{f.name}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {f.size && <span>{formatFileSize(Number(f.size))}</span>}
                        <span>{f.createdTime ? new Date(f.createdTime).toLocaleDateString() : ""}</span>
                        {f.webViewLink && (
                          <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                <p><strong>Backup File Format:</strong> <code>erp_backup_YYYY_MM_DD_HH_MM.sql</code></p>
                <p><strong>Example:</strong> <code>erp_backup_2026_03_17_14_30.sql</code></p>
                <p><strong>Folder:</strong> If Folder ID is configured, uploads go to that folder. Otherwise, an "ERP Backups" folder is auto-created.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab — Google Drive Credentials */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Google Drive Credentials</CardTitle>
              <CardDescription>Credentials are encrypted and stored securely in the database. They are never exposed to the frontend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {GDRIVE_FIELDS.map(({ key, label, desc, sensitive }) => {
                  const info = gdriveInfo[key];
                  const isVisible = gdriveVisible[key] || false;
                  const currentValue = gdriveValues[key] ?? "";

                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{label}</Label>
                        <div className="flex items-center gap-2">
                          {info?.has_value && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">
                              <CheckCircle className="w-3 h-3 mr-1" />Configured
                            </Badge>
                          )}
                          {info?.is_encrypted && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />Encrypted
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={sensitive && !isVisible ? "password" : "text"}
                            placeholder={info?.has_value ? info.masked : `Enter ${label}`}
                            value={currentValue}
                            onChange={(e) => setGdriveValues((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="pr-10"
                          />
                          {sensitive && (
                            <button
                              type="button"
                              onClick={() => setGdriveVisible((prev) => ({ ...prev, [key]: !prev[key] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Button onClick={handleSaveGdriveSettings} disabled={savingGdrive}>
                  <Save className="w-4 h-4 mr-2" />{savingGdrive ? "Saving..." : "Save Credentials"}
                </Button>
                <Button variant="outline" onClick={handleTestConnection} disabled={testingConnection}>
                  {testingConnection ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
                  {testingConnection ? "Testing..." : "Test Connection"}
                </Button>
              </div>

              {connectionStatus && (
                <div className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
                  connectionStatus.ok
                    ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}>
                  {connectionStatus.ok ? <Wifi className="w-4 h-4 mt-0.5 shrink-0" /> : <WifiOff className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{connectionStatus.message}</span>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                <p><strong>Security:</strong> Client Secret and Refresh Token are encrypted with AES-GCM before storage.</p>
                <p><strong>Decryption:</strong> Values are only decrypted server-side when performing backups.</p>
                <p><strong>Audit:</strong> All credential changes are logged to the audit trail.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" />Backup History</CardTitle>
                <CardDescription>Previous backups and restore operations</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchHistory}><RefreshCw className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No backup history yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>File</TableHead><TableHead>Type</TableHead><TableHead>Format</TableHead>
                      <TableHead>Size</TableHead><TableHead>Tables</TableHead><TableHead>Records</TableHead>
                      <TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {history.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">{r.file_name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs capitalize">{r.backup_type}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs uppercase">{r.format}</Badge></TableCell>
                          <TableCell className="text-xs">{formatFileSize(r.file_size)}</TableCell>
                          <TableCell className="text-xs">{r.tables_count}</TableCell>
                          <TableCell className="text-xs">{r.records_count}</TableCell>
                          <TableCell>{statusBadge(r.status)}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {r.storage_path && r.backup_type !== "restore" && (
                                <Button variant="ghost" size="sm" onClick={() => handleDownloadFromHistory(r)}>
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(r.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4" />Backup Schedule</CardTitle>
                <CardDescription>Configure automatic backups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 items-end">
                  <div className="flex items-center gap-3">
                    <Switch checked={settings.auto_backup_enabled} onCheckedChange={(v) => saveScheduleSettings({ auto_backup_enabled: v })} disabled={savingSettings} />
                    <Label className="text-sm">Enable automatic backups</Label>
                  </div>
                  {settings.auto_backup_enabled && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Interval</Label>
                        <Select value={settings.schedule_interval} onValueChange={(v) => saveScheduleSettings({ schedule_interval: v })}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Retention (days)</Label>
                        <Select value={String(settings.retention_days)} onValueChange={(v) => saveScheduleSettings({ retention_days: Number(v) })}>
                          <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7</SelectItem>
                            <SelectItem value="14">14</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="90">90</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  {settings.last_auto_backup_at && (
                    <p className="text-xs text-muted-foreground">Last auto backup: {formatDate(settings.last_auto_backup_at)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Backup Information</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• <strong>JSON backup:</strong> Portable format — supports automatic restore from this page</p>
                <p>• <strong>SQL backup:</strong> INSERT statements with ON CONFLICT — restore via Supabase SQL Editor</p>
                <p>• <strong>Cloud backup:</strong> Files are named <code>erp_backup_YYYY_MM_DD_HH_MM.sql</code> and uploaded to Google Drive</p>
                <p>• <strong>Security:</strong> Only Super Admins can create backups, restore data, and configure Google Drive</p>
                <p>• <strong>Audit:</strong> All backup and restore operations are logged to the audit trail</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <Dialog open={confirmRestore} onOpenChange={setConfirmRestore}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" />Confirm Database Restore</DialogTitle>
            <DialogDescription>
              You are about to restore from <strong>{restoreFile?.name}</strong>. This will update existing records and add new ones.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
            <strong>Warning:</strong> Create a backup before restoring to prevent data loss.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmRestore(false); setRestoreFile(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={executeRestore}><Upload className="w-4 h-4 mr-2" />Confirm Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Backup Record</DialogTitle>
            <DialogDescription>This will permanently delete this backup record and its stored file.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDeleteBackup(confirmDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupPage;
