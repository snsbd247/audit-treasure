import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/contexts/BrandingContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Palette, Upload, Eye, Save, Building2, Globe, Type, Image as ImageIcon } from "lucide-react";

const BRANDING_FIELDS = [
  { key: "software_name", label: "Software Name", icon: Type, placeholder: "SmartERP" },
  { key: "software_version", label: "Software Version", icon: Globe, placeholder: "1.0" },
  { key: "footer_text", label: "Footer Text", icon: Type, placeholder: "© 2026 SmartERP. All Rights Reserved." },
  { key: "developer_name", label: "Developer Name", icon: Building2, placeholder: "Ismail Software Solutions" },
] as const;

export default function BrandingPage() {
  const { branding, refetch } = useBranding();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...branding });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setForm({ ...branding });
  }, [branding]);

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(form).map(([key, value]) => ({
        setting_key: key,
        setting_value: String(value),
      }));

      for (const entry of entries) {
        const { error } = await supabase
          .from("system_settings")
          .update({ setting_value: entry.setting_value, updated_at: new Date().toISOString() })
          .eq("setting_key", entry.setting_key);

        if (error) {
          // Try insert if update fails (no row matched)
          await supabase.from("system_settings").insert({
            setting_key: entry.setting_key,
            setting_value: entry.setting_value,
          });
        }
      }

      await refetch();
      toast({ title: "Branding Updated", description: "All branding settings have been saved successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(settingKey);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${settingKey}_${Date.now()}.${ext}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("branding")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      updateField(settingKey, publicUrl);

      toast({ title: "Logo Uploaded", description: `${settingKey.replace(/_/g, " ")} uploaded successfully.` });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const hslToHex = (hsl: string): string => {
    try {
      const parts = hsl.trim().split(/\s+/);
      if (parts.length < 3) return "#3b82f6";
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1]) / 100;
      const l = parseFloat(parts[2]) / 100;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    } catch {
      return "#3b82f6";
    }
  };

  const hexToHsl = (hex: string): string => {
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
          case g: h = ((b - r) / d + 2) * 60; break;
          case b: h = ((r - g) / d + 4) * 60; break;
        }
      }
      return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    } catch {
      return "221 83% 53%";
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Palette className="w-6 h-6 text-primary" />
            Branding & White-Label
          </h1>
          <p className="text-muted-foreground text-sm">Configure your ERP visual identity and branding</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="w-4 h-4 mr-2" />{previewMode ? "Close Preview" : "Preview"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4" /> Identity Settings</CardTitle>
            <CardDescription>Configure software name, version, and footer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BRANDING_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-medium">{field.label}</Label>
                <Input
                  value={(form as any)[field.key] || ""}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Theme Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Theme Colors</CardTitle>
            <CardDescription>Customize the ERP color scheme (HSL format)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Primary Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={hslToHex(form.primary_color)}
                  onChange={(e) => updateField("primary_color", hexToHsl(e.target.value))}
                  className="w-10 h-10 rounded border border-input cursor-pointer"
                />
                <Input
                  value={form.primary_color}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  placeholder="221 83% 53%"
                  className="flex-1"
                />
                <div className="w-8 h-8 rounded" style={{ background: `hsl(${form.primary_color})` }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Secondary Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={hslToHex(form.secondary_color)}
                  onChange={(e) => updateField("secondary_color", hexToHsl(e.target.value))}
                  className="w-10 h-10 rounded border border-input cursor-pointer"
                />
                <Input
                  value={form.secondary_color}
                  onChange={(e) => updateField("secondary_color", e.target.value)}
                  placeholder="220 14% 96%"
                  className="flex-1"
                />
                <div className="w-8 h-8 rounded" style={{ background: `hsl(${form.secondary_color})` }} />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">White-Label Mode</Label>
                <p className="text-xs text-muted-foreground">Hide developer branding and default ERP name</p>
              </div>
              <Switch
                checked={form.white_label_mode}
                onCheckedChange={(v) => updateField("white_label_mode", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Uploads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Logo Management</CardTitle>
            <CardDescription>Upload logos for different parts of the ERP system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: "company_logo_url", label: "Company Logo", desc: "Used in reports, invoices, sidebar" },
                { key: "login_logo_url", label: "Login Page Logo", desc: "Displayed on the login screen" },
                { key: "favicon_url", label: "Favicon", desc: "Browser tab icon" },
              ].map((logo) => (
                <div key={logo.key} className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">{logo.label}</Label>
                    <p className="text-xs text-muted-foreground">{logo.desc}</p>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center min-h-[120px] flex flex-col items-center justify-center gap-2">
                    {(form as any)[logo.key] ? (
                      <img
                        src={(form as any)[logo.key]}
                        alt={logo.label}
                        className="max-h-16 max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoUpload(e, logo.key)}
                        disabled={uploading === logo.key}
                      />
                      <Button variant="outline" size="sm" asChild disabled={uploading === logo.key}>
                        <span>
                          <Upload className="w-3 h-3 mr-1" />
                          {uploading === logo.key ? "Uploading..." : "Upload"}
                        </span>
                      </Button>
                    </label>
                  </div>
                  {(form as any)[logo.key] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive"
                      onClick={() => updateField(logo.key, "")}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Sidebar Preview */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Sidebar Header</Label>
                <div className="rounded-lg p-4 max-w-[240px]" style={{ background: `hsl(${form.primary_color} / 0.05)`, border: "1px solid hsl(var(--border))" }}>
                  <div className="flex items-center gap-2">
                    {form.company_logo_url ? (
                      <img src={form.company_logo_url} alt="Logo" className="w-8 h-8 object-contain rounded" />
                    ) : (
                      <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: `hsl(${form.primary_color})` }}>
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="font-bold text-sm text-foreground">{form.software_name || "SmartERP"}</span>
                  </div>
                </div>
              </div>

              {/* Login Preview */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Login Page Header</Label>
                <div className="rounded-lg p-6 text-center max-w-xs" style={{ background: `hsl(${form.primary_color})` }}>
                  {form.login_logo_url ? (
                    <img src={form.login_logo_url} alt="Login Logo" className="h-12 mx-auto mb-2" />
                  ) : (
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-white/80" />
                  )}
                  <h3 className="text-white font-bold text-lg">{form.software_name || "SmartERP"}</h3>
                  <p className="text-white/70 text-xs">v{form.software_version || "1.0"}</p>
                </div>
              </div>

              {/* Footer Preview */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Footer</Label>
                <div className="rounded-lg p-3 bg-muted text-center text-xs text-muted-foreground">
                  {form.footer_text || "© 2026 SmartERP. All Rights Reserved."}
                  {!form.white_label_mode && form.developer_name && (
                    <span> | Developed by {form.developer_name}</span>
                  )}
                  {form.software_version && <span> | Version {form.software_version}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
