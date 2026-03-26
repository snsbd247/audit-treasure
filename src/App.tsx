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
import InstallPage from "./pages/InstallPage";
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
import SalesInvoiceDetailPage from "./pages/sales/SalesInvoiceDetailPage";
import PurchaseDetailPage from "./pages/purchase/PurchaseDetailPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import UnitsPage from "./pages/inventory/UnitsPage";
import ItemCategoriesPage from "./pages/inventory/ItemCategoriesPage";
import ItemMasterPage from "./pages/inventory/ItemMasterPage";
import WarehousesPage from "./pages/inventory/WarehousesPage";
import StockTransferPage from "./pages/inventory/StockTransferPage";
import FinancialReports from "./pages/reports/FinancialReports";
import StockLedger from "./pages/reports/StockLedger";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import CustomerProfilePage from "./pages/CustomerProfilePage";
import SupplierProfilePage from "./pages/SupplierProfilePage";
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
import SmsSettingsPage from "./pages/admin/SmsSettingsPage";
import MessagingPage from "./pages/messaging/MessagingPage";
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
import EmployeeProfilePage from "./pages/hrm/EmployeeProfilePage";
import LoginActivityPage from "./pages/hrm/LoginActivityPage";

// ISP Pages
import IspDashboardPage from "./pages/isp/IspDashboardPage";
import IspCustomersPage from "./pages/isp/IspCustomersPage";
import IspPackagesPage from "./pages/isp/IspPackagesPage";
import IspInvoicesPage from "./pages/isp/IspInvoicesPage";
import IspPaymentsPage from "./pages/isp/IspPaymentsPage";
import IspRoutersPage from "./pages/isp/IspRoutersPage";
import IspResellersPage from "./pages/isp/IspResellersPage";
import IspUsagePage from "./pages/isp/IspUsagePage";

// ISP Customer Portal
import IspPortalLoginPage from "./pages/isp-portal/IspPortalLoginPage";
import IspPortalDashboard from "./pages/isp-portal/IspPortalDashboard";
import IspPortalBillsPage from "./pages/isp-portal/IspPortalBillsPage";
import IspPortalPaymentsPage from "./pages/isp-portal/IspPortalPaymentsPage";

// Manufacturing Pages
import BOMPage from "./pages/manufacturing/BOMPage";
import ProductionPage from "./pages/manufacturing/ProductionPage";
import ManufacturingReports from "./pages/manufacturing/ManufacturingReports";
import RawMaterialsPage from "./pages/manufacturing/RawMaterialsPage";

// Inventory - Stock Ledger
import StockLedgerPage from "./pages/inventory/StockLedgerPage";

// Employee Portal Pages
import MyDashboardPage from "./pages/portal/MyDashboardPage";
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
import CustomerStatementPage from "./pages/reports/CustomerStatementPage";

const queryClient = new QueryClient();

