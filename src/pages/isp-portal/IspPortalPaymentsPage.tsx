import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ispPortalApi } from '@/lib/isp-portal-api';

const IspPortalPaymentsPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('isp_customer_token');
    if (!token) { navigate('/isp-portal/login'); return; }
    ispPortalApi.getPayments().then((res) => {
      setPayments(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/isp-portal/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold">Payment History</span>
      </div>
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No payments found</p>
        ) : (
          payments.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">৳{Number(p.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.paid_at).toLocaleDateString()} • {p.method}
                  </p>
                </div>
                <Badge variant="default">Paid</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default IspPortalPaymentsPage;
