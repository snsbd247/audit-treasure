import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReportData } from "@/hooks/useReportData";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

const PartyLedgerReport = () => {
  const { branches, loading, setLoading, fc, printRef, dateFrom, setDateFrom, dateTo, setDateTo, branch, setBranch, handlePrint, handleExportExcel, handleExportPDF } = useReportData();
  const [partyType, setPartyType] = useState<"customer" | "supplier">("customer");
  const [parties, setParties] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [data, setData] = useState<any[]>([]);

  const fetchParties = async (type: "customer" | "supplier") => {
    const table = type === "customer" ? "customers" : "suppliers";
    const { data } = await supabase.from(table).select("id, name").order("name");
    setParties(data || []);
  };

  const handlePartyTypeChange = (type: string) => {
    setPartyType(type as "customer" | "supplier");
    setSelectedParty("");
    setData([]);
    fetchParties(type as "customer" | "supplier");
  };

  const fetchData = async () => {
    if (!selectedParty) return;
    setLoading(true);
    // Get invoices for this party
    const table = partyType === "customer" ? "sales_invoices" : "purchases";
    const partyField = partyType === "customer" ? "customer_id" : "supplier_id";
    const numberField = partyType === "customer" ? "invoice_number" : "purchase_number";
    const dateField = partyType === "customer" ? "invoice_date" : "purchase_date";

    let query = supabase.from(table).select("*")
      .eq(partyField, selectedParty)
      .gte(dateField, dateFrom)
      .lte(dateField, dateTo)
      .order(dateField);

    if (branch !== "all") query = query.eq("branch_id", branch);

    const { data: invoices } = await query;
    let runBal = 0;
    const result = (invoices || []).map((inv: any) => {
      const amount = Number(inv.total_amount || inv.net_amount || 0);
      const dr = partyType === "customer" ? amount : 0;
      const cr = partyType === "customer" ? 0 : amount;
      runBal += dr - cr;
      return {
        id: inv.id,
        date: inv[dateField],
        voucher_number: inv[numberField],
        description: inv.notes || "—",
        debit: dr,
        credit: cr,
        balance: runBal,
      };
    });
    setData(result);
    setLoading(false);
  };

  const title = `${partyType === "customer" ? "Customer" : "Supplier"} Ledger`;
  const columns = [
    { key: "date", label: "Date" }, { key: "voucher_number", label: "Voucher #" },
    { key: "description", label: "Description" },
    { key: "debit", label: "Debit", format: "currency" as const }, { key: "credit", label: "Credit", format: "currency" as const },
    { key: "balance", label: "Balance", format: "currency" as const },
  ];

  // Load parties on mount
  useState(() => { fetchParties("customer"); });

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <ReportHeader reportTitle={title} subtitle={`${dateFrom} to ${dateTo}`} />
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Party Ledger</h1>
      </div>
      <Tabs value={partyType} onValueChange={handlePartyTypeChange}>
        <TabsList><TabsTrigger value="customer">Customer</TabsTrigger><TabsTrigger value="supplier">Supplier</TabsTrigger></TabsList>
      </Tabs>
      <ReportFilters
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        branches={branches} selectedBranch={branch} onBranchChange={setBranch}
        onSearch={fetchData} loading={loading}
        onPrint={() => handlePrint(title)}
        onExportExcel={() => handleExportExcel(data, columns, "party-ledger")}
        onExportPDF={() => handleExportPDF(title)}
      >
        <div className="space-y-1.5">
          <Label className="text-xs">{partyType === "customer" ? "Customer" : "Supplier"}</Label>
          <Select value={selectedParty} onValueChange={setSelectedParty}>
            <SelectTrigger className="w-52 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{parties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </ReportFilters>
      <div ref={printRef}>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Voucher #</TableHead><TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Select a {partyType} and click "Generate"</TableCell></TableRow>
              ) : data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.date}</TableCell>
                  <TableCell className="font-mono text-xs">{e.voucher_number}</TableCell>
                  <TableCell className="text-muted-foreground">{e.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.debit > 0 ? fc(e.debit) : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.credit > 0 ? fc(e.credit) : ""}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${e.balance < 0 ? "text-destructive" : ""}`}>{fc(Math.abs(e.balance))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default PartyLedgerReport;
