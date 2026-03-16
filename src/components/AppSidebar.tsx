import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Shield, Building2, UserCircle, LogOut, FileText,
  BookOpen, Receipt, ShoppingCart, Package, Warehouse, Factory, Layers,
  ClipboardList, BarChart3, ScrollText, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="pt-4 pb-1 px-3">
    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{children}</span>
  </div>
);

const NavItem = ({ to, label, icon: Icon, end }: { to: string; label: string; icon: any; end?: boolean }) => (
  <NavLink
    to={to} end={end}
    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
  >
    <Icon className="w-4 h-4" />{label}
  </NavLink>
);

export const AppSidebar = () => {
  const { isAdmin, signOut, profile } = useAuth();

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground text-sm tracking-tight">Accounting ERP</h2>
        {profile && <p className="text-xs text-muted-foreground mt-1 truncate">{profile.name || profile.email}</p>}
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          <NavItem to="/" label="Dashboard" icon={LayoutDashboard} end />
          <NavItem to="/profile" label="Profile" icon={UserCircle} />

          <SectionLabel>Accounts</SectionLabel>
          <NavItem to="/accounts/chart" label="Chart of Accounts" icon={BookOpen} />
          <NavItem to="/accounts/vouchers" label="Accounting Vouchers" icon={FileText} />

          <SectionLabel>Sales & Purchase</SectionLabel>
          <NavItem to="/products" label="Products" icon={Package} />
          <NavItem to="/purchase" label="Purchase" icon={ShoppingCart} />
          <NavItem to="/sales" label="Sales" icon={Receipt} />
          <NavItem to="/inventory" label="Inventory" icon={Warehouse} />

          <SectionLabel>Manufacturing</SectionLabel>
          <NavItem to="/manufacturing/materials" label="Raw Materials" icon={Layers} />
          <NavItem to="/manufacturing/bom" label="Bill of Materials" icon={ClipboardList} />
          <NavItem to="/manufacturing/production" label="Production" icon={Factory} />
          <NavItem to="/manufacturing/reports" label="Mfg Reports" icon={BarChart3} />

          <SectionLabel>Reports</SectionLabel>
          <NavItem to="/reports/financial" label="Financial Reports" icon={FileText} />
          <NavItem to="/reports/stock-ledger" label="Stock Ledger" icon={BookOpen} />

          {isAdmin && (
            <>
              <SectionLabel>Administration</SectionLabel>
              <NavItem to="/admin/users" label="Users" icon={Users} />
              <NavItem to="/admin/roles" label="Roles & Permissions" icon={Shield} />
              <NavItem to="/admin/branches" label="Branches" icon={Building2} />
              <NavItem to="/admin/audit-log" label="Audit Log" icon={ScrollText} />
              <NavItem to="/admin/backup" label="Backup & Restore" icon={Database} />
            </>
          )}
        </nav>
      </ScrollArea>
      <div className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </Button>
      </div>
    </aside>
  );
};
