import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules, type ModuleKey } from "@/contexts/ModuleContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard, ChevronDown, ChevronRight, BookOpen, FileText, Receipt,
  ShoppingCart, Package, Warehouse, Layers, ClipboardList, BarChart3,
  ScrollText, Database, Users, Shield, Building2, LogOut,
  CreditCard, Landmark, PiggyBank, TrendingUp,
  ArrowLeftRight, Calendar, Activity, Menu, X, CircleDot, Truck, UserCheck,
  Briefcase, Clock, CalendarDays, DollarSign, FileCheck, BadgeCheck, User,
  Fingerprint, ScanFace, Timer, Gauge, Keyboard, Palette, MessageSquare,
  Mail, Factory,
} from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface NavGroup {
  label: string;
  icon: any;
  permission?: string;
  requiredModules?: ModuleKey[];
  children: { to: string; label: string; icon: any; end?: boolean; permission?: string }[];
  portalOnly?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Accounts",
    icon: BookOpen,
    permission: "accounts.view",
    requiredModules: ["accounts"],
    children: [
      { to: "/accounts/chart", label: "Chart of Accounts", icon: BookOpen, permission: "accounts.view" },
      { to: "/accounts/vouchers", label: "Accounting Vouchers", icon: FileText, permission: "journal.view,payment.view,receipt.view,contra.view" },
      { to: "/reports/trial-balance", label: "Trial Balance", icon: FileText, permission: "accounts.view" },
      { to: "/reports/profit-loss", label: "Profit & Loss", icon: TrendingUp, permission: "accounts.view" },
      { to: "/reports/balance-sheet", label: "Balance Sheet", icon: FileText, permission: "accounts.view" },
      { to: "/reports/general-ledger", label: "General Ledger", icon: BookOpen, permission: "accounts.view" },
      { to: "/reports/account-ledger", label: "Account Ledger", icon: ScrollText, permission: "accounts.view" },
      { to: "/reports/journal-vouchers", label: "Journal Report", icon: FileText, permission: "journal.view" },
      { to: "/reports/payment-vouchers", label: "Payment Report", icon: CreditCard, permission: "payment.view" },
      { to: "/reports/receipt-vouchers", label: "Receipt Report", icon: Receipt, permission: "receipt.view" },
      { to: "/reports/contra-vouchers", label: "Contra Report", icon: ArrowLeftRight, permission: "contra.view" },
    ],
  },
  {
    label: "Sales",
    icon: TrendingUp,
    permission: "sales.view",
    requiredModules: ["sales"],
    children: [
      { to: "/sales", label: "Sales Invoice", icon: Receipt, permission: "sales.view" },
      { to: "/sales/returns", label: "Sales Return", icon: ArrowLeftRight, permission: "sales.view" },
      { to: "/customers", label: "Customers", icon: UserCheck, permission: "sales.view" },
      { to: "/reports/accounts-receivable", label: "Accounts Receivable", icon: UserCheck, permission: "sales.view" },
      { to: "/reports/ar-aging", label: "AR Aging", icon: Clock, permission: "sales.view" },
      { to: "/reports/income-analysis", label: "Income Analysis", icon: TrendingUp, permission: "sales.view" },
    ],
  },
  {
    label: "Purchase",
    icon: ShoppingCart,
    permission: "purchase.view",
    requiredModules: ["purchase"],
    children: [
      { to: "/purchase", label: "Purchase Entry", icon: ShoppingCart, permission: "purchase.view" },
      { to: "/purchase/returns", label: "Purchase Return", icon: ArrowLeftRight, permission: "purchase.view" },
      { to: "/suppliers", label: "Suppliers", icon: Truck, permission: "purchase.view" },
      { to: "/reports/accounts-payable", label: "Accounts Payable", icon: Truck, permission: "purchase.view" },
      { to: "/reports/ap-aging", label: "AP Aging", icon: Clock, permission: "purchase.view" },
      { to: "/reports/expense-analysis", label: "Expense Analysis", icon: FileText, permission: "purchase.view" },
    ],
  },
  {
    label: "Inventory",
    icon: Warehouse,
    permission: "inventory.view",
    requiredModules: ["inventory"],
    children: [
      { to: "/inventory/items", label: "Item Master", icon: Package, permission: "inventory.view" },
      { to: "/inventory/categories", label: "Item Categories", icon: Layers, permission: "inventory.view" },
      { to: "/inventory/units", label: "Units", icon: CircleDot, permission: "inventory.view" },
      { to: "/inventory/warehouses", label: "Warehouses", icon: Warehouse, permission: "inventory.view" },
      { to: "/inventory", label: "Stock Overview", icon: Warehouse, permission: "inventory.view" },
      { to: "/inventory/transfers", label: "Stock Transfer", icon: ArrowLeftRight, permission: "inventory.view" },
      { to: "/inventory/adjustments", label: "Stock Adjustment", icon: ClipboardList, permission: "inventory.view" },
      { to: "/inventory/stock-ledger", label: "Stock Ledger", icon: ScrollText, permission: "inventory.view" },
      { to: "/reports/stock-reports", label: "Stock Reports", icon: BarChart3, permission: "inventory.view" },
      { to: "/reports/low-stock", label: "Low Stock Alert", icon: CircleDot, permission: "inventory.view" },
    ],
  },
  {
    label: "Bank & Cash",
    icon: Landmark,
    permission: "bank.view",
    requiredModules: ["bank"],
    children: [
      { to: "/bank/accounts", label: "Bank Accounts", icon: Landmark, permission: "bank.view" },
      { to: "/bank/cashbook", label: "Cash Book", icon: PiggyBank, permission: "bank.view" },
      { to: "/reports/cash-book", label: "Cash Book Report", icon: FileText, permission: "bank.view" },
      { to: "/reports/bank-book", label: "Bank Book Report", icon: Landmark, permission: "bank.view" },
      { to: "/reports/bank-reconciliation", label: "Bank Reconciliation", icon: ArrowLeftRight, permission: "bank.view" },
    ],
  },
  {
    label: "HRM",
    icon: Users,
    permission: "hrm.view",
    requiredModules: ["hrm"],
    children: [
      { to: "/hrm/dashboard", label: "HR Dashboard", icon: Gauge, permission: "hrm.view" },
      { to: "/hrm/employees", label: "Employees", icon: Users, permission: "hrm.view" },
      { to: "/hrm/departments", label: "Departments", icon: Building2, permission: "hrm.view" },
      { to: "/hrm/designations", label: "Designations", icon: Briefcase, permission: "hrm.view" },
      { to: "/hrm/shifts", label: "Shift Management", icon: Timer, permission: "hrm.view" },
      { to: "/hrm/attendance", label: "Attendance", icon: Clock, permission: "hrm.view" },
      { to: "/hrm/biometric", label: "Biometric Import", icon: Fingerprint, permission: "hrm.view" },
      { to: "/hrm/face-attendance", label: "Face Recognition", icon: ScanFace, permission: "hrm.view" },
      { to: "/hrm/overtime", label: "Overtime", icon: Clock, permission: "hrm.view" },
      { to: "/hrm/leave", label: "Leave Management", icon: CalendarDays, permission: "hrm.view" },
      { to: "/hrm/payroll", label: "Payroll", icon: DollarSign, permission: "hrm.view" },
      { to: "/hrm/funds", label: "PF & Savings Fund", icon: PiggyBank, permission: "hrm.view" },
      { to: "/hrm/documents", label: "Documents", icon: FileCheck, permission: "hrm.view" },
      { to: "/hrm/id-cards", label: "Employee ID Cards", icon: BadgeCheck, permission: "hrm.view" },
      { to: "/hrm/reports", label: "HR Reports", icon: BarChart3, permission: "hrm.view" },
      { to: "/hrm/login-activity", label: "Login Activity", icon: Activity, permission: "hrm.view" },
    ],
  },
  {
    label: "Employee Portal",
    icon: User,
    portalOnly: true,
    requiredModules: ["hrm"],
    children: [
      { to: "/portal/dashboard", label: "My Dashboard", icon: LayoutDashboard },
      { to: "/portal/profile", label: "My Profile", icon: User },
      { to: "/portal/attendance", label: "My Attendance", icon: Clock },
      { to: "/portal/leave", label: "My Leave", icon: CalendarDays },
      { to: "/portal/payslips", label: "My Payslips", icon: DollarSign },
      { to: "/portal/documents", label: "My Documents", icon: FileText },
    ],
  },
  {
    label: "Manufacturing",
    icon: Factory,
    permission: "manufacturing.view",
    requiredModules: ["manufacturing"],
    children: [
      { to: "/manufacturing/materials", label: "Raw Materials", icon: Package, permission: "manufacturing.view" },
      { to: "/manufacturing/bom", label: "Bill of Materials", icon: ClipboardList, permission: "manufacturing.view" },
      { to: "/manufacturing/production", label: "Production", icon: Factory, permission: "manufacturing.view" },
      { to: "/manufacturing/reports", label: "Reports", icon: BarChart3, permission: "manufacturing.view" },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    permission: "reports.view",
    requiredModules: ["reports"],
    children: [
      { to: "/reports/financial", label: "All Reports", icon: BarChart3, permission: "reports.view" },
      { to: "/reports/financial-summary", label: "Financial Summary", icon: Gauge, permission: "reports.view" },
      { to: "/reports/party-ledger", label: "Party Ledger", icon: Users, permission: "reports.view" },
    ],
  },
  {
    label: "Administration",
    icon: Shield,
    children: [
      { to: "/admin/branches", label: "Branches", icon: Building2, permission: "branches.view" },
      { to: "/admin/financial-years", label: "Financial Years", icon: Calendar, permission: "financial_years.view" },
      { to: "/admin/users", label: "Users", icon: Users, permission: "users.view" },
      { to: "/admin/roles", label: "Roles & Permissions", icon: Shield, permission: "roles.view" },
      { to: "/admin/backup", label: "Backup & Restore", icon: Database, permission: "backup.view" },
      { to: "/admin/audit-log", label: "Activity Logs", icon: Activity, permission: "audit_log.view" },
      { to: "/admin/numbering", label: "Document Numbering", icon: ScrollText, permission: "settings.view" },
      { to: "/admin/shortcuts", label: "Page Shortcuts", icon: Keyboard, permission: "settings.view" },
      { to: "/admin/settings", label: "General Settings", icon: CircleDot, permission: "settings.view" },
      { to: "/admin/sms", label: "SMS Integration", icon: MessageSquare, permission: "settings.view" },
      { to: "/admin/branding", label: "Branding", icon: Palette, permission: "settings.view" },
    ],
  },
];

