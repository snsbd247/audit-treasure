import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Building2, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: profile, error: lookupError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", username)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!profile || !profile.email) {
        throw new Error("Username not found.");
      }

      const { error } = await signIn(profile.email, password);
      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground">ERP System</h1>
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
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-elevated border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 lg:hidden">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-sm">Sign in with your username and password</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
