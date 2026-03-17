import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/accounts/chart": "Chart of Accounts",
  "/accounts/vouchers": "Accounting Vouchers",
  "/customers": "Customers",
  "/suppliers": "Suppliers",
  "/products": "Products",
  "/purchase": "Purchases",
  "/purchase/returns": "Purchase Returns",
  "/sales": "Sales",
  "/sales/returns": "Sales Returns",
  "/inventory": "Stock Overview",
  "/inventory/items": "Item Master",
  "/inventory/categories": "Item Categories",
  "/inventory/units": "Units",
  "/inventory/warehouses": "Warehouses",
  "/inventory/transfers": "Stock Transfer",
  "/inventory/adjustments": "Stock Adjustment",
  "/manufacturing/materials": "Raw Materials",
  "/manufacturing/bom": "Bill of Materials",
  "/manufacturing/production": "Production Entry",
  "/manufacturing/reports": "Production Reports",
  "/reports/financial": "Financial Reports",
  "/reports/stock-ledger": "Stock Ledger",
  "/reports/stock-reports": "Stock Reports",
  "/reports/low-stock": "Low Stock Alert",
  "/reports/sales": "Sales Report",
  "/reports/purchase": "Purchase Report",
  "/bank/accounts": "Bank Accounts",
  "/bank/cashbook": "Cash Book",
  "/admin/users": "Users",
  "/admin/roles": "Roles & Permissions",
  "/admin/branches": "Branches",
  "/admin/financial-years": "Financial Years",
  "/admin/audit-log": "Activity Logs",
  "/admin/backup": "Backup & Restore",
  "/admin/settings": "General Settings",
  "/admin/numbering": "Document Numbering",
  "/profile": "Profile",
  "/change-password": "Change Password",
  "/vouchers": "Vouchers",
};

const PARENT_GROUPS: Record<string, { label: string; path?: string }> = {
  "/accounts": { label: "Accounts" },
  "/sales": { label: "Sales" },
  "/purchase": { label: "Purchase" },
  "/inventory": { label: "Inventory" },
  "/manufacturing": { label: "Manufacturing" },
  "/reports": { label: "Reports" },
  "/bank": { label: "Bank & Cash" },
  "/admin": { label: "Administration" },
};

export const Breadcrumbs = () => {
  const { pathname, search } = useLocation();

  if (pathname === "/") return null;

  const fullPath = pathname;
  const crumbs: { label: string; to?: string }[] = [];

  // Find parent group
  const parentKey = Object.keys(PARENT_GROUPS).find((k) => fullPath.startsWith(k));
  if (parentKey) {
    const group = PARENT_GROUPS[parentKey];
    crumbs.push({ label: group.label, to: group.path });
  }

  // Current page
  const label = ROUTE_LABELS[fullPath];
  if (label) {
    // Add voucher type context if present
    const params = new URLSearchParams(search);
    const voucherType = params.get("type");
    if (voucherType && fullPath === "/accounts/vouchers") {
      const typeLabel = { journal: "Journal", payment: "Payment", receipt: "Receipt", contra: "Contra" }[voucherType];
      crumbs.push({ label: `${typeLabel || voucherType} Voucher` });
    } else {
      crumbs.push({ label });
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs text-muted-foreground border-b border-border/50 bg-muted/30 overflow-x-auto whitespace-nowrap">
      <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1 shrink-0">
        <Home className="w-3 h-3" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5 shrink-0">
          <ChevronRight className="w-3 h-3" />
          {crumb.to ? (
            <Link to={crumb.to} className="hover:text-foreground transition-colors">{crumb.label}</Link>
          ) : (
            <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};
