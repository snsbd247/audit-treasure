import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const IncomePage = () => (
  <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
    <h1 className="text-xl font-bold text-foreground">Income</h1>
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />Income Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Income entries are recorded via Receipt Vouchers in the Accounting module.
          Navigate to <strong>Accounts → Receipt Voucher</strong> to create income entries.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default IncomePage;
