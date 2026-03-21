import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollText, Search, ShieldAlert, Eye, Activity, AlertTriangle } from "lucide-react";

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_name: string | null;
  module: string;
  action: string;
  record_id: string | null;
  details: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UserActivity {
  id: string;
  user_id: string | null;
  activity_type: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

interface SecurityAlert {
  type: string;
  severity: "high" | "medium" | "low";
  description: string;
  details: string;
  timestamp: string;
}

const MODULES = [
  "Accounts", "Sales", "Purchase", "Inventory",
  "HRM", "Payroll", "Users", "Branches", "Roles", "Settings",
  "Dashboard", "Administration", "users",
];
const ACTIONS = ["create", "edit", "delete", "approve", "reject", "login", "logout", "Data Transfer & Delete", "User Deleted"];

const AuditLogPage = () => {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState("__all__");
  const [filterAction, setFilterAction] = useState("__all__");
  const [filterUser, setFilterUser] = useState("__all__");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, name").order("name");
    setUsers((data || []) as any);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500);
    if (filterModule !== "__all__") query = query.eq("module", filterModule);
    if (filterAction !== "__all__") query = query.eq("action", filterAction);
    if (filterUser !== "__all__") query = query.eq("user_id", filterUser);
    if (filterFrom) query = query.gte("created_at", filterFrom);
    if (filterTo) query = query.lte("created_at", filterTo + "T23:59:59");
    const { data } = await query;
    setLogs((data || []) as any);
    setLoading(false);
  }, [filterModule, filterAction, filterUser, filterFrom, filterTo]);

  const fetchActivities = useCallback(async () => {
    let query = supabase.from("user_activities" as any).select("*").order("created_at", { ascending: false }).limit(200);
    if (filterUser !== "__all__") query = query.eq("user_id", filterUser);
    const { data } = await query;
    setActivities((data || []) as any);
  }, [filterUser]);

  const detectSecurityAlerts = useCallback(async () => {
    const alerts: SecurityAlert[] = [];

    // Check for multiple failed logins in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: failedLogins } = await supabase
      .from("user_activities" as any)
      .select("*")
      .eq("activity_type", "failed_login")
      .gte("created_at", oneHourAgo);

    if (failedLogins && failedLogins.length >= 3) {
      alerts.push({
        type: "failed_logins",
        severity: "high",
        description: `${failedLogins.length} failed login attempts in the last hour`,
        details: (failedLogins as any[]).map((f: any) => f.description).join("; "),
        timestamp: new Date().toISOString(),
      });
    }

    // Check for logins from different IPs for same user (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentLogins } = await supabase
      .from("user_activities" as any)
      .select("user_id, ip_address")
      .eq("activity_type", "login")
      .gte("created_at", oneDayAgo);

    if (recentLogins) {
      const userIps: Record<string, Set<string>> = {};
      (recentLogins as any[]).forEach((l: any) => {
        if (l.user_id && l.ip_address) {
          if (!userIps[l.user_id]) userIps[l.user_id] = new Set();
          userIps[l.user_id].add(l.ip_address);
        }
      });
      Object.entries(userIps).forEach(([userId, ips]) => {
        if (ips.size > 2) {
          alerts.push({
            type: "multi_ip_login",
            severity: "medium",
            description: `User logged in from ${ips.size} different IPs in 24h`,
            details: `User ID: ${userId}, IPs: ${Array.from(ips).join(", ")}`,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }

    // Check for unusual delete activity
    const { data: recentDeletes } = await supabase
      .from("audit_log")
      .select("user_name")
      .eq("action", "delete")
      .gte("created_at", oneHourAgo);

    if (recentDeletes && recentDeletes.length >= 5) {
      alerts.push({
        type: "mass_delete",
        severity: "high",
        description: `${recentDeletes.length} delete operations in the last hour`,
        details: "Unusual volume of delete operations detected",
        timestamp: new Date().toISOString(),
      });
    }

    setSecurityAlerts(alerts);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchActivities();
    detectSecurityAlerts();
  }, []);

  const handleFilter = () => {
    fetchLogs();
    fetchActivities();
  };

  const showDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailDialog(true);
  };

  const actionColor = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("delete") || action.includes("Delete")) return "destructive";
    if (action === "create") return "default";
    if (action === "approve") return "default";
    if (action.includes("login") || action.includes("Login")) return "outline";
    return "secondary";
  };

  const activityColor = (type: string) => {
    if (type === "failed_login") return "destructive" as const;
    if (type === "login") return "default" as const;
    if (type === "logout") return "secondary" as const;
    return "outline" as const;
  };

  const severityColor = (severity: string) => {
    if (severity === "high") return "destructive" as const;
    if (severity === "medium") return "default" as const;
    return "secondary" as const;
  };

  const renderDiff = (oldData: any, newData: any) => {
    if (!oldData && !newData) return <span className="text-muted-foreground">No data</span>;

    const old = typeof oldData === "string" ? JSON.parse(oldData) : oldData || {};
    const nw = typeof newData === "string" ? JSON.parse(newData) : newData || {};
    const allKeys = [...new Set([...Object.keys(old), ...Object.keys(nw)])];

    return (
      <div className="space-y-1 text-xs">
        {allKeys.map(key => {
          const oldVal = JSON.stringify(old[key] ?? "—");
          const newVal = JSON.stringify(nw[key] ?? "—");
          const changed = oldVal !== newVal;
          return (
            <div key={key} className={`flex gap-2 ${changed ? "bg-amber-500/10 p-1 rounded" : ""}`}>
              <span className="font-medium min-w-[120px] text-muted-foreground">{key}:</span>
              {changed ? (
                <>
                  <span className="text-destructive line-through">{oldVal}</span>
                  <span>→</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{newVal}</span>
                </>
              ) : (
                <span>{newVal}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground mt-2">Only Super Admin can view audit logs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">Audit Log & Activity Tracking</h1>
          <p className="text-sm text-muted-foreground">Complete audit trail and security monitoring</p>
        </div>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Security Alerts ({securityAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {securityAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <Badge variant={severityColor(alert.severity)} className="text-[10px] uppercase mt-0.5">
                  {alert.severity}
                </Badge>
                <div>
                  <p className="font-medium text-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">{alert.details}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="space-y-1 w-40">
          <Label className="text-xs">User</Label>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Users</SelectItem>
              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-40">
          <Label className="text-xs">Module</Label>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Modules</SelectItem>
              {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-36">
          <Label className="text-xs">Action</Label>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Actions</SelectItem>
              {ACTIONS.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="h-9 w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="h-9 w-36" />
        </div>
        <Button size="sm" onClick={handleFilter} className="h-9">
          <Search className="w-4 h-4 mr-1" />Filter
        </Button>
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit" className="gap-1">
            <ScrollText className="w-3.5 h-3.5" />Audit Logs
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1">
            <Activity className="w-3.5 h-3.5" />User Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No audit logs found</TableCell></TableRow>
                  ) : logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{log.user_name || "System"}</TableCell>
                      <TableCell className="text-sm">{log.module}</TableCell>
                      <TableCell>
                        <Badge variant={actionColor(log.action)} className="text-[10px] capitalize">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[100px] truncate">
                        {log.record_id || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                        {log.details || "—"}
                      </TableCell>
                      <TableCell>
                        {(log.old_data || log.new_data || log.details) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => showDetail(log)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {logs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">Showing {logs.length} records (max 500)</p>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Browser</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No activities recorded</TableCell></TableRow>
                  ) : activities.map(act => (
                    <TableRow key={act.id}>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {new Date(act.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={activityColor(act.activity_type)} className="text-[10px] capitalize">
                          {act.activity_type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{act.description || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{act.ip_address || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {act.user_agent ? act.user_agent.split(" ").slice(0, 3).join(" ") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Audit Log Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">User:</span>{" "}
                  <strong>{selectedLog.user_name || "System"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Module:</span>{" "}
                  <strong>{selectedLog.module}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Action:</span>{" "}
                  <Badge variant={actionColor(selectedLog.action)} className="text-xs capitalize ml-1">
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>{" "}
                  {new Date(selectedLog.created_at).toLocaleString()}
                </div>
                {selectedLog.record_id && (
                  <div>
                    <span className="text-muted-foreground">Record ID:</span>{" "}
                    <span className="font-mono text-xs">{selectedLog.record_id}</span>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <span className="text-muted-foreground">IP:</span>{" "}
                    <span className="font-mono text-xs">{selectedLog.ip_address}</span>
                  </div>
                )}
              </div>

              {selectedLog.user_agent && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <strong>User Agent:</strong> {selectedLog.user_agent}
                </div>
              )}

              {(selectedLog.old_data || selectedLog.new_data) && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Data Changes</h3>
                  <div className="bg-muted/30 rounded p-3 overflow-x-auto">
                    {renderDiff(selectedLog.old_data, selectedLog.new_data)}
                  </div>
                </div>
              )}

              {selectedLog.details && !selectedLog.old_data && !selectedLog.new_data && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Details</h3>
                  <pre className="text-xs bg-muted/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                    {typeof selectedLog.details === "string"
                      ? (() => {
                          try { return JSON.stringify(JSON.parse(selectedLog.details), null, 2); }
                          catch { return selectedLog.details; }
                        })()
                      : JSON.stringify(selectedLog.details, null, 2)
                    }
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogPage;
