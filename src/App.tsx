import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
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
import DocumentNumberingPage from "./pages/admin/DocumentNumberingPage";
import ChartOfAccounts from "./pages/accounts/ChartOfAccounts";
import AccountingVouchers from "./pages/accounts/AccountingVouchers";
import PurchasesPage from "./pages/purchase/PurchasesPage";
import SalesPage from "./pages/sales/SalesPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import UnitsPage from "./pages/inventory/UnitsPage";
import ItemCategoriesPage from "./pages/inventory/ItemCategoriesPage";
import ItemMasterPage from "./pages/inventory/ItemMasterPage";
import WarehousesPage from "./pages/inventory/WarehousesPage";
import StockTransferPage from "./pages/inventory/StockTransferPage";
import BOMPage from "./pages/manufacturing/BOMPage";
import ProductionPage from "./pages/manufacturing/ProductionPage";
import ManufacturingReports from "./pages/manufacturing/ManufacturingReports";
import FinancialReports from "./pages/reports/FinancialReports";
import StockLedger from "./pages/reports/StockLedger";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import FinancialYearsPage from "./pages/FinancialYearsPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import BankAccountsPage from "./pages/bank/BankAccountsPage";
import CashBookPage from "./pages/bank/CashBookPage";
import LowStockPage from "./pages/reports/LowStockPage";
import StockReportsPage from "./pages/reports/StockReportsPage";
import StockAdjustmentPage from "./pages/inventory/StockAdjustmentPage";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import ShortcutsPage from "./pages/admin/ShortcutsPage";
import BrandingPage from "./pages/admin/BrandingPage";

// HRM Pages
import EmployeesPage from "./pages/hrm/EmployeesPage";
import DepartmentsPage from "./pages/hrm/DepartmentsPage";
import DesignationsPage from "./pages/hrm/DesignationsPage";
import AttendancePage from "./pages/hrm/AttendancePage";
import LeavePage from "./pages/hrm/LeavePage";
import PayrollPage from "./pages/hrm/PayrollPage";
import DocumentsPage from "./pages/hrm/DocumentsPage";
import IdCardsPage from "./pages/hrm/IdCardsPage";
import HrReportsPage from "./pages/hrm/HrReportsPage";
import EmployeeVerifyPage from "./pages/hrm/EmployeeVerifyPage";
import ShiftsPage from "./pages/hrm/ShiftsPage";
import BiometricImportPage from "./pages/hrm/BiometricImportPage";
import OvertimePage from "./pages/hrm/OvertimePage";
import FaceAttendancePage from "./pages/hrm/FaceAttendancePage";
import HrDashboardPage from "./pages/hrm/HrDashboardPage";

// Inventory - Stock Ledger
import StockLedgerPage from "./pages/inventory/StockLedgerPage";

// Employee Portal Pages
import MyProfilePage from "./pages/portal/MyProfilePage";
import MyAttendancePage from "./pages/portal/MyAttendancePage";
import MyLeavePage from "./pages/portal/MyLeavePage";
import MyPayslipsPage from "./pages/portal/MyPayslipsPage";
import MyDocumentsPage from "./pages/portal/MyDocumentsPage";

