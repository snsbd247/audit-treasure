import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Activity, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface LoginLog {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  login_time: string;
  logout_time: string | null;
  user_name?: string;
  username?: string;
}

export default function LoginActivityPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    // Fetch login logs with profile info
    const { data: logData } = await supabase
      .from("login_logs" as any)
      .select("*")
      .order("login_time", { ascending: false })
      .limit(200);

    if (logData && (logData as any[]).length > 0) {
      // Get unique user IDs and fetch profiles
      const userIds = [...new Set((logData as any[]).map((l: any) => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username")
        .in("id", userIds);

      const profileMap: Record<string, { name: string; username: string }> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.id] = { name: p.name, username: p.username };
      });

      const enriched = (logData as any[]).map((l: any) => ({
        ...l,
        user_name: profileMap[l.user_id]?.name || "Unknown",
        username: profileMap[l.user_id]?.username || "-",
      }));
      setLogs(enriched);
    } else {
      setLogs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return (
      (l.user_name || "").toLowerCase().includes(q) ||
      (l.username || "").toLowerCase().includes(q) ||
      (l.ip_address || "").includes(q)
    );
  });

  const formatTime = (ts: string | null) => {
    if (!ts) return "-";
    try { return format(new Date(ts), "dd MMM yyyy, hh:mm a"); } catch { return ts; }
  };

  const getBrowser = (ua: string | null) => {
    if (!ua) return "-";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Other";
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6" /> Login Activity
          </h1>
          <p className="text-muted-foreground">Track employee login and logout activity</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, username, or IP..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="secondary">{filtered.length} records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Logout Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Browser</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(log => {
                let duration = "-";
                if (log.login_time && log.logout_time) {
                  const diff = new Date(log.logout_time).getTime() - new Date(log.login_time).getTime();
                  const mins = Math.round(diff / 60000);
                  duration = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
                }
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.user_name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.username}</code></TableCell>
                    <TableCell className="text-sm">{formatTime(log.login_time)}</TableCell>
                    <TableCell className="text-sm">
                      {log.logout_time ? formatTime(log.logout_time) : (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{duration}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip_address || "-"}</TableCell>
                    <TableCell className="text-sm">{getBrowser(log.user_agent)}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {loading ? "Loading..." : "No login activity found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
