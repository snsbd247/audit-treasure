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
      const msg = err.message || "";
      let friendly: string;
      if (msg.includes("banned") || msg.includes("disabled")) {
        friendly = "Your account has been disabled. Please contact the administrator.";
      } else if (msg.includes("Invalid login") || msg.includes("non-2xx") || msg.includes("Invalid Refresh Token")) {
        friendly = "Invalid username or password. Please try again.";
      } else if (msg.includes("not found")) {
        friendly = "Username not found. Please check and try again.";
      } else {
        friendly = msg;
      }
      toast({ title: "Login Failed", description: friendly, variant: "destructive" });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl">
        <CardHeader className="text-center pb-2 pt-8">
          {branding.login_logo_url ? (
            <img src={branding.login_logo_url} alt="Logo" className="h-16 mx-auto mb-3 object-contain" />
          ) : branding.company_logo_url ? (
            <img src={branding.company_logo_url} alt="Logo" className="h-16 mx-auto mb-3 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-foreground">
            {forgotMode ? "Forgot Password" : (branding.software_name || "SmartERP")}
          </CardTitle>
          <CardDescription className="text-sm">
            {forgotMode ? "Enter your email to receive a reset link" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
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
              <div className="mt-4 flex items-center justify-between">
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => setForgotMode(true)}>
                  Forgot password?
                </button>
                <a href="/employee/verify" className="text-xs text-primary hover:underline">
                  Verify Employee
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
