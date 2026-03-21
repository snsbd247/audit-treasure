import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, FileText, CreditCard, User, LogOut } from 'lucide-react';
import { ispPortalApi } from '@/lib/isp-portal-api';
import { toast } from 'sonner';

const IspPortalDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('isp_customer_token');
    if (!token) { navigate('/isp-portal/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, invoicesRes] = await Promise.all([
        ispPortalApi.getProfile(),
        ispPortalApi.getInvoices(),
      ]);
      setProfile(profileRes.data);
      setInvoices(invoicesRes.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('isp_customer_token');
    localStorage.removeItem('isp_customer_data');
    navigate('/isp-portal/login');
  };

  const statusColor = (s: string) => {
    if (s === 'active' || s === 'paid') return 'default';
    if (s === 'suspended' || s === 'overdue') return 'destructive';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const unpaidCount = invoices.filter((i) => i.status !== 'paid').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-primary" />
          <span className="font-semibold">Customer Portal</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">My Connection</CardTitle>
            <Badge variant={statusColor(profile?.status || '')}>
              {profile?.status?.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">PPPoE Username</p>
              <p className="font-medium">{profile?.pppoe_username}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Package</p>
              <p className="font-medium">{profile?.package?.name || 'N/A'} — {profile?.package?.speed || ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Monthly Fee</p>
              <p className="font-medium">৳{Number(profile?.package?.price || 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/isp-portal/bills">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unpaidCount}</p>
                  <p className="text-xs text-muted-foreground">Unpaid Bills</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/isp-portal/payments">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                  <p className="text-xs text-muted-foreground">Total Invoices</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No invoices found</p>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">৳{Number(inv.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(inv.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={statusColor(inv.status)}>{inv.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IspPortalDashboard;
