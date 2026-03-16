import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BranchProvider } from "@/contexts/BranchContext";
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
import GeneralSettingsPage from "./pages/admin/GeneralSettingsPage";
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
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import FinancialYearsPage from "./pages/FinancialYearsPage";
import IncomePage from "./pages/transactions/IncomePage";
import ExpensePage from "./pages/transactions/ExpensePage";
import BankAccountsPage from "./pages/bank/BankAccountsPage";
import CashBookPage from "./pages/bank/CashBookPage";
import LowStockPage from "./pages/reports/LowStockPage";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <BranchProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vouchers" element={<VouchersPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/accounts/chart" element={<ChartOfAccounts />} />
                <Route path="/accounts/vouchers" element={<AccountingVouchers />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/purchase" element={<PurchasesPage />} />
                <Route path="/purchase/returns" element={<PurchasesPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/returns" element={<SalesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/manufacturing/materials" element={<RawMaterialsPage />} />
                <Route path="/manufacturing/bom" element={<BOMPage />} />
                <Route path="/manufacturing/production" element={<ProductionPage />} />
                <Route path="/manufacturing/reports" element={<ManufacturingReports />} />
                <Route path="/reports/financial" element={<FinancialReports />} />
                <Route path="/reports/stock-ledger" element={<StockLedger />} />
                <Route path="/reports/low-stock" element={<LowStockPage />} />
                <Route path="/reports/sales" element={<FinancialReports />} />
                <Route path="/reports/purchase" element={<FinancialReports />} />
                <Route path="/transactions/income" element={<IncomePage />} />
                <Route path="/transactions/expense" element={<ExpensePage />} />
                <Route path="/bank/accounts" element={<BankAccountsPage />} />
                <Route path="/bank/cashbook" element={<CashBookPage />} />
                <Route path="/admin/users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
                <Route path="/admin/roles" element={<ProtectedRoute requireAdmin><RolesPage /></ProtectedRoute>} />
                <Route path="/admin/branches" element={<ProtectedRoute requireAdmin><BranchesPage /></ProtectedRoute>} />
                <Route path="/admin/financial-years" element={<ProtectedRoute requireAdmin><FinancialYearsPage /></ProtectedRoute>} />
                <Route path="/admin/audit-log" element={<ProtectedRoute requireAdmin><AuditLogPage /></ProtectedRoute>} />
                <Route path="/admin/backup" element={<ProtectedRoute requireAdmin><BackupPage /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><GeneralSettingsPage /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </BranchProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
