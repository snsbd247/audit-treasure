import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Landmark, PiggyBank,
  FileText, ShoppingCart, Receipt, UserPlus, Truck, ArrowUpRight, ArrowDownRight,
  Activity, Clock, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
  Legend,
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
  salesCount: number;
  purchaseCount: number;
}

const COLORS = {
  sales: "hsl(142, 76%, 36%)",
  purchases: "hsl(38, 92%, 50%)",
  income: "hsl(221, 83%, 53%)",
  expense: "hsl(0, 84%, 60%)",
  pie: ["hsl(221, 83%, 53%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(262, 83%, 58%)", "hsl(199, 89%, 48%)"],
};

const Dashboard = () => {
  const { profile, roles, isSuperAdmin, hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const { fc } = useCurrency();
  const [stats, setStats] = useState<Stats>({
    totalSales: 0, totalPurchases: 0, totalIncome: 0, totalExpenses: 0,
    cashBalance: 0, bankBalance: 0, totalReceivable: 0, totalPayable: 0,
    salesCount: 0, purchaseCount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
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
    const [salesRes, purchasesRes, auditRes, recentInvRes, recentPayRes, paymentsRes, voucherRes] = await Promise.all([
      supabase.from("sales_invoices").select("total_amount, net_amount, discount, invoice_date, status"),
      supabase.from("purchases").select("total_amount, purchase_date, status"),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(8),
      supabase.from("sales_invoices").select("id, invoice_number, invoice_date, total_amount, net_amount, status, customers(name)").order("created_at", { ascending: false }).limit(5),
      supabase.from("party_payments").select("id, payment_date, amount, payment_method, party_type, party_id").order("created_at", { ascending: false }).limit(5),
      supabase.from("party_payments").select("amount, party_type"),
      supabase.from("acc_vouchers").select("voucher_type, total_amount, status").neq("status", "cancelled"),
    ]);

    const sales = salesRes.data || [];
    const purchases = purchasesRes.data || [];
    const payments = paymentsRes.data || [];
    const vouchers = voucherRes.data || [];

    const totalSales = sales.reduce((s, r) => s + Number(r.total_amount), 0);
    const totalPurchases = purchases.reduce((s, r) => s + Number(r.total_amount), 0);

    // Real receivable: total sales - payments received from customers
    const customerPayments = payments.filter(p => p.party_type === 'customer').reduce((s, p) => s + Number(p.amount), 0);
    const supplierPayments = payments.filter(p => p.party_type === 'supplier').reduce((s, p) => s + Number(p.amount), 0);

    const totalReceivable = Math.max(0, totalSales - customerPayments);
    const totalPayable = Math.max(0, totalPurchases - supplierPayments);

    // Real income/expense from vouchers
    const receiptVouchers = vouchers.filter(v => v.voucher_type === 'receipt').reduce((s, v) => s + Number(v.total_amount), 0);
    const paymentVouchers = vouchers.filter(v => v.voucher_type === 'payment').reduce((s, v) => s + Number(v.total_amount), 0);

    const totalIncome = totalSales + receiptVouchers;
    const totalExpenses = totalPurchases + paymentVouchers;

    setStats({
      totalSales, totalPurchases,
      totalIncome, totalExpenses,
      cashBalance: totalIncome - totalExpenses,
      bankBalance: 0,
      totalReceivable, totalPayable,
      salesCount: sales.length, purchaseCount: purchases.length,
    });
    setRecentActivities(auditRes.data || []);
    setRecentInvoices(recentInvRes.data || []);
    setRecentPayments(recentPayRes.data || []);

    // Monthly chart data from real transactions
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();

    const monthlyData = months.map((m, i) => {
      const mSales = sales.filter(s => { const d = new Date(s.invoice_date); return d.getMonth() === i && d.getFullYear() === currentYear; }).reduce((a, b) => a + Number(b.total_amount), 0);
      const mPurchases = purchases.filter(p => { const d = new Date(p.purchase_date); return d.getMonth() === i && d.getFullYear() === currentYear; }).reduce((a, b) => a + Number(b.total_amount), 0);
      return { month: m, sales: mSales, purchases: mPurchases, profit: mSales - mPurchases };
    });
    setMonthlySales(monthlyData);
    setProfitData(monthlyData);

    // Real expense breakdown from voucher types
    const expenseCategories: { name: string; value: number }[] = [];
    if (totalPurchases > 0) expenseCategories.push({ name: "Purchases", value: totalPurchases });
    if (paymentVouchers > 0) expenseCategories.push({ name: "Payments", value: paymentVouchers });
    // If no data at all, show empty
    setExpenseBreakdown(expenseCategories.filter(e => e.value > 0));
  };

  const summaryCards = [
    { label: "Total Sales", value: stats.totalSales, icon: TrendingUp, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", trend: stats.salesCount > 0 ? `${stats.salesCount} invoices` : null, up: true },
    { label: "Total Purchases", value: stats.totalPurchases, icon: ShoppingCart, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", trend: stats.purchaseCount > 0 ? `${stats.purchaseCount} orders` : null, up: false },
    { label: "Total Income", value: stats.totalIncome, icon: DollarSign, color: "text-primary", bg: "bg-primary/10", trend: null, up: true },
    { label: "Total Expenses", value: stats.totalExpenses, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", trend: null, up: false },
    { label: "Cash Balance", value: stats.cashBalance, icon: PiggyBank, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", trend: null, up: stats.cashBalance >= 0 },
    { label: "Bank Balance", value: stats.bankBalance, icon: Landmark, color: "text-primary", bg: "bg-primary/10", trend: null, up: true },
  ];

  const quickActions = [
    { label: "Create Invoice", icon: Receipt, to: "/sales", color: "text-green-600 dark:text-green-400" },
    { label: "Add Payment", icon: CreditCard, to: "/customers", color: "text-primary" },
    { label: "Add Customer", icon: UserPlus, to: "/customers", color: "text-amber-600 dark:text-amber-400" },
    { label: "Add Supplier", icon: Truck, to: "/suppliers", color: "text-purple-600 dark:text-purple-400" },
    { label: "Journal Voucher", icon: FileText, to: "/accounts/vouchers?type=journal", color: "text-blue-600 dark:text-blue-400" },
    { label: "View Reports", icon: Activity, to: "/reports/financial", color: "text-destructive" },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Welcome back, {profile?.name || "User"}
            {roles.length > 0 && (
              <span className="ml-2 text-[10px] sm:text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {roles.join(", ")}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/reports/financial")} className="text-xs">
            <Activity className="w-3.5 h-3.5 mr-1" /> Reports
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className="hover:shadow-elevated transition-all duration-200 border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color}`} />
                </div>
                {card.up ? (
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-destructive" />
                )}
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground tabular-nums truncate">{fc(card.value)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{card.label}</p>
              {card.trend && <p className="text-[10px] text-muted-foreground mt-0.5">{card.trend}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Sales vs Purchases + Profit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Monthly Sales vs Purchases
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlySales} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" width={55} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sales" name="Sales" fill={COLORS.sales} radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill={COLORS.purchases} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Profit Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={profitData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" width={55} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke={COLORS.income} fill="url(#profitGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Expense Breakdown + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center px-2 sm:px-6 pb-3 sm:pb-6">
            {expenseBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-16 text-center">No expense data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={e => e.name} className="text-[10px]">
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS.pie[i % COLORS.pie.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickActions.map(action => (
                <Button key={action.label} variant="outline" size="sm" className="justify-start h-auto py-3 text-xs w-full group hover:border-primary/30" onClick={() => navigate(action.to)}>
                  <div className={`p-1 rounded ${action.color} mr-2`}>
                    <action.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-primary" /> Recent Invoices
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => navigate("/sales")}>View all</Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {recentInvoices.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No invoices yet</p>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1" onClick={() => navigate(`/sales/invoices/${inv.id}`)}>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{inv.invoice_number}</p>
                      <p className="text-[10px] text-muted-foreground">{(inv.customers as any)?.name || "—"}</p>
                    </div>
                    <p className="text-xs font-semibold tabular-nums text-foreground">{fc(Number(inv.net_amount || inv.total_amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Recent Activity
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No recent activities</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-auto">
              {recentActivities.map((a) => (
                <div key={a.id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">{a.user_name || "System"}</span>{" "}{a.action}{" "}
                      <span className="text-muted-foreground">in {a.module}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
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
