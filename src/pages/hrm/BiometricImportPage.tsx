import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Play, Fingerprint, Plus, Wifi, WifiOff, Edit2, Trash2, Server } from "lucide-react";

interface BiometricLog {
  id: string;
  device_id: string;
  device_name: string;
  employee_code: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  processed: boolean;
}

interface BiometricDevice {
  id: string;
  device_name: string;
  ip_address: string;
  port: number;
  location: string | null;
  status: string;
  last_sync_at: string | null;
  created_at: string;
}

export default function BiometricImportPage() {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("hrm", "can_edit");
  const [logs, setLogs] = useState<BiometricLog[]>([]);
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [processing, setProcessing] = useState(false);
  const [deviceDialog, setDeviceDialog] = useState(false);
  const [editDevice, setEditDevice] = useState<BiometricDevice | null>(null);
  const [deviceForm, setDeviceForm] = useState({ device_name: "", ip_address: "", port: 4370, location: "" });

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase.from("biometric_logs" as any).select("*").order("date", { ascending: false }).limit(200);
    if (data) setLogs(data as any);
  }, []);

  const fetchDevices = useCallback(async () => {
    const { data } = await supabase.from("biometric_devices" as any).select("*").order("device_name");
    if (data) setDevices(data as any);
  }, []);

  useEffect(() => { fetchLogs(); fetchDevices(); }, [fetchLogs, fetchDevices]);

  // Device CRUD
  const openAddDevice = () => {
    setEditDevice(null);
    setDeviceForm({ device_name: "", ip_address: "", port: 4370, location: "" });
    setDeviceDialog(true);
  };

  const openEditDevice = (d: BiometricDevice) => {
    setEditDevice(d);
    setDeviceForm({ device_name: d.device_name, ip_address: d.ip_address, port: d.port, location: d.location || "" });
    setDeviceDialog(true);
  };

  const saveDevice = async () => {
    if (!deviceForm.device_name || !deviceForm.ip_address) { toast.error("Device name and IP are required"); return; }
    if (editDevice) {
      const { error } = await supabase.from("biometric_devices" as any).update(deviceForm as any).eq("id", editDevice.id);
      if (error) toast.error(error.message); else { toast.success("Device updated"); fetchDevices(); setDeviceDialog(false); }
    } else {
      const { error } = await supabase.from("biometric_devices" as any).insert(deviceForm as any);
      if (error) toast.error(error.message); else { toast.success("Device added"); fetchDevices(); setDeviceDialog(false); }
    }
  };

  const deleteDevice = async (id: string) => {
    if (!confirm("Delete this device?")) return;
    const { error } = await supabase.from("biometric_devices" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Device deleted"); fetchDevices(); }
  };

  // CSV Import
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n");
    const records: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim());
      if (cols.length < 4) continue;
      records.push({
        device_id: cols[0] || "DEVICE-01",
        device_name: cols[0] || "DEVICE-01",
        employee_code: cols[1],
        date: cols[2],
        check_in_time: cols[3] || null,
        check_out_time: cols[4] || null,
        processed: false,
      });
    }
    if (records.length === 0) { toast.error("No valid records found"); return; }
    const { error } = await supabase.from("biometric_logs" as any).insert(records);
    if (error) toast.error(error.message);
    else { toast.success(`Imported ${records.length} biometric logs`); fetchLogs(); }
    e.target.value = "";
  };

  // Process logs into attendance
  const processLogs = async () => {
    setProcessing(true);
    const unprocessed = logs.filter(l => !l.processed);
    let count = 0;
    for (const log of unprocessed) {
      const { data: emp } = await supabase.from("employees" as any).select("id, shift_id").eq("employee_code", log.employee_code).single();
      if (!emp) continue;
      let status = "present";
      if ((emp as any).shift_id) {
        const { data: shift } = await supabase.from("shifts" as any).select("start_time, late_after_minutes").eq("id", (emp as any).shift_id).single();
        if (shift && log.check_in_time) {
          const [sh, sm] = (shift as any).start_time.split(":").map(Number);
          const [ch, cm] = log.check_in_time.split(":").map(Number);
          if (ch * 60 + cm > sh * 60 + sm + ((shift as any).late_after_minutes || 15)) status = "late";
        }
      }
      const { data: existing } = await supabase.from("attendance" as any).select("id").eq("employee_id", (emp as any).id).eq("date", log.date).single();
      if (existing) {
        await supabase.from("attendance" as any).update({ check_in: log.check_in_time, check_out: log.check_out_time, status }).eq("id", (existing as any).id);
      } else {
        await supabase.from("attendance" as any).insert({ employee_id: (emp as any).id, date: log.date, check_in: log.check_in_time, check_out: log.check_out_time, status });
      }
      await supabase.from("biometric_logs" as any).update({ processed: true } as any).eq("id", log.id);
      count++;
    }
    toast.success(`Processed ${count} biometric records into attendance`);
    setProcessing(false);
    fetchLogs();
  };

  const unprocessedCount = logs.filter(l => !l.processed).length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Biometric Attendance</h1>
          <p className="text-muted-foreground">Manage devices, import and process biometric logs</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                  <Upload className="w-4 h-4" />Import CSV
                </div>
              </Label>
              <Input id="csv-upload" type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              <Button onClick={processLogs} disabled={processing || unprocessedCount === 0}>
                <Play className="w-4 h-4 mr-2" />{processing ? "Processing..." : `Process (${unprocessedCount})`}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Devices ({devices.length})</TabsTrigger>
          <TabsTrigger value="logs">Biometric Logs ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5" />Biometric Devices (ZKTeco)</CardTitle>
              {isAdmin && <Button onClick={openAddDevice} size="sm"><Plus className="w-4 h-4 mr-2" />Add Device</Button>}
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted/50 rounded-md">
                Register your ZKTeco biometric devices here. The Laravel backend will use these details to auto-sync attendance logs via the <code>php artisan attendance:sync</code> command.
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Name</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.device_name}</TableCell>
                      <TableCell className="font-mono text-sm">{d.ip_address}</TableCell>
                      <TableCell>{d.port}</TableCell>
                      <TableCell>{d.location || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{d.last_sync_at ? new Date(d.last_sync_at).toLocaleString() : "Never"}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === "active" ? "default" : "secondary"} className="capitalize gap-1">
                          {d.status === "active" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {d.status}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDevice(d)}><Edit2 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDevice(d.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {devices.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No devices registered</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-foreground">{logs.length}</p><p className="text-sm text-muted-foreground">Total Logs</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-yellow-500">{unprocessedCount}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-500">{logs.length - unprocessedCount}</p><p className="text-sm text-muted-foreground">Processed</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Fingerprint className="w-5 h-5" />Biometric Logs</CardTitle></CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted/50 rounded-md">
                CSV format: <code>device_id, employee_code, date (YYYY-MM-DD), check_in_time (HH:MM), check_out_time (HH:MM)</code>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.device_name || l.device_id}</TableCell>
                      <TableCell className="font-mono">{l.employee_code}</TableCell>
                      <TableCell>{l.date}</TableCell>
                      <TableCell>{l.check_in_time || "-"}</TableCell>
                      <TableCell>{l.check_out_time || "-"}</TableCell>
                      <TableCell><Badge variant={l.processed ? "default" : "secondary"}>{l.processed ? "Processed" : "Pending"}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No biometric logs imported</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Device Dialog */}
      <Dialog open={deviceDialog} onOpenChange={setDeviceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editDevice ? "Edit Device" : "Add Biometric Device"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Device Name *</Label><Input value={deviceForm.device_name} onChange={e => setDeviceForm({...deviceForm, device_name: e.target.value})} placeholder="e.g. Main Gate ZKTeco" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>IP Address *</Label><Input value={deviceForm.ip_address} onChange={e => setDeviceForm({...deviceForm, ip_address: e.target.value})} placeholder="192.168.1.100" /></div>
              <div><Label>Port</Label><Input type="number" value={deviceForm.port} onChange={e => setDeviceForm({...deviceForm, port: Number(e.target.value)})} /></div>
            </div>
            <div><Label>Location</Label><Input value={deviceForm.location} onChange={e => setDeviceForm({...deviceForm, location: e.target.value})} placeholder="e.g. Ground Floor Entrance" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDeviceDialog(false)}>Cancel</Button><Button onClick={saveDevice}>{editDevice ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