// Accounting Report Pages
import TrialBalanceReport from "./pages/reports/accounting/TrialBalanceReport";
import ProfitLossReport from "./pages/reports/accounting/ProfitLossReport";
import BalanceSheetReport from "./pages/reports/accounting/BalanceSheetReport";
import GeneralLedgerReport from "./pages/reports/accounting/GeneralLedgerReport";
import AccountLedgerReport from "./pages/reports/accounting/AccountLedgerReport";
import PartyLedgerReport from "./pages/reports/accounting/PartyLedgerReport";
import CashBookReport from "./pages/reports/accounting/CashBookReport";
import BankBookReport from "./pages/reports/accounting/BankBookReport";
import BankReconciliationReport from "./pages/reports/accounting/BankReconciliationReport";
import { JournalVoucherReport, PaymentVoucherReport, ReceiptVoucherReport, ContraVoucherReport } from "./pages/reports/accounting/VoucherReports";
import AccountsReceivableReport from "./pages/reports/accounting/AccountsReceivableReport";
import AccountsPayableReport from "./pages/reports/accounting/AccountsPayableReport";
import { ARAgingReport, APAgingReport } from "./pages/reports/accounting/AgingReports";
import { ExpenseAnalysisReport, IncomeAnalysisReport } from "./pages/reports/accounting/AnalysisReports";
import FinancialSummaryDashboard from "./pages/reports/accounting/FinancialSummaryDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <BranchProvider>
          <CurrencyProvider>
          <ModuleProvider>
          <BrandingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/employee/verify/:code" element={<EmployeeVerifyPage />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vouchers" element={<VouchersPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/accounts/chart" element={<ChartOfAccounts />} />
                <Route path="/accounts/vouchers" element={<AccountingVouchers />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/products" element={<ItemMasterPage />} />
                <Route path="/purchase" element={<PurchasesPage />} />
                <Route path="/purchase/returns" element={<PurchasesPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/returns" element={<SalesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/inventory/items" element={<ItemMasterPage />} />
                <Route path="/inventory/categories" element={<ItemCategoriesPage />} />
                <Route path="/inventory/units" element={<UnitsPage />} />
                <Route path="/inventory/warehouses" element={<WarehousesPage />} />
                <Route path="/inventory/transfers" element={<StockTransferPage />} />
                <Route path="/inventory/adjustments" element={<StockAdjustmentPage />} />
                <Route path="/manufacturing/materials" element={<ItemMasterPage />} />
                <Route path="/manufacturing/bom" element={<BOMPage />} />
                <Route path="/manufacturing/production" element={<ProductionPage />} />
                <Route path="/manufacturing/reports" element={<ManufacturingReports />} />
                {/* Accounting Reports */}
                <Route path="/reports/financial" element={<FinancialReports />} />
                <Route path="/reports/trial-balance" element={<TrialBalanceReport />} />
                <Route path="/reports/profit-loss" element={<ProfitLossReport />} />
                <Route path="/reports/balance-sheet" element={<BalanceSheetReport />} />
                <Route path="/reports/general-ledger" element={<GeneralLedgerReport />} />
                <Route path="/reports/account-ledger" element={<AccountLedgerReport />} />
                <Route path="/reports/party-ledger" element={<PartyLedgerReport />} />
                <Route path="/reports/cash-book" element={<CashBookReport />} />
                <Route path="/reports/bank-book" element={<BankBookReport />} />
                <Route path="/reports/bank-reconciliation" element={<BankReconciliationReport />} />
                <Route path="/reports/journal-vouchers" element={<JournalVoucherReport />} />
                <Route path="/reports/payment-vouchers" element={<PaymentVoucherReport />} />
                <Route path="/reports/receipt-vouchers" element={<ReceiptVoucherReport />} />
                <Route path="/reports/contra-vouchers" element={<ContraVoucherReport />} />
                <Route path="/reports/accounts-receivable" element={<AccountsReceivableReport />} />
                <Route path="/reports/accounts-payable" element={<AccountsPayableReport />} />
                <Route path="/reports/ar-aging" element={<ARAgingReport />} />
                <Route path="/reports/ap-aging" element={<APAgingReport />} />
                <Route path="/reports/expense-analysis" element={<ExpenseAnalysisReport />} />
                <Route path="/reports/income-analysis" element={<IncomeAnalysisReport />} />
                <Route path="/reports/financial-summary" element={<FinancialSummaryDashboard />} />
                {/* Other reports */}
                <Route path="/reports/stock-ledger" element={<StockLedger />} />
                <Route path="/reports/stock-reports" element={<StockReportsPage />} />
                <Route path="/reports/low-stock" element={<LowStockPage />} />
                <Route path="/reports/sales" element={<FinancialReports />} />
                <Route path="/reports/purchase" element={<FinancialReports />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route path="/bank/accounts" element={<BankAccountsPage />} />
                <Route path="/bank/cashbook" element={<CashBookPage />} />
                {/* HRM Routes */}
                <Route path="/hrm/dashboard" element={<HrDashboardPage />} />
                <Route path="/hrm/employees" element={<EmployeesPage />} />
                <Route path="/hrm/departments" element={<DepartmentsPage />} />
                <Route path="/hrm/designations" element={<DesignationsPage />} />
                <Route path="/hrm/attendance" element={<AttendancePage />} />
                <Route path="/hrm/biometric" element={<BiometricImportPage />} />
                <Route path="/hrm/face-attendance" element={<FaceAttendancePage />} />
                <Route path="/hrm/shifts" element={<ShiftsPage />} />
                <Route path="/hrm/overtime" element={<OvertimePage />} />
                <Route path="/hrm/leave" element={<LeavePage />} />
                <Route path="/hrm/payroll" element={<PayrollPage />} />
                <Route path="/hrm/documents" element={<DocumentsPage />} />
                <Route path="/hrm/id-cards" element={<IdCardsPage />} />
                <Route path="/hrm/reports" element={<HrReportsPage />} />
                {/* Stock Ledger */}
                <Route path="/inventory/stock-ledger" element={<StockLedgerPage />} />
                {/* Employee Portal Routes */}
                <Route path="/portal/profile" element={<MyProfilePage />} />
                <Route path="/portal/attendance" element={<MyAttendancePage />} />
                <Route path="/portal/leave" element={<MyLeavePage />} />
                <Route path="/portal/payslips" element={<MyPayslipsPage />} />
                <Route path="/portal/documents" element={<MyDocumentsPage />} />
                {/* Admin Routes */}
                <Route path="/admin/users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
                <Route path="/admin/roles" element={<ProtectedRoute requireAdmin><RolesPage /></ProtectedRoute>} />
                <Route path="/admin/branches" element={<ProtectedRoute requireAdmin><BranchesPage /></ProtectedRoute>} />
                <Route path="/admin/financial-years" element={<ProtectedRoute requireAdmin><FinancialYearsPage /></ProtectedRoute>} />
                <Route path="/admin/audit-log" element={<ProtectedRoute requireAdmin><AuditLogPage /></ProtectedRoute>} />
                <Route path="/admin/backup" element={<ProtectedRoute requireAdmin><BackupPage /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><GeneralSettingsPage /></ProtectedRoute>} />
                <Route path="/admin/numbering" element={<ProtectedRoute requireAdmin><DocumentNumberingPage /></ProtectedRoute>} />
                <Route path="/admin/shortcuts" element={<ProtectedRoute requireAdmin><ShortcutsPage /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </BrandingProvider>
          </ModuleProvider>
          </CurrencyProvider>
          </BranchProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
