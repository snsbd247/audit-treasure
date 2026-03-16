import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard, ChevronDown, ChevronRight, BookOpen, FileText, Receipt,
  ShoppingCart, Package, Warehouse, Factory, Layers, ClipboardList, BarChart3,
  ScrollText, Database, Users, Shield, Building2, LogOut,
  CreditCard, Landmark, PiggyBank, TrendingUp,
  ArrowLeftRight, Calendar, Activity, Menu, X, CircleDot, Truck, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NavGroup {
  label: string;
  icon: any;
  module?: string; // maps to role_permissions.module for access control
  children: { to: string; label: string; icon: any; end?: boolean }[];
  adminOnly?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Accounts",
    icon: BookOpen,
    module: "accounts",
    children: [
      { to: "/accounts/chart", label: "Chart of Accounts", icon: BookOpen },
      { to: "/accounts/vouchers?type=journal", label: "Journal Voucher", icon: FileText },
      { to: "/accounts/vouchers?type=payment", label: "Payment Voucher", icon: CreditCard },
      { to: "/accounts/vouchers?type=receipt", label: "Receipt Voucher", icon: Receipt },
      { to: "/accounts/vouchers?type=contra", label: "Contra Voucher", icon: ArrowLeftRight },
      { to: "/customers", label: "Customers", icon: UserCheck },
      { to: "/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    label: "Sales",
    icon: TrendingUp,
    module: "sales",
    children: [
      { to: "/sales", label: "Sales Invoice", icon: Receipt },
      { to: "/sales/returns", label: "Sales Return", icon: ArrowLeftRight },
      { to: "/reports/sales", label: "Sales Report", icon: BarChart3 },
    ],
  },
  {
    label: "Purchase",
    icon: ShoppingCart,
    module: "purchase",
    children: [
      { to: "/purchase", label: "Purchase Entry", icon: ShoppingCart },
      { to: "/purchase/returns", label: "Purchase Return", icon: ArrowLeftRight },
      { to: "/reports/purchase", label: "Purchase Report", icon: BarChart3 },
    ],
  },
  {
    label: "Manufacturing",
    icon: Factory,
    module: "manufacturing",
    children: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/manufacturing/materials", label: "Raw Materials", icon: Layers },
      { to: "/manufacturing/bom", label: "Bill of Materials", icon: ClipboardList },
      { to: "/manufacturing/production", label: "Production Entry", icon: Factory },
    ],
  },
  {
    label: "Inventory",
    icon: Warehouse,
    module: "inventory",
    children: [
      { to: "/inventory/items", label: "Item Master", icon: Package },
      { to: "/inventory/categories", label: "Item Categories", icon: Layers },
      { to: "/inventory/units", label: "Units", icon: CircleDot },
      { to: "/inventory/warehouses", label: "Warehouses", icon: Warehouse },
      { to: "/inventory", label: "Stock Overview", icon: Warehouse },
      { to: "/inventory/transfers", label: "Stock Transfer", icon: ArrowLeftRight },
      { to: "/inventory/adjustments", label: "Stock Adjustment", icon: ClipboardList },
      { to: "/reports/stock-ledger", label: "Stock Ledger", icon: ScrollText },
      { to: "/reports/stock-reports", label: "Stock Reports", icon: BarChart3 },
      { to: "/reports/low-stock", label: "Low Stock Alert", icon: CircleDot },
    ],
  },
  {
    label: "Bank & Cash",
    icon: Landmark,
    module: "bank",
    children: [
      { to: "/bank/accounts", label: "Bank Accounts", icon: Landmark },
      { to: "/bank/cashbook", label: "Cash Book", icon: PiggyBank },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    module: "reports",
    children: [
      { to: "/reports/financial", label: "Financial Reports", icon: FileText },
      { to: "/reports/stock-ledger", label: "Stock Ledger", icon: ScrollText },
      { to: "/manufacturing/reports", label: "Production Report", icon: Factory },
    ],
  },
  {
    label: "Administration",
    icon: Shield,
    adminOnly: true,
    children: [
      { to: "/admin/branches", label: "Branches", icon: Building2 },
      { to: "/admin/financial-years", label: "Financial Years", icon: Calendar },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/roles", label: "Roles & Permissions", icon: Shield },
      { to: "/admin/backup", label: "Backup & Restore", icon: Database },
      { to: "/admin/audit-log", label: "Activity Logs", icon: Activity },
      { to: "/admin/numbering", label: "Document Numbering", icon: ScrollText },
      { to: "/admin/settings", label: "General Settings", icon: CircleDot },
    ],
  },
];

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

const CollapsibleGroup = ({ group }: { group: NavGroup }) => {
  const [open, setOpen] = useState(false);
  const Icon = group.icon;

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
          {group.children.map((item) => (
            <NavItem key={item.to + item.label} {...item} />
          ))}
        </div>
      )}
    </div>
  );
};

export const AppSidebar = () => {
  const { isAdmin, signOut, profile, hasPermission } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sidebar-foreground text-base tracking-tight">ERP System</h2>
          {profile && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
              {profile.name || profile.email}
            </p>
          )}
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
            if (group.adminOnly && !isAdmin) return null;
            return <CollapsibleGroup key={group.label} group={group} />;
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
