import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

const ExpensePage = () => (
  <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
    <h1 className="text-xl font-bold text-foreground">Expenses</h1>
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-destructive" />Expense Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Expense entries are recorded via Payment Vouchers in the Accounting module.
          Navigate to <strong>Accounts → Payment Voucher</strong> to create expense entries.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default ExpensePage;
