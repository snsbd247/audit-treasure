import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Database, Shield, Settings, Rocket, Server } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface EnvCheck {
  label: string;
  ok: boolean;
  value: string;
}

type Step = "welcome" | "environment" | "database" | "admin" | "installing" | "complete";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "welcome", label: "Welcome", icon: <Rocket className="h-4 w-4" /> },
  { key: "environment", label: "Server Check", icon: <Server className="h-4 w-4" /> },
  { key: "database", label: "Database", icon: <Database className="h-4 w-4" /> },
  { key: "admin", label: "Admin Setup", icon: <Shield className="h-4 w-4" /> },
  { key: "complete", label: "Complete", icon: <Settings className="h-4 w-4" /> },
];

export default function InstallPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Environment checks
  const [envChecks, setEnvChecks] = useState<Record<string, EnvCheck>>({});
  const [envPassed, setEnvPassed] = useState(false);

  // Database form
  const [dbHost, setDbHost] = useState("localhost");
  const [dbName, setDbName] = useState("");
  const [dbUser, setDbUser] = useState("");
  const [dbPass, setDbPass] = useState("");
  const [dbTested, setDbTested] = useState(false);

  // Admin form
  const [adminName, setAdminName] = useState("Super Admin");
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [companyName, setCompanyName] = useState("My Company");

  // Install progress
  const [installProgress, setInstallProgress] = useState(0);
  const [installLog, setInstallLog] = useState<string[]>([]);

  // Check if already installed
  useEffect(() => {
    fetch(`${API_BASE}/install/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.installed) navigate("/login", { replace: true });
      })
      .catch(() => {});
  }, [navigate]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const progressPercent = step === "installing" ? installProgress : ((stepIndex) / (STEPS.length - 1)) * 100;

  // ─── Environment Check ──────────────────────────────────
  const runEnvCheck = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/install/check-environment`);
      const data = await res.json();
      setEnvChecks(data.checks);
      setEnvPassed(data.all_passed);
    } catch {
      setError("Cannot connect to server API. Make sure Laravel backend is running.");
    }
    setLoading(false);
  };

  // ─── Database Test ──────────────────────────────────────
  const testDatabase = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/install/test-database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db_host: dbHost, db_name: dbName, db_user: dbUser, db_pass: dbPass }),
      });
      const data = await res.json();
      if (data.success) {
        setDbTested(true);
        setError("");
      } else {
        setError(data.message || "Database connection failed.");
      }
    } catch {
      setError("Server error while testing database.");
    }
    setLoading(false);
  };

  // ─── Run Installation ───────────────────────────────────
  const runInstall = async () => {
    setStep("installing");
    setInstallProgress(10);
    setInstallLog(["Starting installation..."]);
    setError("");

    const addLog = (msg: string) => setInstallLog((prev) => [...prev, msg]);

    try {
      setInstallProgress(20);
      addLog("Writing .env configuration...");

      setInstallProgress(30);
      addLog("Creating database...");

      setInstallProgress(50);
      addLog("Running migrations...");

      setInstallProgress(60);
      addLog("Seeding roles, accounts & master data...");

      setInstallProgress(70);
      addLog("Creating Super Admin user...");

      const res = await fetch(`${API_BASE}/install/run-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          db_host: dbHost,
          db_name: dbName,
          db_user: dbUser,
          db_pass: dbPass,
          admin_name: adminName,
          admin_username: adminUsername,
          admin_password: adminPassword,
          company_name: companyName,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setInstallProgress(90);
        addLog("Creating storage link...");
        setInstallProgress(100);
        addLog("✅ Installation completed successfully!");
        setStep("complete");
      } else {
        setError(data.message || "Installation failed.");
        setStep("admin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError("Installation failed: " + msg);
      setStep("admin");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">SmartERP Installer</h1>
          <p className="text-muted-foreground mt-1">Single-Company ERP Setup Wizard</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-2 px-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors ${
                  i < stepIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === stepIndex
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {i < stepIndex ? <CheckCircle2 className="h-5 w-5" /> : s.icon}
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">{s.label}</span>
            </div>
          ))}
        </div>
        <Progress value={progressPercent} className="mb-6 h-2" />

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── Welcome ──────────────────────────────── */}
          {step === "welcome" && (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Welcome to SmartERP</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                This wizard will guide you through the installation process.<br />
                You'll need your MySQL database credentials and a name for the admin account.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-left text-sm space-y-1">
                <p className="font-medium text-foreground">Requirements:</p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>PHP 8.1+ with PDO, OpenSSL, Mbstring</li>
                  <li>MySQL 5.7+ or MariaDB 10.3+</li>
                  <li>Writable storage directory</li>
                </ul>
              </div>
              <Button className="w-full" size="lg" onClick={() => { setStep("environment"); runEnvCheck(); }}>
                Start Installation
              </Button>
            </div>
          )}

          {/* ─── Environment Check ────────────────────── */}
          {step === "environment" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Server Environment</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Checking requirements...
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                    {Object.entries(envChecks).map(([key, check]) => (
                      <div key={key} className="flex items-center justify-between px-4 py-3 bg-background">
                        <div className="flex items-center gap-2">
                          {check.ok ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span className="text-sm text-foreground">{check.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{check.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep("welcome")}>Back</Button>
                    <Button className="flex-1" disabled={!envPassed} onClick={() => setStep("database")}>
                      {envPassed ? "Continue" : "Fix Issues & Retry"}
                    </Button>
                    {!envPassed && (
                      <Button variant="secondary" onClick={runEnvCheck}>
                        <Loader2 className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Re-check
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── Database Setup ───────────────────────── */}
          {step === "database" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Database Configuration</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">MySQL Host</label>
                  <Input value={dbHost} onChange={(e) => { setDbHost(e.target.value); setDbTested(false); }} placeholder="localhost" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Database Name</label>
                  <Input value={dbName} onChange={(e) => { setDbName(e.target.value); setDbTested(false); }} placeholder="erp_database" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Database Username</label>
                  <Input value={dbUser} onChange={(e) => { setDbUser(e.target.value); setDbTested(false); }} placeholder="root" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Database Password</label>
                  <Input type="password" value={dbPass} onChange={(e) => { setDbPass(e.target.value); setDbTested(false); }} placeholder="••••••" />
                </div>
              </div>
              {dbTested && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Connection successful!
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("environment")}>Back</Button>
                {!dbTested ? (
                  <Button className="flex-1" onClick={testDatabase} disabled={loading || !dbName || !dbUser}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                    Test Connection
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={() => setStep("admin")}>
                    Continue
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ─── Admin Setup ──────────────────────────── */}
          {step === "admin" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Administrator Account</h2>
              <p className="text-sm text-muted-foreground">This creates the Super Admin user with full system access.</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Company Name</label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="My Company" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Admin Full Name</label>
                  <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Super Admin" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Admin Username</label>
                  <Input value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="admin" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Admin Password</label>
                  <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Min 6 characters" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("database")}>Back</Button>
                <Button
                  className="flex-1"
                  onClick={runInstall}
                  disabled={!adminUsername || !adminPassword || adminPassword.length < 6}
                >
                  <Rocket className="h-4 w-4 mr-2" /> Install SmartERP
                </Button>
              </div>
            </div>
          )}

          {/* ─── Installing ───────────────────────────── */}
          {step === "installing" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Installing...</h2>
              <Progress value={installProgress} className="h-3" />
              <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
                {installLog.map((log, i) => (
                  <p key={i} className="text-muted-foreground">{log}</p>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Please wait, do not close this page...
              </div>
            </div>
          )}

          {/* ─── Complete ─────────────────────────────── */}
          {step === "complete" && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Installation Complete!</h2>
              <p className="text-muted-foreground text-sm">SmartERP has been installed successfully.</p>
              <div className="bg-muted/50 rounded-lg p-4 text-left text-sm space-y-2">
                <p><span className="font-medium text-foreground">Company:</span> <span className="text-muted-foreground">{companyName}</span></p>
                <p><span className="font-medium text-foreground">Username:</span> <span className="text-muted-foreground">{adminUsername}</span></p>
                <p><span className="font-medium text-foreground">Database:</span> <span className="text-muted-foreground">{dbName}</span></p>
              </div>
              <div className="bg-warning/10 rounded-lg p-3 text-warning text-sm">
                <strong>⚠️ Security:</strong> Delete the <code className="font-mono">install.php</code> file from your server if present.
              </div>
              <Button className="w-full" size="lg" onClick={() => navigate("/login")}>
                Open SmartERP →
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">SmartERP — Single Company Edition</p>
      </div>
    </div>
  );
}
