import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wifi, Users, UserX, DollarSign, BarChart3, Package, Router, FileText,
  CreditCard, WifiOff, UserCheck, Activity, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ispCustomers, ispInvoices, ispBilling } from "@/lib/isp-api";
import { toast } from "sonner";

interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  totalRevenue: number;
  unpaidInvoices: number;
  overdueInvoices: number;
}

export default function IspDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, invRes] = await Promise.all([
        ispCustomers.list({ per_page: "1" }),
        ispInvoices.list({ per_page: "1" }),
      ]);

      // We use the meta.total from paginated responses
      const allCust = await ispCustomers.list({ per_page: "9999" });
      const allInv = await ispInvoices.list({ per_page: "9999" });
      const customers = allCust.data || [];
      const invoices = allInv.data || [];

      setStats({
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c: any) => c.status === "active").length,
        suspendedCustomers: customers.filter((c: any) => c.status === "suspended").length,
        totalRevenue: invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.amount), 0),
        unpaidInvoices: invoices.filter((i: any) => i.status === "unpaid").length,
        overdueInvoices: invoices.filter((i: any) => i.status === "overdue").length,
      });
    } catch {
      toast.error("Failed to load ISP dashboard");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleGenerateBills = async () => {
    setGenerating(true);
    const res = await ispBilling.generate();
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Generated ${res.data?.invoices_generated || 0} invoices`);
      fetchStats();
    }
    setGenerating(false);
  };

  const cards = [
    { title: "Total Customers", value: stats?.totalCustomers, icon: Users, color: "text-blue-600" },
    { title: "Active", value: stats?.activeCustomers, icon: UserCheck, color: "text-emerald-600" },
    { title: "Suspended", value: stats?.suspendedCustomers, icon: UserX, color: "text-red-600" },
    { title: "Revenue (Paid)", value: stats ? `৳${stats.totalRevenue.toLocaleString()}` : null, icon: DollarSign, color: "text-green-600" },
    { title: "Unpaid Invoices", value: stats?.unpaidInvoices, icon: FileText, color: "text-amber-600" },
    { title: "Overdue", value: stats?.overdueInvoices, icon: Activity, color: "text-red-500" },
  ];

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wifi className="w-6 h-6 text-primary" />
            ISP Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Internet Service Provider Management</p>
        </div>
        <Button onClick={handleGenerateBills} disabled={generating} size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating..." : "Generate Monthly Bills"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{card.value ?? 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
