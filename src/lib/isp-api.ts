/**
 * ISP Module API Service
 * Isolated API client for all ISP endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('erp_token');
}

async function ispRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; meta?: any }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(`${API_BASE}/isp${path}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      return { data: null, error: json.message || 'Request failed' };
    }
    return { data: json.data, error: null, meta: json.meta };
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' };
  }
}

// ─── Packages ──────────────────────────────────
export const ispPackages = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return ispRequest(`/packages${qs}`);
  },
  get: (id: string) => ispRequest(`/packages/${id}`),
  create: (data: any) => ispRequest('/packages', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => ispRequest(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => ispRequest(`/packages/${id}`, { method: 'DELETE' }),
};

// ─── Customers ──────────────────────────────────
export const ispCustomers = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return ispRequest(`/customers${qs}`);
  },
  get: (id: string) => ispRequest(`/customers/${id}`),
  create: (data: any) => ispRequest('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => ispRequest(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => ispRequest(`/customers/${id}`, { method: 'DELETE' }),
  suspend: (id: string) => ispRequest(`/customers/${id}/suspend`, { method: 'POST' }),
  activate: (id: string) => ispRequest(`/customers/${id}/activate`, { method: 'POST' }),
  syncPPPoE: (id: string) => ispRequest(`/customers/${id}/sync-pppoe`, { method: 'POST' }),
  disconnect: (id: string) => ispRequest(`/customers/${id}/disconnect`, { method: 'POST' }),
  usage: (id: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return ispRequest(`/customers/${id}/usage${qs}`);
  },
  usageDaily: (id: string, days?: string) => {
    const qs = days ? `?days=${days}` : '';
    return ispRequest(`/customers/${id}/usage/daily${qs}`);
  },
};

// ─── Invoices ──────────────────────────────────
export const ispInvoices = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return ispRequest(`/invoices${qs}`);
  },
  get: (id: string) => ispRequest(`/invoices/${id}`),
  create: (data: any) => ispRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => ispRequest(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => ispRequest(`/invoices/${id}`, { method: 'DELETE' }),
};

// ─── Payments ──────────────────────────────────
export const ispPayments = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return ispRequest(`/payments${qs}`);
  },
  get: (id: string) => ispRequest(`/payments/${id}`),
  create: (data: any) => ispRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => ispRequest(`/payments/${id}`, { method: 'DELETE' }),
};

// ─── Routers ──────────────────────────────────
export const ispRouters = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return ispRequest(`/routers${qs}`);
  },
  get: (id: string) => ispRequest(`/routers/${id}`),
  create: (data: any) => ispRequest('/routers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => ispRequest(`/routers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => ispRequest(`/routers/${id}`, { method: 'DELETE' }),
  test: (data: any) => ispRequest('/routers/test', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Billing ──────────────────────────────────
export const ispBilling = {
  generate: (month?: string) => ispRequest('/generate-bills', { method: 'POST', body: JSON.stringify({ month }) }),
};

// ─── bKash ──────────────────────────────────
export const ispBkash = {
  createPayment: (invoiceId: string) => ispRequest('/bkash/create', { method: 'POST', body: JSON.stringify({ invoice_id: invoiceId }) }),
  queryPayment: (paymentId: string) => ispRequest('/bkash/query', { method: 'POST', body: JSON.stringify({ payment_id: paymentId }) }),
};
