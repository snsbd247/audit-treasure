import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Landmark, PiggyBank,
  FileText, ShoppingCart, Receipt, UserPlus, Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
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
  const { profile, roles, isSuperAdmin, hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const { fc } = useCurrency();
  const [stats, setStats] = useState<Stats>({
    totalSales: 0, totalPurchases: 0, totalIncome: 0, totalExpenses: 0,
    cashBalance: 0, bankBalance: 0, totalReceivable: 0, totalPayable: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [monthlyPurchases, setMonthlyPurchases] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [checkedRedirect, setCheckedRedirect] = useState(false);

  useEffect(() => {
    if (!user || checkedRedirect) return;
    const isEmployeeOnly = !isSuperAdmin && !hasPermission("accounts.view") && !hasPermission("sales.view") && !hasPermission("settings.view");
    if (isEmployeeOnly) {
      (async () => {
        const { data } = await supabase.from("employees").select("id").eq("user_id", user.id).maybeSingle();
        if (data) navigate("/portal/dashboard", { replace: true });
        setCheckedRedirect(true);
      })();
    } else {
      setCheckedRedirect(true);
    }
  }, [user, isSuperAdmin, hasPermission, checkedRedirect, navigate]);

  useEffect(() => { loadDashboardData(); }, []);

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
      totalSales, totalPurchases,
      totalIncome: totalSales, totalExpenses: totalPurchases,
      cashBalance: totalSales - totalPurchases, bankBalance: 0,
      totalReceivable: totalSales * 0.3, totalPayable: totalPurchases * 0.25,
    });
    setRecentActivities(auditRes.data || []);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();

    setMonthlySales(months.map((m, i) => ({
      month: m,
      amount: sales.filter((s) => { const d = new Date(s.invoice_date); return d.getMonth() === i && d.getFullYear() === currentYear; }).reduce((a, b) => a + Number(b.total_amount), 0),
    })));

    setMonthlyPurchases(months.map((m, i) => ({
      month: m,
      amount: purchases.filter((p) => { const d = new Date(p.purchase_date); return d.getMonth() === i && d.getFullYear() === currentYear; }).reduce((a, b) => a + Number(b.total_amount), 0),
    })));

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

  const fmt = (n: number) => fc(n);

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Welcome back, {profile?.name || "User"}
            {roles.length > 0 && (
              <span className="ml-2 text-[10px] sm:text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {roles.join(", ")}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats Cards — responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="hover:shadow-elevated transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{card.label}</span>
                <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color} shrink-0`} />
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground tabular-nums truncate">{fmt(card.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[240px]">
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" width={50} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="amount" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Purchases</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[240px]">
              <LineChart data={monthlyPurchases}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" width={50} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="amount" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center px-2 sm:px-6 pb-3 sm:pb-6">
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[240px]">
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => e.name} className="text-xs">
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
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-2.5 sm:py-3 text-xs w-full"
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
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {recentActivities.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground py-4 text-center">No recent activities</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {recentActivities.map((a) => (
                <div key={a.id} className="flex items-start gap-2 sm:gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-foreground">
                      <span className="font-medium">{a.user_name || "System"}</span>
                      {" "}{a.action}{" "}
                      <span className="text-muted-foreground">in {a.module}</span>
                    </p>
                    {a.details && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{a.details}</p>}
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
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
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-foreground font-medium">Super Admin</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">You have global access to all branches, reports, and transactions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
