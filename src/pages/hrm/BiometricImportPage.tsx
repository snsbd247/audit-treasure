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
import { toast } from "sonner";
import { Upload, Play, Fingerprint } from "lucide-react";

interface BiometricLog {
  id: string;
  device_id: string;
  employee_code: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  processed: boolean;
}

export default function BiometricImportPage() {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("hrm", "can_edit");
  const [logs, setLogs] = useState<BiometricLog[]>([]);
  const [processing, setProcessing] = useState(false);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase.from("biometric_logs" as any).select("*").order("date", { ascending: false }).limit(200);
    if (data) setLogs(data as any);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split("\n");
    const header = lines[0].toLowerCase();

    const records: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim());
      if (cols.length < 4) continue;
      records.push({
        device_id: cols[0] || "DEVICE-01",
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

  const processLogs = async () => {
    setProcessing(true);
    const unprocessed = logs.filter(l => !l.processed);
    let count = 0;

    for (const log of unprocessed) {
      // Find employee by code
      const { data: emp } = await supabase.from("employees" as any)
        .select("id, shift_id")
        .eq("employee_code", log.employee_code)
        .single();

      if (!emp) continue;

      // Determine status based on shift
      let status = "present";
      if ((emp as any).shift_id) {
        const { data: shift } = await supabase.from("shifts" as any).select("start_time, late_after_minutes").eq("id", (emp as any).shift_id).single();
        if (shift && log.check_in_time) {
          const shiftStart = (shift as any).start_time;
          const lateMin = (shift as any).late_after_minutes || 15;
          const [sh, sm] = shiftStart.split(":").map(Number);
          const [ch, cm] = log.check_in_time.split(":").map(Number);
          const shiftMinutes = sh * 60 + sm + lateMin;
          const checkMinutes = ch * 60 + cm;
          if (checkMinutes > shiftMinutes) status = "late";
        }
      }

      // Check if attendance already exists
      const { data: existing } = await supabase.from("attendance" as any)
        .select("id")
        .eq("employee_id", (emp as any).id)
        .eq("date", log.date)
        .single();

      if (existing) {
        await supabase.from("attendance" as any).update({
          check_in: log.check_in_time, check_out: log.check_out_time, status,
        }).eq("id", (existing as any).id);
      } else {
        await supabase.from("attendance" as any).insert({
          employee_id: (emp as any).id, date: log.date,
          check_in: log.check_in_time, check_out: log.check_out_time, status,
        });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Biometric Attendance</h1>
          <p className="text-muted-foreground">Import and process biometric device logs</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-foreground">{logs.length}</p><p className="text-sm text-muted-foreground">Total Logs</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-warning">{unprocessedCount}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-success">{logs.length - unprocessedCount}</p><p className="text-sm text-muted-foreground">Processed</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Fingerprint className="w-5 h-5" />Biometric Logs</CardTitle>
        </CardHeader>
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
                  <TableCell className="font-mono text-xs">{l.device_id}</TableCell>
                  <TableCell className="font-mono">{l.employee_code}</TableCell>
                  <TableCell>{l.date}</TableCell>
                  <TableCell>{l.check_in_time || "-"}</TableCell>
                  <TableCell>{l.check_out_time || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={l.processed ? "default" : "secondary"}>
                      {l.processed ? "Processed" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No biometric logs imported</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
