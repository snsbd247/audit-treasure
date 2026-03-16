import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportHeader } from "@/components/ReportHeader";
import {
  FileText, BookOpen, TrendingUp, Scale, ScrollText, Users,
  PiggyBank, Landmark, GitCompare, CreditCard, Receipt,
  ArrowLeftRight, UserCheck, Truck, Clock, TrendingDown,
  BarChart3, ChevronRight,
} from "lucide-react";

const reportGroups = [
  {
    title: "Core Financial",
    items: [
      { to: "/reports/trial-balance", label: "Trial Balance", icon: FileText, desc: "Debit & credit balances of all accounts" },
      { to: "/reports/profit-loss", label: "Profit & Loss", icon: TrendingUp, desc: "Income vs expenses summary" },
      { to: "/reports/balance-sheet", label: "Balance Sheet", icon: Scale, desc: "Assets, liabilities & equity" },
      { to: "/reports/general-ledger", label: "General Ledger", icon: BookOpen, desc: "All transactions across accounts" },
      { to: "/reports/account-ledger", label: "Account Ledger", icon: ScrollText, desc: "Ledger for a specific account" },
      { to: "/reports/party-ledger", label: "Party Ledger", icon: Users, desc: "Customer & supplier ledger" },
    ],
  },
  {
    title: "Cash & Bank",
    items: [
      { to: "/reports/cash-book", label: "Cash Book", icon: PiggyBank, desc: "Cash account transactions" },
      { to: "/reports/bank-book", label: "Bank Book", icon: Landmark, desc: "Bank account transactions" },
      { to: "/reports/bank-reconciliation", label: "Bank Reconciliation", icon: GitCompare, desc: "Compare ERP vs bank statement" },
    ],
  },
  {
    title: "Voucher Reports",
    items: [
      { to: "/reports/journal-vouchers", label: "Journal Vouchers", icon: FileText, desc: "All journal entries" },
      { to: "/reports/payment-vouchers", label: "Payment Vouchers", icon: CreditCard, desc: "All payments made" },
      { to: "/reports/receipt-vouchers", label: "Receipt Vouchers", icon: Receipt, desc: "All receipts received" },
      { to: "/reports/contra-vouchers", label: "Contra Vouchers", icon: ArrowLeftRight, desc: "Cash ↔ bank transfers" },
    ],
  },
  {
    title: "Receivable & Payable",
    items: [
      { to: "/reports/accounts-receivable", label: "Accounts Receivable", icon: UserCheck, desc: "Customer outstanding balances" },
      { to: "/reports/accounts-payable", label: "Accounts Payable", icon: Truck, desc: "Supplier outstanding balances" },
      { to: "/reports/ar-aging", label: "AR Aging", icon: Clock, desc: "Customer aging analysis" },
      { to: "/reports/ap-aging", label: "AP Aging", icon: Clock, desc: "Supplier aging analysis" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { to: "/reports/expense-analysis", label: "Expense Analysis", icon: TrendingDown, desc: "Expense breakdown by category" },
      { to: "/reports/income-analysis", label: "Income Analysis", icon: TrendingUp, desc: "Income breakdown by source" },
      { to: "/reports/financial-summary", label: "Financial Summary", icon: BarChart3, desc: "Dashboard with key metrics" },
    ],
  },
];

const FinancialReports = () => {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle="Accounting Reports" />
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Accounting Reports</h1>
      </div>
      <p className="text-sm text-muted-foreground">Select a report to generate. All reports support date filtering, branch filtering, print, PDF and Excel export.</p>

      {reportGroups.map((group) => (
        <div key={group.title}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((item) => (
              <Link key={item.to} to={item.to}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinancialReports;