const routeModuleMap: Record<string, ModuleKey[]> = {
  
  "/reports/stock-ledger": ["inventory"],
  "/inventory/warehouses": ["multi_warehouse"],
  "/reports/trial-balance": ["accounts"],
  "/reports/profit-loss": ["accounts"],
  "/reports/balance-sheet": ["accounts"],
  "/reports/general-ledger": ["accounts"],
  "/reports/account-ledger": ["accounts"],
  "/reports/journal-vouchers": ["accounts"],
  "/reports/payment-vouchers": ["accounts"],
  "/reports/receipt-vouchers": ["accounts"],
  "/reports/contra-vouchers": ["accounts"],
  "/reports/accounts-receivable": ["sales"],
  "/reports/ar-aging": ["sales"],
  "/reports/income-analysis": ["sales"],
  "/reports/accounts-payable": ["purchase"],
  "/reports/ap-aging": ["purchase"],
  "/reports/expense-analysis": ["purchase"],
  "/reports/cash-book": ["bank"],
  "/reports/bank-book": ["bank"],
  "/reports/bank-reconciliation": ["bank"],
  "/reports/stock-reports": ["inventory"],
  "/reports/low-stock": ["inventory"],
};

const NavItem = ({ to, label, icon: Icon, end }: { to: string; label: string; icon: any; end?: boolean }) => (
  <NavLink
    to={to}
    end={end}
    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
    activeClassName="bg-primary/10 text-primary font-medium"
  >
    <Icon className="w-3.5 h-3.5 shrink-0" />
    <span className="truncate">{label}</span>
  </NavLink>
);

