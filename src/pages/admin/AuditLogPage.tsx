import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Search } from "lucide-react";

const AuditLogPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    if (filterModule) query = query.eq("module", filterModule);
    if (filterAction) query = query.eq("action", filterAction);
    if (filterFrom) query = query.gte("created_at", filterFrom);
    if (filterTo) query = query.lte("created_at", filterTo + "T23:59:59");
    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchLogs(); }, []);

  const actionColor = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action === "delete") return "destructive";
    if (action === "create") return "default";
    if (action === "approve") return "default";
    return "secondary";
  };

  const MODULES = ["Dashboard", "Accounts", "Sales", "Purchase", "Manufacturing", "Inventory", "Reports", "Administration", "Users", "Branches", "Roles"];
  const ACTIONS = ["create", "edit", "delete", "approve", "reject", "login", "logout"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2"><ScrollText className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Audit Log</h1></div>

      <div className="flex gap-4 items-end flex-wrap">
        <div className="space-y-2 w-44"><Label>Module</Label>
          <Select value={filterModule} onValueChange={setFilterModule}><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent><SelectItem value="">All</SelectItem>{MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2 w-36"><Label>Action</Label>
          <Select value={filterAction} onValueChange={setFilterAction}><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent><SelectItem value="">All</SelectItem>{ACTIONS.map((a) => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>From</Label><Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} /></div>
        <div className="space-y-2"><Label>To</Label><Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} /></div>
        <Button size="sm" onClick={fetchLogs}><Search className="w-4 h-4 mr-1" />Filter</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Module</TableHead><TableHead>Action</TableHead>
            <TableHead>Record ID</TableHead><TableHead>Details</TableHead><TableHead>IP</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : logs.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No audit logs found</TableCell></TableRow>
            : logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{log.user_name || "—"}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell><Badge variant={actionColor(log.action)} className="text-xs capitalize">{log.action}</Badge></TableCell>
                <TableCell className="font-geist-mono text-xs text-muted-foreground">{log.record_id || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{log.details || "—"}</TableCell>
                <TableCell className="font-geist-mono text-xs text-muted-foreground">{log.ip_address || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};
export default AuditLogPage;
