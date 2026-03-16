import { useCompanySettings } from "@/hooks/useCompanySettings";

interface ReportHeaderProps {
  reportTitle: string;
  subtitle?: string;
}

export const ReportHeader = ({ reportTitle, subtitle }: ReportHeaderProps) => {
  const { settings, loading } = useCompanySettings();

  if (loading || !settings) return null;

  const hasCompanyInfo = settings.company_name || settings.address || settings.phone || settings.email;
  if (!hasCompanyInfo) return null;

  return (
    <div className="mb-6 border-b border-border pb-4 print:mb-4">
      <div className="flex items-center gap-4">
        {settings.company_logo_url && (
          <img
            src={settings.company_logo_url}
            alt={settings.company_name || "Company Logo"}
            className="h-14 w-14 object-contain rounded-md"
          />
        )}
        <div className="flex-1">
          {settings.company_name && (
            <h2 className="text-lg font-bold text-foreground">{settings.company_name}</h2>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
            {settings.address && <span>{settings.address}</span>}
            {settings.phone && <span>📞 {settings.phone}</span>}
            {settings.email && <span>✉ {settings.email}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <h3 className="text-base font-semibold text-foreground">{reportTitle}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
};
