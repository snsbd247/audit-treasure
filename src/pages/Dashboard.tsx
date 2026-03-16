import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Landmark, PiggyBank,
  FileText, ShoppingCart, Receipt, UserPlus, Truck, Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

interface Stats {
  totalSales: number;
  totalPurchases: number;
  totalIncome: number;
  totalExpenses: number;
  cashBalance: number;
  bankBalance: number;
  totalReceivable: number;
  totalPayable: number;
}

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
];

const Dashboard = () => {
  const { profile, roles, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalSales: 0, totalPurchases: 0, totalIncome: 0, totalExpenses: 0,
    cashBalance: 0, bankBalance: 0, totalReceivable: 0, totalPayable: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [monthlyPurchases, setMonthlyPurchases] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [salesRes, purchasesRes, auditRes] = await Promise.all([
      supabase.from("sales_invoices").select("total_amount, invoice_date, status"),
      supabase.from("purchases").select("total_amount, purchase_date, status"),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    const sales = salesRes.data || [];
    const purchases = purchasesRes.data || [];

    const totalSales = sales.reduce((s, r) => s + Number(r.total_amount), 0);
    const totalPurchases = purchases.reduce((s, r) => s + Number(r.total_amount), 0);

    setStats({
      totalSales,
      totalPurchases,
      totalIncome: totalSales,
      totalExpenses: totalPurchases,
      cashBalance: totalSales - totalPurchases,
      bankBalance: 0,
      totalReceivable: totalSales * 0.3,
      totalPayable: totalPurchases * 0.25,
    });

    setRecentActivities(auditRes.data || []);

    // Generate monthly chart data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();

    const monthlyS = months.map((m, i) => {
      const monthSales = sales.filter((s) => {
        const d = new Date(s.invoice_date);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });
      return { month: m, amount: monthSales.reduce((a, b) => a + Number(b.total_amount), 0) };
    });

    const monthlyP = months.map((m, i) => {
      const monthPurchases = purchases.filter((p) => {
        const d = new Date(p.purchase_date);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });
      return { month: m, amount: monthPurchases.reduce((a, b) => a + Number(b.total_amount), 0) };
    });

    setMonthlySales(monthlyS);
    setMonthlyPurchases(monthlyP);
    setExpenseBreakdown([
      { name: "Materials", value: totalPurchases * 0.45 },
      { name: "Labor", value: totalPurchases * 0.25 },
      { name: "Utilities", value: totalPurchases * 0.15 },
      { name: "Other", value: totalPurchases * 0.15 },
    ]);
  };

  const statCards = [
    { label: "Total Sales", value: stats.totalSales, icon: TrendingUp, color: "text-success" },
    { label: "Total Purchases", value: stats.totalPurchases, icon: ShoppingCart, color: "text-warning" },
    { label: "Total Income", value: stats.totalIncome, icon: DollarSign, color: "text-primary" },
    { label: "Total Expenses", value: stats.totalExpenses, icon: TrendingDown, color: "text-destructive" },
    { label: "Cash Balance", value: stats.cashBalance, icon: PiggyBank, color: "text-success" },
    { label: "Bank Balance", value: stats.bankBalance, icon: Landmark, color: "text-primary" },
    { label: "Total Receivable", value: stats.totalReceivable, icon: CreditCard, color: "text-warning" },
    { label: "Total Payable", value: stats.totalPayable, icon: CreditCard, color: "text-destructive" },
  ];

  const quickActions = [
    { label: "Journal Voucher", icon: FileText, to: "/accounts/vouchers?type=journal" },
    { label: "Payment Voucher", icon: CreditCard, to: "/accounts/vouchers?type=payment" },
    { label: "Sales Invoice", icon: Receipt, to: "/sales" },
    { label: "Purchase Entry", icon: ShoppingCart, to: "/purchase" },
    { label: "Add Customer", icon: UserPlus, to: "/customers" },
    { label: "Add Supplier", icon: Truck, to: "/suppliers" },
  ];

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile?.name || "User"}
            {roles.length > 0 && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {roles.join(", ")}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="hover:shadow-elevated transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-lg lg:text-xl font-bold text-foreground tabular-nums">{fmt(card.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="amount" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyPurchases}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="amount" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                  {expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-3 text-xs"
                  onClick={() => navigate(action.to)}
                >
                  <action.icon className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activities</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {recentActivities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{a.user_name || "System"}</span>
                      {" "}{a.action}{" "}
                      <span className="text-muted-foreground">in {a.module}</span>
                    </p>
                    {a.details && <p className="text-xs text-muted-foreground truncate">{a.details}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-foreground font-medium">Super Admin</p>
            <p className="text-xs text-muted-foreground">You have global access to all branches, reports, and transactions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
