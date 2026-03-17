import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules, type ModuleKey } from "@/contexts/ModuleContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard, ChevronDown, ChevronRight, BookOpen, FileText, Receipt,
  ShoppingCart, Package, Warehouse, Factory, Layers, ClipboardList, BarChart3,
  ScrollText, Database, Users, Shield, Building2, LogOut,
  CreditCard, Landmark, PiggyBank, TrendingUp,
  ArrowLeftRight, Calendar, Activity, Menu, X, CircleDot, Truck, UserCheck,
  Briefcase, Clock, CalendarDays, DollarSign, FileCheck, BadgeCheck, User,
  Fingerprint, ScanFace, Timer, Gauge, Keyboard, Palette,
} from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NavGroup {
  label: string;
  icon: any;
  module?: string;
  requiredModules?: ModuleKey[];
  children: { to: string; label: string; icon: any; end?: boolean }[];
  adminOnly?: boolean;
  portalOnly?: boolean; // Show only if user has linked employee or is HR admin
}

const navGroups: NavGroup[] = [
  {
    label: "Accounts",
    icon: BookOpen,
    module: "accounts",
    requiredModules: ["accounts"],
    children: [
      { to: "/accounts/chart", label: "Chart of Accounts", icon: BookOpen },
      { to: "/accounts/vouchers?type=journal", label: "Journal Voucher", icon: FileText },
      { to: "/accounts/vouchers?type=payment", label: "Payment Voucher", icon: CreditCard },
      { to: "/accounts/vouchers?type=receipt", label: "Receipt Voucher", icon: Receipt },
      { to: "/accounts/vouchers?type=contra", label: "Contra Voucher", icon: ArrowLeftRight },
      { to: "/reports/trial-balance", label: "Trial Balance", icon: FileText },
      { to: "/reports/profit-loss", label: "Profit & Loss", icon: TrendingUp },
      { to: "/reports/balance-sheet", label: "Balance Sheet", icon: FileText },
      { to: "/reports/general-ledger", label: "General Ledger", icon: BookOpen },
      { to: "/reports/account-ledger", label: "Account Ledger", icon: ScrollText },
      { to: "/reports/journal-vouchers", label: "Journal Report", icon: FileText },
      { to: "/reports/payment-vouchers", label: "Payment Report", icon: CreditCard },
      { to: "/reports/receipt-vouchers", label: "Receipt Report", icon: Receipt },
      { to: "/reports/contra-vouchers", label: "Contra Report", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Sales",
    icon: TrendingUp,
    module: "sales",
    requiredModules: ["sales"],
    children: [
      { to: "/sales", label: "Sales Invoice", icon: Receipt },
      { to: "/sales/returns", label: "Sales Return", icon: ArrowLeftRight },
      { to: "/customers", label: "Customers", icon: UserCheck },
      { to: "/reports/accounts-receivable", label: "Accounts Receivable", icon: UserCheck },
      { to: "/reports/ar-aging", label: "AR Aging", icon: Clock },
      { to: "/reports/income-analysis", label: "Income Analysis", icon: TrendingUp },
    ],
  },
  {
    label: "Purchase",
    icon: ShoppingCart,
    module: "purchase",
    requiredModules: ["purchase"],
    children: [
      { to: "/purchase", label: "Purchase Entry", icon: ShoppingCart },
      { to: "/purchase/returns", label: "Purchase Return", icon: ArrowLeftRight },
      { to: "/suppliers", label: "Suppliers", icon: Truck },
      { to: "/reports/accounts-payable", label: "Accounts Payable", icon: Truck },
      { to: "/reports/ap-aging", label: "AP Aging", icon: Clock },
      { to: "/reports/expense-analysis", label: "Expense Analysis", icon: FileText },
    ],
  },
  {
    label: "Inventory",
    icon: Warehouse,
    module: "inventory",
    requiredModules: ["inventory"],
    children: [
      { to: "/inventory/items", label: "Item Master", icon: Package },
      { to: "/inventory/categories", label: "Item Categories", icon: Layers },
      { to: "/inventory/units", label: "Units", icon: CircleDot },
      { to: "/inventory/warehouses", label: "Warehouses", icon: Warehouse },
      { to: "/inventory", label: "Stock Overview", icon: Warehouse },
      { to: "/inventory/transfers", label: "Stock Transfer", icon: ArrowLeftRight },
      { to: "/inventory/adjustments", label: "Stock Adjustment", icon: ClipboardList },
      { to: "/inventory/stock-ledger", label: "Stock Ledger", icon: ScrollText },
      { to: "/reports/stock-reports", label: "Stock Reports", icon: BarChart3 },
      { to: "/reports/low-stock", label: "Low Stock Alert", icon: CircleDot },
    ],
  },
  {
    label: "Manufacturing",
    icon: Factory,
    module: "manufacturing",
    requiredModules: ["manufacturing"],
    children: [
      { to: "/manufacturing/bom", label: "Bill of Materials", icon: ClipboardList },
      { to: "/manufacturing/production", label: "Production Entry", icon: Factory },
      { to: "/manufacturing/reports", label: "Production Report", icon: BarChart3 },
    ],
  },
  {
    label: "Bank & Cash",
    icon: Landmark,
    module: "bank",
    requiredModules: ["bank"],
    children: [
      { to: "/bank/accounts", label: "Bank Accounts", icon: Landmark },
      { to: "/bank/cashbook", label: "Cash Book", icon: PiggyBank },
      { to: "/reports/cash-book", label: "Cash Book Report", icon: FileText },
      { to: "/reports/bank-book", label: "Bank Book Report", icon: Landmark },
      { to: "/reports/bank-reconciliation", label: "Bank Reconciliation", icon: ArrowLeftRight },
    ],
  },
  {
    label: "HRM",
    icon: Users,
    module: "hrm",
    requiredModules: ["hrm"],
    children: [
      { to: "/hrm/dashboard", label: "HR Dashboard", icon: Gauge },
      { to: "/hrm/employees", label: "Employees", icon: Users },
      { to: "/hrm/departments", label: "Departments", icon: Building2 },
      { to: "/hrm/designations", label: "Designations", icon: Briefcase },
      { to: "/hrm/shifts", label: "Shift Management", icon: Timer },
      { to: "/hrm/attendance", label: "Attendance", icon: Clock },
      { to: "/hrm/biometric", label: "Biometric Import", icon: Fingerprint },
      { to: "/hrm/face-attendance", label: "Face Recognition", icon: ScanFace },
      { to: "/hrm/overtime", label: "Overtime", icon: Clock },
      { to: "/hrm/leave", label: "Leave Management", icon: CalendarDays },
      { to: "/hrm/payroll", label: "Payroll", icon: DollarSign },
      { to: "/hrm/documents", label: "Documents", icon: FileCheck },
      { to: "/hrm/id-cards", label: "Employee ID Cards", icon: BadgeCheck },
      { to: "/hrm/reports", label: "HR Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Employee Portal",
    icon: User,
    module: "hrm",
    requiredModules: ["hrm"],
    portalOnly: true,
    children: [
      { to: "/portal/profile", label: "My Profile", icon: User },
      { to: "/portal/attendance", label: "My Attendance", icon: Clock },
      { to: "/portal/leave", label: "My Leave", icon: CalendarDays },
      { to: "/portal/payslips", label: "My Payslips", icon: DollarSign },
      { to: "/portal/documents", label: "My Documents", icon: FileText },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    module: "reports",
    requiredModules: ["reports"],
    children: [
      { to: "/reports/financial", label: "All Reports", icon: BarChart3 },
      { to: "/reports/financial-summary", label: "Financial Summary", icon: Gauge },
      { to: "/reports/party-ledger", label: "Party Ledger", icon: Users },
    ],
  },
  {
    label: "Administration",
    icon: Shield,
    module: "administration",
    children: [
      { to: "/admin/branches", label: "Branches", icon: Building2 },
      { to: "/admin/financial-years", label: "Financial Years", icon: Calendar },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/roles", label: "Roles & Permissions", icon: Shield },
      { to: "/admin/backup", label: "Backup & Restore", icon: Database },
      { to: "/admin/audit-log", label: "Activity Logs", icon: Activity },
      { to: "/admin/numbering", label: "Document Numbering", icon: ScrollText },
      { to: "/admin/shortcuts", label: "Page Shortcuts", icon: Keyboard },
      { to: "/admin/settings", label: "General Settings", icon: CircleDot },
      { to: "/admin/branding", label: "Branding", icon: Palette },
    ],
  },
];

const routeModuleMap: Record<string, ModuleKey[]> = {
  "/manufacturing/reports": ["manufacturing"],
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
    className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
    activeClassName="bg-primary/10 text-primary font-medium"
  >
    <Icon className="w-3.5 h-3.5 shrink-0" />
    <span className="truncate">{label}</span>
  </NavLink>
);

const CollapsibleGroup = ({ group, isModuleEnabled }: { group: NavGroup; isModuleEnabled: (key: ModuleKey) => boolean }) => {
  const [open, setOpen] = useState(false);
  const Icon = group.icon;

  const filteredChildren = group.children.filter((item) => {
    const required = routeModuleMap[item.to];
    if (required && required.some((m) => !isModuleEnabled(m))) return false;
    return true;
  });

  if (filteredChildren.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 shrink-0" />
          <span>{group.label}</span>
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
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

  // Check if user has a linked employee record (for portal visibility)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("employees").select("id").eq("user_id", user.id).maybeSingle();
      setHasEmployeeRecord(!!data);
    })();
  }, [user]);

  const isHrAdmin = isSuperAdmin || hasPermission("hrm", "can_view");

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {branding.company_logo_url ? (
            <img src={branding.company_logo_url} alt="Logo" className="w-7 h-7 object-contain rounded" />
          ) : (
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-sidebar-foreground text-sm tracking-tight">{branding.software_name || "ERP System"}</h2>
            {profile && (
              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                {profile.name || profile.email}
              </p>
            )}
          </div>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          <NavItem to="/" label="Dashboard" icon={LayoutDashboard} end />
          <div className="my-2 border-t border-sidebar-border" />
          {navGroups.map((group) => {
            if (group.requiredModules && group.requiredModules.some((m) => !isModuleEnabled(m))) return null;
            // For administration module: check administration permission or super_admin
            if (group.adminOnly && !hasPermission("administration", "can_view")) return null;
            // For other modules: check module permission
            if (!group.adminOnly && group.module && !hasPermission(group.module, "can_view")) return null;
            return <CollapsibleGroup key={group.label} group={group} isModuleEnabled={isModuleEnabled} />;
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
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 h-9 w-9 lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border flex flex-col h-full z-50 shadow-overlay">
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full shrink-0">
      {sidebarContent}
    </aside>
  );
};
