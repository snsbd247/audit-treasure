import { useBranding } from "@/contexts/BrandingContext";

export const BrandingFooter = () => {
  const { branding } = useBranding();

  return (
    <footer className="py-1.5 sm:py-2 px-3 sm:px-4 text-center text-[10px] sm:text-xs text-muted-foreground border-t border-border bg-card/50 shrink-0">
      <span>{branding.footer_text}</span>
      {!branding.white_label_mode && branding.developer_name && (
        <span className="hidden sm:inline"> | Developed by {branding.developer_name}</span>
      )}
      {branding.software_version && (
        <span> | v{branding.software_version}</span>
      )}
    </footer>
  );
};
