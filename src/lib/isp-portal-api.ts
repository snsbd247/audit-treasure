import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function portalRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('isp_customer_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}/isp/customer-portal${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('isp_customer_token');
      window.location.href = '/isp-portal/login';
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const ispPortalApi = {
  login: (username: string, password: string) =>
    portalRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getProfile: () => portalRequest('/profile'),
  getInvoices: (page = 1) => portalRequest(`/invoices?page=${page}`),
  getPayments: (page = 1) => portalRequest(`/payments?page=${page}`),
};