const hasAnyPermission = (permStr: string, hasPermission: (p: string) => boolean) => {
  const perms = permStr.split(",");
  return perms.some((p) => hasPermission(p.trim()));
};

const CollapsibleGroup = ({ group, isModuleEnabled, hasPermission }: { group: NavGroup; isModuleEnabled: (key: ModuleKey) => boolean; hasPermission: (perm: string) => boolean }) => {
  const location = useLocation();
  const filteredChildren = group.children.filter((item) => {
    const required = routeModuleMap[item.to];
    if (required && required.some((m) => !isModuleEnabled(m))) return false;
    if (item.permission && !hasAnyPermission(item.permission, hasPermission)) return false;
    return true;
  });

  // Auto-open group if current route is within it
  const isActiveGroup = filteredChildren.some((item) => location.pathname.startsWith(item.to));
  const [open, setOpen] = useState(isActiveGroup);

  // Keep group open when navigating into it
  useEffect(() => {
    if (isActiveGroup && !open) setOpen(true);
  }, [isActiveGroup]);

  if (filteredChildren.length === 0) return null;

  const Icon = group.icon;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{group.label}</span>
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="ml-2 pl-3 border-l border-border/50 space-y-0.5 mt-0.5 mb-1">
          {filteredChildren.map((item) => (
            <NavItem key={item.to + item.label} {...item} />
          ))}
        </div>
      )}
    </div>
  );
};