/** Helper: wraps a page with permission check */
const P = ({ perm, children }: { perm: string; children: React.ReactNode }) => (
  <ProtectedRoute requiredPermission={perm}>{children}</ProtectedRoute>
);

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
              <Route path="/install" element={<InstallPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/employee/verify" element={<EmployeeVerifyPage />} />
              <Route path="/employee/verify/:code" element={<EmployeeVerifyPage />} />
              <Route path="/verify/:code" element={<EmployeeVerifyPage />} />

              {/* ISP Customer Portal (public, no ERP auth) */}
              <Route path="/isp-portal/login" element={<IspPortalLoginPage />} />
              <Route path="/isp-portal/dashboard" element={<IspPortalDashboard />} />
              <Route path="/isp-portal/bills" element={<IspPortalBillsPage />} />
              <Route path="/isp-portal/payments" element={<IspPortalPaymentsPage />} />

              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                {/* Dashboard — all authenticated users */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/vouchers" element={<VouchersPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route path="/messaging" element={<MessagingPage />} />

                {/* ─── Accounts ─────────────────────────────────── */}
                <Route path="/accounts/chart" element={<P perm="accounts.view"><ChartOfAccounts /></P>} />
                <Route path="/accounts/vouchers" element={<AccountingVouchers />} />

                {/* ─── Sales ────────────────────────────────────── */}
                <Route path="/sales" element={<P perm="sales.view"><SalesPage /></P>} />
                <Route path="/sales/invoices/:id" element={<P perm="sales.view"><SalesInvoiceDetailPage /></P>} />
                <Route path="/sales/returns" element={<P perm="sales.view"><SalesPage /></P>} />
                <Route path="/customers" element={<P perm="sales.view"><CustomersPage /></P>} />
                <Route path="/customers/:id" element={<P perm="sales.view"><CustomerProfilePage /></P>} />

                {/* ─── Purchase ─────────────────────────────────── */}
                <Route path="/purchase" element={<P perm="purchase.view"><PurchasesPage /></P>} />
                <Route path="/purchase/invoices/:id" element={<P perm="purchase.view"><PurchaseDetailPage /></P>} />
                <Route path="/purchase/returns" element={<P perm="purchase.view"><PurchasesPage /></P>} />
                <Route path="/suppliers" element={<P perm="purchase.view"><SuppliersPage /></P>} />
                <Route path="/suppliers/:id" element={<P perm="purchase.view"><SupplierProfilePage /></P>} />

                {/* ─── Inventory ────────────────────────────────── */}
                <Route path="/inventory" element={<P perm="inventory.view"><InventoryPage /></P>} />
                <Route path="/inventory/items" element={<P perm="inventory.view"><ItemMasterPage /></P>} />
                <Route path="/inventory/categories" element={<P perm="inventory.view"><ItemCategoriesPage /></P>} />
                <Route path="/inventory/units" element={<P perm="inventory.view"><UnitsPage /></P>} />
                <Route path="/inventory/warehouses" element={<P perm="inventory.view"><WarehousesPage /></P>} />
                <Route path="/inventory/transfers" element={<P perm="inventory.view"><StockTransferPage /></P>} />
                <Route path="/inventory/adjustments" element={<P perm="inventory.view"><StockAdjustmentPage /></P>} />
                <Route path="/inventory/stock-ledger" element={<P perm="inventory.view"><StockLedgerPage /></P>} />
                <Route path="/products" element={<P perm="inventory.view"><ItemMasterPage /></P>} />


                {/* ─── Bank & Cash ──────────────────────────────── */}
                <Route path="/bank/accounts" element={<P perm="bank.view"><BankAccountsPage /></P>} />
                <Route path="/bank/cashbook" element={<P perm="bank.view"><CashBookPage /></P>} />

                {/* ─── HRM ──────────────────────────────────────── */}
                <Route path="/hrm/dashboard" element={<P perm="hrm.view"><HrDashboardPage /></P>} />
                <Route path="/hrm/employees" element={<P perm="hrm.view"><EmployeesPage /></P>} />
                <Route path="/hrm/employees/:id" element={<P perm="hrm.view"><EmployeeProfilePage /></P>} />
                <Route path="/hrm/departments" element={<P perm="hrm.view"><DepartmentsPage /></P>} />
                <Route path="/hrm/designations" element={<P perm="hrm.view"><DesignationsPage /></P>} />
                <Route path="/hrm/shifts" element={<P perm="hrm.view"><ShiftsPage /></P>} />
                <Route path="/hrm/attendance" element={<P perm="hrm.view"><AttendancePage /></P>} />
                <Route path="/hrm/biometric" element={<P perm="hrm.view"><BiometricImportPage /></P>} />
                <Route path="/hrm/face-attendance" element={<P perm="hrm.view"><FaceAttendancePage /></P>} />
                <Route path="/hrm/overtime" element={<P perm="hrm.view"><OvertimePage /></P>} />
                <Route path="/hrm/leave" element={<P perm="hrm.view"><LeavePage /></P>} />
                <Route path="/hrm/payroll" element={<P perm="hrm.view"><PayrollPage /></P>} />
                <Route path="/hrm/documents" element={<P perm="hrm.view"><DocumentsPage /></P>} />
                <Route path="/hrm/id-cards" element={<P perm="hrm.view"><IdCardsPage /></P>} />
                <Route path="/hrm/reports" element={<P perm="hrm.view"><HrReportsPage /></P>} />
                <Route path="/hrm/login-activity" element={<P perm="hrm.view"><LoginActivityPage /></P>} />

                {/* ─── Employee Portal (own data — no module permission needed) ── */}
                <Route path="/portal/dashboard" element={<MyDashboardPage />} />
                <Route path="/portal/profile" element={<MyProfilePage />} />
                <Route path="/portal/attendance" element={<MyAttendancePage />} />
                <Route path="/portal/leave" element={<MyLeavePage />} />
                <Route path="/portal/payslips" element={<MyPayslipsPage />} />
                <Route path="/portal/documents" element={<MyDocumentsPage />} />

                {/* ─── Reports ──────────────────────────────────── */}
                <Route path="/reports/financial" element={<P perm="reports.view"><FinancialReports /></P>} />
                <Route path="/reports/financial-summary" element={<P perm="reports.view"><FinancialSummaryDashboard /></P>} />
                <Route path="/reports/trial-balance" element={<P perm="accounts.view"><TrialBalanceReport /></P>} />
                <Route path="/reports/profit-loss" element={<P perm="accounts.view"><ProfitLossReport /></P>} />
                <Route path="/reports/balance-sheet" element={<P perm="accounts.view"><BalanceSheetReport /></P>} />
                <Route path="/reports/general-ledger" element={<P perm="accounts.view"><GeneralLedgerReport /></P>} />
                <Route path="/reports/account-ledger" element={<P perm="accounts.view"><AccountLedgerReport /></P>} />
                <Route path="/reports/party-ledger" element={<P perm="reports.view"><PartyLedgerReport /></P>} />
                <Route path="/reports/cash-book" element={<P perm="bank.view"><CashBookReport /></P>} />
                <Route path="/reports/bank-book" element={<P perm="bank.view"><BankBookReport /></P>} />
                <Route path="/reports/bank-reconciliation" element={<P perm="bank.view"><BankReconciliationReport /></P>} />
                <Route path="/reports/journal-vouchers" element={<P perm="journal.view"><JournalVoucherReport /></P>} />
                <Route path="/reports/payment-vouchers" element={<P perm="payment.view"><PaymentVoucherReport /></P>} />
                <Route path="/reports/receipt-vouchers" element={<P perm="receipt.view"><ReceiptVoucherReport /></P>} />
                <Route path="/reports/contra-vouchers" element={<P perm="contra.view"><ContraVoucherReport /></P>} />
                <Route path="/reports/accounts-receivable" element={<P perm="sales.view"><AccountsReceivableReport /></P>} />
                <Route path="/reports/ar-aging" element={<P perm="sales.view"><ARAgingReport /></P>} />
                <Route path="/reports/income-analysis" element={<P perm="sales.view"><IncomeAnalysisReport /></P>} />
                <Route path="/reports/accounts-payable" element={<P perm="purchase.view"><AccountsPayableReport /></P>} />
                <Route path="/reports/ap-aging" element={<P perm="purchase.view"><APAgingReport /></P>} />
                <Route path="/reports/expense-analysis" element={<P perm="purchase.view"><ExpenseAnalysisReport /></P>} />
                <Route path="/reports/stock-ledger" element={<P perm="inventory.view"><StockLedger /></P>} />
                <Route path="/reports/stock-reports" element={<P perm="inventory.view"><StockReportsPage /></P>} />
                <Route path="/reports/low-stock" element={<P perm="inventory.view"><LowStockPage /></P>} />
                <Route path="/reports/customer-statement" element={<P perm="sales.view"><CustomerStatementPage /></P>} />
                <Route path="/reports/sales" element={<P perm="sales.view"><FinancialReports /></P>} />
                <Route path="/reports/purchase" element={<P perm="purchase.view"><FinancialReports /></P>} />

                {/* ─── ISP Management ──────────────────────────── */}
                <Route path="/isp" element={<P perm="isp.view"><IspDashboardPage /></P>} />
                <Route path="/isp/customers" element={<P perm="isp.view"><IspCustomersPage /></P>} />
                <Route path="/isp/packages" element={<P perm="isp.view"><IspPackagesPage /></P>} />
                <Route path="/isp/invoices" element={<P perm="isp.view"><IspInvoicesPage /></P>} />
                <Route path="/isp/payments" element={<P perm="isp.view"><IspPaymentsPage /></P>} />
                <Route path="/isp/routers" element={<P perm="isp.view"><IspRoutersPage /></P>} />
                <Route path="/isp/resellers" element={<P perm="isp.view"><IspResellersPage /></P>} />
                <Route path="/isp/customers/:id/usage" element={<P perm="isp.view"><IspUsagePage /></P>} />

                {/* ─── Administration ──────────────────────────── */}
                <Route path="/admin/users" element={<P perm="users.view"><UsersPage /></P>} />
                <Route path="/admin/roles" element={<P perm="roles.view"><RolesPage /></P>} />
                <Route path="/admin/branches" element={<P perm="branches.view"><BranchesPage /></P>} />
                <Route path="/admin/financial-years" element={<P perm="financial_years.view"><FinancialYearsPage /></P>} />
                <Route path="/admin/audit-log" element={<P perm="audit_log.view"><AuditLogPage /></P>} />
                <Route path="/admin/backup" element={<P perm="backup.view"><BackupPage /></P>} />
                <Route path="/admin/settings" element={<P perm="settings.view"><GeneralSettingsPage /></P>} />
                <Route path="/admin/numbering" element={<P perm="settings.view"><DocumentNumberingPage /></P>} />
                <Route path="/admin/shortcuts" element={<P perm="settings.view"><ShortcutsPage /></P>} />
                <Route path="/admin/branding" element={<P perm="settings.view"><BrandingPage /></P>} />
                <Route path="/admin/sms" element={<P perm="settings.view"><SmsSettingsPage /></P>} />
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