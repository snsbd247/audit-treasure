import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VouchersPage from "./pages/VouchersPage";
import Profile from "./pages/Profile";
import UsersPage from "./pages/admin/UsersPage";
import RolesPage from "./pages/admin/RolesPage";
import BranchesPage from "./pages/admin/BranchesPage";
import AuditLogPage from "./pages/admin/AuditLogPage";
import BackupPage from "./pages/admin/BackupPage";
import ChartOfAccounts from "./pages/accounts/ChartOfAccounts";
import AccountingVouchers from "./pages/accounts/AccountingVouchers";
import ProductsPage from "./pages/inventory/ProductsPage";
import PurchasesPage from "./pages/purchase/PurchasesPage";
import SalesPage from "./pages/sales/SalesPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import RawMaterialsPage from "./pages/manufacturing/RawMaterialsPage";
import BOMPage from "./pages/manufacturing/BOMPage";
import ProductionPage from "./pages/manufacturing/ProductionPage";
import ManufacturingReports from "./pages/manufacturing/ManufacturingReports";
import FinancialReports from "./pages/reports/FinancialReports";
import StockLedger from "./pages/reports/StockLedger";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vouchers" element={<VouchersPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/accounts/chart" element={<ChartOfAccounts />} />
              <Route path="/accounts/vouchers" element={<AccountingVouchers />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/purchase" element={<PurchasesPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/manufacturing/materials" element={<RawMaterialsPage />} />
              <Route path="/manufacturing/bom" element={<BOMPage />} />
              <Route path="/manufacturing/production" element={<ProductionPage />} />
              <Route path="/manufacturing/reports" element={<ManufacturingReports />} />
              <Route path="/reports/financial" element={<FinancialReports />} />
              <Route path="/reports/stock-ledger" element={<StockLedger />} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
              <Route path="/admin/roles" element={<ProtectedRoute requireAdmin><RolesPage /></ProtectedRoute>} />
              <Route path="/admin/branches" element={<ProtectedRoute requireAdmin><BranchesPage /></ProtectedRoute>} />
              <Route path="/admin/audit-log" element={<ProtectedRoute requireAdmin><AuditLogPage /></ProtectedRoute>} />
              <Route path="/admin/backup" element={<ProtectedRoute requireAdmin><BackupPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