export const AppSidebar = () => {
  const { signOut, profile, hasPermission, user, isSuperAdmin } = useAuth();
  const { isModuleEnabled } = useModules();
  const { branding } = useBranding();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasEmployeeRecord, setHasEmployeeRecord] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("employees").select("id").eq("user_id", user.id).maybeSingle();
      setHasEmployeeRecord(!!data);
    })();
  }, [user]);

  const isHrAdmin = isSuperAdmin || hasPermission("hrm.view");

  const sidebarContent = (
    <>
      <div className="p-3 sm:p-4 border-b border-sidebar-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {branding.company_logo_url ? (
            <img src={branding.company_logo_url} alt="Logo" className="w-7 h-7 object-contain rounded shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-bold text-sidebar-foreground text-sm tracking-tight truncate">{branding.software_name || "ERP System"}</h2>
            {profile && (
              <p className="text-[10px] text-muted-foreground truncate">
                {profile.name || profile.email}
              </p>
            )}
          </div>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8 shrink-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          <NavItem to="/" label="Dashboard" icon={LayoutDashboard} end />
          <NavItem to="/messaging" label="Messages" icon={Mail} />
          <div className="my-2 border-t border-sidebar-border" />
          {navGroups.map((group) => {
            if (group.requiredModules && group.requiredModules.some((m) => !isModuleEnabled(m))) return null;
            if (group.portalOnly && !hasEmployeeRecord && !isHrAdmin) return null;
            if (group.permission && !hasAnyPermission(group.permission, hasPermission)) return null;
            return <CollapsibleGroup key={group.label} group={group} isModuleEnabled={isModuleEnabled} hasPermission={hasPermission} />;
          })}
        </nav>
      </ScrollArea>
      <div className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile hamburger — positioned to avoid overlap with header icons */}
        {!mobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-2 left-2 z-50 h-8 w-8 lg:hidden bg-card/80 backdrop-blur-sm shadow-sm border border-border"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-sidebar border-r border-border flex flex-col h-full z-50 shadow-overlay animate-in slide-in-from-left duration-200">
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full shrink-0 hidden lg:flex">
      {sidebarContent}
    </aside>
  );
};
