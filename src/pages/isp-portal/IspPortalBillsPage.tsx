import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ispPortalApi } from '@/lib/isp-portal-api';

const IspPortalBillsPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('isp_customer_token');
    if (!token) { navigate('/isp-portal/login'); return; }
    ispPortalApi.getInvoices().then((res) => {
      setInvoices(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => {
    if (s === 'paid') return 'default' as const;
    if (s === 'overdue') return 'destructive' as const;
    return 'secondary' as const;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/isp-portal/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold">My Bills</span>
      </div>
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : invoices.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No invoices found</p>
        ) : (
          invoices.map((inv: any) => (
            <Card key={inv.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">৳{Number(inv.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Billed: {new Date(inv.billing_date).toLocaleDateString()} • Due: {new Date(inv.due_date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={statusColor(inv.status)}>{inv.status}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default IspPortalBillsPage;
