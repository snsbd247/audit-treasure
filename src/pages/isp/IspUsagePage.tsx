import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpDown, Download, Upload, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ispCustomers } from "@/lib/isp-api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function IspUsagePage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [custRes, usageRes, dailyRes] = await Promise.all([
        ispCustomers.get(id),
        ispCustomers.usage(id),
        ispCustomers.usageDaily(id, days),
      ]);
      setCustomer(custRes.data);
      setSummary(usageRes.data);
      setDailyData((dailyRes.data || []).map((d: any) => ({
        date: d.date,
        upload: d.upload,
        download: d.download,
        uploadLabel: formatBytes(d.upload),
        downloadLabel: formatBytes(d.download),
      })));
    } catch {
      toast.error("Failed to load usage data");
    }
    setLoading(false);
  }, [id, days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bandwidth Usage</h1>
        <p className="text-muted-foreground">{customer?.name} ({customer?.pppoe_username})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Upload</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Upload className="h-5 w-5 text-blue-500" /><span className="text-2xl font-bold">{formatBytes(summary?.total_upload || 0)}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Download</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Download className="h-5 w-5 text-green-500" /><span className="text-2xl font-bold">{formatBytes(summary?.total_download || 0)}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Usage</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><ArrowUpDown className="h-5 w-5 text-purple-500" /><span className="text-2xl font-bold">{formatBytes(summary?.total_usage || 0)}</span></div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Daily Usage</CardTitle>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No usage data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis tickFormatter={(v) => formatBytes(v)} className="text-xs" />
                <Tooltip formatter={(v: number) => formatBytes(v)} />
                <Legend />
                <Bar dataKey="upload" name="Upload" fill="hsl(var(--primary))" radius={[2,2,0,0]} />
                <Bar dataKey="download" name="Download" fill="hsl(var(--accent))" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
