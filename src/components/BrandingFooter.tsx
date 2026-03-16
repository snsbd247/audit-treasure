import { useBranding } from "@/contexts/BrandingContext";

export const BrandingFooter = () => {
  const { branding } = useBranding();

  return (
    <footer className="py-2 px-4 text-center text-xs text-muted-foreground border-t border-border bg-card/50 shrink-0">
      <span>{branding.footer_text}</span>
      {!branding.white_label_mode && branding.developer_name && (
        <span> | Developed by {branding.developer_name}</span>
      )}
      {branding.software_version && (
        <span> | v{branding.software_version}</span>
      )}
    </footer>
  );
};
