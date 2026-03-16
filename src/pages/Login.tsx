import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getEmailByUsername } from "@/lib/db-utils";
import { useBranding } from "@/contexts/BrandingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Building2, Eye, EyeOff, Mail } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const { signIn } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const email = await getEmailByUsername(username);
      if (!email) {
        throw new Error("Username not found.");
      }

      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email Sent", description: "Check your email for a password reset link." });
      setForgotMode(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 text-center space-y-6 max-w-md">
          {branding.login_logo_url ? (
            <img src={branding.login_logo_url} alt="Logo" className="h-16 mx-auto" />
          ) : branding.company_logo_url ? (
            <img src={branding.company_logo_url} alt="Logo" className="h-16 mx-auto" />
          ) : (
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-primary-foreground">{branding.software_name || "ERP System"}</h1>
          <p className="text-primary-foreground/80 text-sm leading-relaxed">
            Complete enterprise resource planning for manufacturing companies.
            Manage accounting, inventory, sales, purchases, and production — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs text-primary-foreground/70">
            {["Multi-Branch Accounting", "Inventory Management", "Manufacturing", "Financial Reports",
              "Role-Based Access", "Voucher Workflow", "Stock Ledger", "Audit Logs"].map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary-foreground/50" />
                {f}
              </div>
            ))}
          </div>
          {!branding.white_label_mode && branding.developer_name && (
            <p className="text-primary-foreground/50 text-xs mt-4">Developed by {branding.developer_name}</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-elevated border-border/50">
          <CardHeader className="text-center pb-2">
            {branding.company_logo_url ? (
              <img src={branding.company_logo_url} alt="Logo" className="h-10 mx-auto mb-3 lg:hidden object-contain" />
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 lg:hidden">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
            <CardTitle className="text-xl font-bold text-foreground">
              {forgotMode ? "Forgot Password" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-sm">
              {forgotMode ? "Enter your email to receive a reset link" : `Sign in to ${branding.software_name || "ERP System"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgotEmail" className="text-xs font-medium">Email Address</Label>
                  <Input id="forgotEmail" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="user@company.com" required className="h-10" />
                </div>
                <Button type="submit" className="w-full h-10" disabled={submitting}>
                  {submitting ? "Sending..." : <><Mail className="w-4 h-4 mr-2" />Send Reset Link</>}
                </Button>
                <div className="text-center">
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setForgotMode(false)}>
                    Back to login
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-medium">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10" disabled={submitting}>
                    {submitting ? "Please wait..." : <><LogIn className="w-4 h-4 mr-2" />Sign In</>}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setForgotMode(true)}>
                    Forgot password?
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          {branding.footer_text}
          {!branding.white_label_mode && branding.developer_name && ` | Developed by ${branding.developer_name}`}
        </p>
      </div>
    </div>
  );
};

export default Login;
