import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Building2, DollarSign, Sliders, Upload, Loader2 } from "lucide-react";
import type { CompanySettings } from "@/hooks/useCompanySettings";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Branch { id: string; name: string; }
interface FinancialYear { id: string; name: string; is_active: boolean; }

const GeneralSettingsPage = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [sRes, bRes, yRes] = await Promise.all([
        supabase.from("company_settings" as any).select("*").eq("id", "default").single(),
        supabase.from("branches").select("id, name").eq("status", "active"),
        supabase.from("financial_years").select("id, name, is_active").order("start_date", { ascending: false }),
      ]);
      setSettings(sRes.data as any);
      setBranches((bRes.data || []) as Branch[]);
      setYears((yRes.data || []) as FinancialYear[]);
      setLoading(false);
    };
    init();
  }, []);

  const update = (field: keyof CompanySettings, value: string | null) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase
      .from("company_settings" as any)
      .update({ ...rest, updated_at: new Date().toISOString() } as any)
      .eq("id", "default");
    setSaving(false);
    if (error) {
      toast.error("Failed to save settings: " + error.message);
    } else {
      toast.success("Settings saved successfully");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    setUploading(true);

    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.id === "company-assets")) {
      // Bucket doesn't exist, we'll just store as data URL
      const reader = new FileReader();
      reader.onload = () => {
        update("company_logo_url", reader.result as string);
        setUploading(false);
        toast.success("Logo uploaded (will be saved with settings)");
      };
      reader.readAsDataURL(file);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `logo.${ext}`;
    const { error: upErr } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    if (upErr) {
      // Fallback to data URL
      const reader = new FileReader();
      reader.onload = () => {
        update("company_logo_url", reader.result as string);
        setUploading(false);
        toast.success("Logo uploaded");
      };
      reader.readAsDataURL(file);
      return;
    }
    const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
    update("company_logo_url", urlData.publicUrl);
    setUploading(false);
    toast.success("Logo uploaded");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) return <div className="p-6 text-destructive">Failed to load settings</div>;

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">General Settings</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company"><Building2 className="w-3.5 h-3.5 mr-1" />Company</TabsTrigger>
          <TabsTrigger value="currency"><DollarSign className="w-3.5 h-3.5 mr-1" />Currency</TabsTrigger>
          <TabsTrigger value="defaults"><Sliders className="w-3.5 h-3.5 mr-1" />Defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
              <CardDescription>This information appears on all reports and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.company_logo_url ? (
                    <img src={settings.company_logo_url} alt="Logo" className="h-16 w-16 object-contain rounded-md border border-border" />
                  ) : (
                    <div className="h-16 w-16 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <span>{uploading ? "Uploading..." : "Upload Logo"}</span>
                      </Button>
                    </label>
                    {settings.company_logo_url && (
                      <Button variant="ghost" size="sm" className="ml-2 text-destructive" onClick={() => update("company_logo_url", null)}>
                        Remove
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Max 2MB. JPG, PNG or SVG.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input value={settings.company_name} onChange={e => update("company_name", e.target.value)} placeholder="Your Company Name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={settings.email || ""} onChange={e => update("email", e.target.value)} placeholder="info@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={settings.phone || ""} onChange={e => update("phone", e.target.value)} placeholder="+1 234 567 890" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={settings.website || ""} onChange={e => update("website", e.target.value)} placeholder="https://company.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={settings.address || ""} onChange={e => update("address", e.target.value)} placeholder="Full company address" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Currency Setup</CardTitle>
              <CardDescription>Configure the system-wide currency for all transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency Name</Label>
                  <Input value={settings.currency_name} onChange={e => update("currency_name", e.target.value)} placeholder="US Dollar" />
                </div>
                <div className="space-y-2">
                  <Label>Currency Code</Label>
                  <Input value={settings.currency_code} onChange={e => update("currency_code", e.target.value.toUpperCase())} placeholder="USD" maxLength={5} />
                </div>
                <div className="space-y-2">
                  <Label>Currency Symbol</Label>
                  <Input value={settings.currency_symbol} onChange={e => update("currency_symbol", e.target.value)} placeholder="$" maxLength={5} />
                </div>
                <div className="space-y-2">
                  <Label>Symbol Position</Label>
                  <Select value={settings.currency_position} onValueChange={v => update("currency_position", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before amount ({settings.currency_symbol}100)</SelectItem>
                      <SelectItem value="after">After amount (100{settings.currency_symbol})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-md bg-muted/50 text-sm">
                <span className="text-muted-foreground">Preview: </span>
                <span className="font-medium text-foreground">
                  {settings.currency_position === "before"
                    ? `${settings.currency_symbol}1,250.00`
                    : `1,250.00${settings.currency_symbol}`
                  }
                </span>
                <span className="text-muted-foreground ml-2">({settings.currency_code})</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default System Settings</CardTitle>
              <CardDescription>Set default values used across the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Branch</Label>
                  <Select value={settings.default_branch_id || ""} onValueChange={v => update("default_branch_id", v || null)}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Financial Year</Label>
                  <Select value={settings.default_financial_year_id || ""} onValueChange={v => update("default_financial_year_id", v || null)}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name} {y.is_active ? "(Active)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneralSettingsPage;
