import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, Clock } from "lucide-react";

const TABLES = [
  "branches", "chart_of_accounts", "products", "product_categories", "raw_materials",
  "suppliers", "customers", "acc_vouchers", "voucher_entries", "purchases", "purchase_items",
  "purchase_returns", "purchase_return_items", "sales_invoices", "sales_invoice_items",
  "sales_returns", "sales_return_items", "stock_movements", "production_entries",
  "production_materials", "bill_of_materials", "bom_items", "custom_roles", "role_permissions",
  "financial_years", "number_sequences",
];

const BackupPage = () => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const allData: Record<string, any[]> = {};
      for (const table of TABLES) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) {
          console.warn(`Skipping ${table}: ${error.message}`);
          continue;
        }
        allData[table] = data || [];
      }

      const json = JSON.stringify(allData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Backup exported", description: "JSON file downloaded successfully." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let restored = 0;
      for (const table of TABLES) {
        if (data[table] && data[table].length > 0) {
          const { error } = await supabase.from(table).upsert(data[table], { onConflict: "id" });
          if (error) console.warn(`Error restoring ${table}: ${error.message}`);
          else restored++;
        }
      }

      toast({ title: "Restore complete", description: `${restored} tables restored successfully.` });
    } catch (err: any) {
      toast({ title: "Restore failed", description: err.message, variant: "destructive" });
    }
    e.target.value = "";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold text-foreground">Backup & Restore</h1></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4" />Manual Backup</CardTitle>
            <CardDescription>Export all data as a JSON file</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This will export data from {TABLES.length} tables including accounts, vouchers, products, purchases, sales, inventory, and settings.
            </p>
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />{exporting ? "Exporting..." : "Download Backup"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4" />Restore Data</CardTitle>
            <CardDescription>Import data from a JSON backup file</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a previously exported JSON backup file. Existing records will be updated, new records will be inserted.
            </p>
            <label>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline"><span><Upload className="w-4 h-4 mr-2" />Upload & Restore</span></Button>
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" />Backup Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>Tables included:</strong> {TABLES.length} tables covering all modules</p>
            <p>• <strong>Format:</strong> JSON (human-readable, portable)</p>
            <p>• <strong>Restore method:</strong> Upsert — existing records are updated, new records are added</p>
            <p>• <strong>Recommendation:</strong> Take regular backups before major data changes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default BackupPage;
