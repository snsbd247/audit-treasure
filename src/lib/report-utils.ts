import * as XLSX from "xlsx";

export interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: "currency" | "date" | "number";
}

export function exportToExcel(
  data: Record<string, any>[],
  columns: ReportColumn[],
  filename: string
) {
  const headers = columns.map((c) => c.label);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (c.format === "currency" && typeof val === "number") return val;
      return val ?? "";
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function printReport(
  contentRef: React.RefObject<HTMLDivElement | null>,
  title: string,
  companyName?: string,
  companyInfo?: { address?: string; phone?: string; email?: string }
) {
  const content = contentRef.current;
  if (!content) return;
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) return;

  win.document.write(`<!DOCTYPE html><html><head><title>${title} — ${companyName || "Report"}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; }
      .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; }
      .header h1 { font-size: 18px; font-weight: 700; }
      .header h2 { font-size: 14px; font-weight: 600; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
      .header p { font-size: 11px; color: #666; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th { background: #f0f0f0; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; }
      td { padding: 6px 10px; border: 1px solid #ddd; font-size: 12px; }
      .text-right { text-align: right; }
      .font-bold, .total-row { font-weight: 700; }
      .total-row { background: #f0f0f0; }
      .bg-muted\\/50 { background: #f8f8f8; }
      .section-title { font-size: 14px; font-weight: 600; margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      .summary-card { padding: 12px; background: #f8f8f8; border-radius: 4px; margin: 8px 0; }
      .timestamp { font-size: 10px; color: #999; text-align: right; margin-top: 30px; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <div class="header">
      <h1>${companyName || "Company"}</h1>
      ${companyInfo?.address ? `<p>${companyInfo.address}</p>` : ""}
      <p>${[companyInfo?.phone && `Phone: ${companyInfo.phone}`, companyInfo?.email && `Email: ${companyInfo.email}`].filter(Boolean).join(" | ")}</p>
      <h2>${title}</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    ${content.innerHTML}
    <p class="timestamp">This is a system-generated report.</p>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

export function exportToPDF(
  contentRef: React.RefObject<HTMLDivElement | null>,
  title: string,
  companyName?: string,
  companyInfo?: { address?: string; phone?: string; email?: string }
) {
  // Uses the same print dialog which allows "Save as PDF"
  printReport(contentRef, title, companyName, companyInfo);
}
