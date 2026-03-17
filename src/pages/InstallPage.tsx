import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Server, Database, UserPlus, Rocket, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";

const API_BASE = (import.meta.env.VITE_API_URL || window.location.origin) + "/api";

interface EnvCheck {
  label: string;
  ok: boolean;
  value: string;
}

type Step = "welcome" | "environment" | "database" | "admin" | "installing" | "complete";

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "welcome", label: "Welcome", icon: Rocket },
  { key: "environment", label: "Server Check", icon: Server },
  { key: "database", label: "Database", icon: Database },
  { key: "admin", label: "Admin Setup", icon: UserPlus },
  { key: "installing", label: "Installing", icon: Loader2 },
  { key: "complete", label: "Complete", icon: CheckCircle2 },
];

export default function InstallPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [envChecks, setEnvChecks] = useState<Record<string, EnvCheck>>({});
  const [envAllOk, setEnvAllOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbTested, setDbTested] = useState(false);
  const [dbVersion, setDbVersion] = useState("");
  const [installLog, setInstallLog] = useState<string[]>([]);
  const [installDone, setInstallDone] = useState(false);

  const [db, setDb] = useState({ db_host: "localhost", db_port: "3306", db_name: "", db_user: "", db_pass: "" });
  const [admin, setAdmin] = useState({ admin_name: "", admin_username: "admin", admin_email: "", admin_password: "", company_name: "" });

  // Check if already installed on mount
  useEffect(() => {
    fetch(`${API_BASE}/install/status`)
      .then((r) => r.json())
      .then((d) => { if (d?.data?.installed) navigate("/login", { replace: true }); })
      .catch(() => {});
  }, [navigate]);

  const currentIdx = STEPS.findIndex((s) => s.key === step);
  const progress = ((currentIdx + 1) / STEPS.length) * 100;

  const checkEnvironment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/install/check-environment`);
      const data = await res.json();
      if (data.success) {
        setEnvChecks(data.data.checks);
        setEnvAllOk(data.data.all_ok);
      } else if (res.status === 403) {
        toast.error("System is already installed");
        navigate("/login", { replace: true });
      } else {
        toast.error(data.message || "Environment check failed");
      }
    } catch {
      toast.error("Cannot connect to server API. Make sure the backend is running.");
    }
    setLoading(false);
  };

  const testDatabase = async () => {
    setLoading(true);
    setDbTested(false);
    setDbVersion("");
    try {
      const res = await fetch(`${API_BASE}/install/test-database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...db, db_port: parseInt(db.db_port) || 3306 }),
      });
      const data = await res.json();
      if (data.success) {
        setDbTested(true);
        setDbVersion(data.data.version || "");
        toast.success(`Connected! MySQL ${data.data.version}`);
      } else {
        toast.error(data.message || "Connection failed");
      }
    } catch {
      toast.error("Connection failed — check your database credentials");
    }
    setLoading(false);
  };

  const runInstall = async () => {
    setStep("installing");
    setInstallLog([]);
    setInstallDone(false);

    const addLog = (msg: string) => setInstallLog((prev) => [...prev, msg]);

    addLog("📦 Starting installation...");
    addLog("⚙️ Writing .env configuration...");

    try {
      const res = await fetch(`${API_BASE}/install/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...db,
          db_port: parseInt(db.db_port) || 3306,
          ...admin,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Show server-side steps
        if (data.data?.steps) {
          data.data.steps.forEach((s: string) => addLog(s));
        } else {
          addLog("✅ Database migrations completed");
          addLog("✅ Master data seeded (RBAC, Chart of Accounts)");
          addLog("✅ Super Admin account created");
          addLog("✅ Storage link created");
          addLog("✅ Production optimization done");
          addLog("✅ Installation completed successfully!");
        }
        setInstallDone(true);
        setTimeout(() => setStep("complete"), 1500);
      } else {
        if (data.data?.steps) {
          data.data.steps.forEach((s: string) => addLog(s));
        }
        addLog(`❌ Error: ${data.message}`);
        toast.error(data.message || "Installation failed");
      }
    } catch (err: any) {
      addLog(`❌ Network Error: ${err.message}`);
      toast.error("Installation failed. Check server logs.");
    }
  };

  const canProceedToInstall = admin.admin_name.trim() && admin.admin_username.trim() && admin.admin_password.length >= 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">SmartERP Installer</h1>
          <p className="text-muted-foreground mt-1">Single-Company ERP — One-Click Setup</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <div key={s.key} className={`flex flex-col items-center text-xs gap-1 ${isActive ? "text-primary font-semibold" : isDone ? "text-primary/60" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive && s.key === "installing" ? "animate-spin" : ""}`} />}
                  </div>
                  <span className="hidden sm:block">{s.label}</span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-lg border-border/50">
          {/* ─── Welcome ───────────────────────────────────── */}
          {step === "welcome" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Welcome to SmartERP</CardTitle>
                <CardDescription>This wizard will set up your ERP system automatically. No manual configuration needed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-medium text-foreground">What will be configured:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Server environment verification</li>
                    <li>MySQL database connection & tables</li>
                    <li>Master data seeding (Chart of Accounts, RBAC roles, Units)</li>
                    <li>Super Admin account creation</li>
                    <li>File storage & production optimization</li>
                  </ul>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
                  ⚠️ Make sure you have created an <strong>empty MySQL database</strong> before proceeding.
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => { setStep("environment"); checkEnvironment(); }}>
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ─── Environment Check ──────────────────────────── */}
          {step === "environment" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Server Requirements</CardTitle>
                <CardDescription>Checking PHP version, extensions, and file permissions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : Object.keys(envChecks).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Click "Check Server" to verify requirements.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(envChecks).map(([key, check]) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {check.ok ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-destructive" />}
                          <span className="text-sm font-medium">{check.label}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${check.ok ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>{check.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("welcome")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={checkEnvironment} disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Re-check
                    </Button>
                    <Button onClick={() => setStep("database")} disabled={!envAllOk}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* ─── Database Setup ─────────────────────────────── */}
          {step === "database" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Database Configuration</CardTitle>
                <CardDescription>Enter your MySQL database credentials. The database must already exist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Database Host</Label>
                    <Input value={db.db_host} onChange={(e) => { setDb({ ...db, db_host: e.target.value }); setDbTested(false); }} placeholder="localhost" />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input value={db.db_port} onChange={(e) => { setDb({ ...db, db_port: e.target.value }); setDbTested(false); }} placeholder="3306" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Database Name</Label>
                  <Input value={db.db_name} onChange={(e) => { setDb({ ...db, db_name: e.target.value }); setDbTested(false); }} placeholder="erp_database" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Database Username</Label>
                    <Input value={db.db_user} onChange={(e) => { setDb({ ...db, db_user: e.target.value }); setDbTested(false); }} placeholder="db_user" />
                  </div>
                  <div className="space-y-2">
                    <Label>Database Password</Label>
                    <Input type="password" value={db.db_pass} onChange={(e) => { setDb({ ...db, db_pass: e.target.value }); setDbTested(false); }} placeholder="••••••" />
                  </div>
                </div>
                {dbTested && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-500/10 p-3 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" /> Database connection verified — MySQL {dbVersion}
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("environment")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={testDatabase} disabled={loading || !db.db_name || !db.db_user}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />} Test Connection
                    </Button>
                    <Button onClick={() => setStep("admin")} disabled={!dbTested}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* ─── Admin Setup ────────────────────────────────── */}
          {step === "admin" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Admin & Company Setup</CardTitle>
                <CardDescription>Create the Super Admin account and set your company name.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={admin.company_name} onChange={(e) => setAdmin({ ...admin, company_name: e.target.value })} placeholder="My Company Ltd." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Admin Full Name *</Label>
                    <Input value={admin.admin_name} onChange={(e) => setAdmin({ ...admin, admin_name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Username *</Label>
                    <Input value={admin.admin_username} onChange={(e) => setAdmin({ ...admin, admin_username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} placeholder="admin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email (optional)</Label>
                  <Input type="email" value={admin.admin_email} onChange={(e) => setAdmin({ ...admin, admin_email: e.target.value })} placeholder="admin@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password * (min 6 characters)</Label>
                  <Input type="password" value={admin.admin_password} onChange={(e) => setAdmin({ ...admin, admin_password: e.target.value })} placeholder="••••••" />
                  {admin.admin_password && admin.admin_password.length < 6 && (
                    <p className="text-xs text-destructive">Password must be at least 6 characters</p>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <strong>Note:</strong> This user will have <code className="bg-muted px-1 rounded text-xs">employee_id = NULL</code> → <strong>Super Admin</strong> with full system access.
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("database")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                  <Button onClick={runInstall} disabled={!canProceedToInstall}>
                    <Rocket className="w-4 h-4 mr-2" /> Install Now
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ─── Installing ─────────────────────────────────── */}
          {step === "installing" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  {!installDone && <Loader2 className="w-5 h-5 animate-spin" />}
                  {installDone ? "✅ Done!" : "Installing..."}
                </CardTitle>
                <CardDescription>
                  {installDone ? "Installation completed. Redirecting..." : "Please wait while the system is being configured. This may take a minute."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-xs space-y-1.5 max-h-72 overflow-y-auto">
                  {installLog.map((log, i) => (
                    <div key={i} className={`${log.startsWith("❌") ? "text-destructive" : log.startsWith("✅") ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                      {log}
                    </div>
                  ))}
                  {!installDone && (
                    <div className="flex items-center gap-2 text-primary pt-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                    </div>
                  )}
                </div>
                {installLog.some(l => l.startsWith("❌")) && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" onClick={() => setStep("database")}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Database
                    </Button>
                    <Button variant="outline" onClick={runInstall}>Retry</Button>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* ─── Complete ───────────────────────────────────── */}
          {step === "complete" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <CardTitle className="text-xl">Installation Complete!</CardTitle>
                <CardDescription>Your SmartERP system is ready to use.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Username:</span><code className="font-semibold text-foreground">{admin.admin_username}</code></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Role:</span><code className="font-semibold text-foreground">Super Admin (Full Access)</code></div>
                  {admin.company_name && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Company:</span><code className="font-semibold text-foreground">{admin.company_name}</code></div>
                  )}
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400 space-y-1">
                  <p>⚠️ <strong>Security Recommendations:</strong></p>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    <li>Change the default password after first login</li>
                    <li>The installer is now locked and cannot be accessed again</li>
                    <li>Set up a cron job for scheduled tasks (see deployment guide)</li>
                  </ul>
                </div>
                <div className="flex justify-center">
                  <Button size="lg" onClick={() => navigate("/login")}>
                    Go to Login <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          SmartERP © {new Date().getFullYear()} — Single Company Edition
        </p>
      </div>
    </div>
  );
}
