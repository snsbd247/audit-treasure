/**
 * SmartERP - API Client for PHP/MySQL Backend (cPanel deployment)
 * 
 * This file replaces Supabase client calls when deploying to cPanel.
 * To switch to this backend, update imports from:
 *   import { supabase } from "@/integrations/supabase/client"
 * To:
 *   import { api } from "@/lib/api-client"
 * 
 * NOTE: This file is for the cPanel/MySQL deployment only.
 * The Supabase client remains the primary backend for development.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('erp_token');
}

function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('erp_token', token);
  } else {
    localStorage.removeItem('erp_token');
  }
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      return { data: null, error: new Error(data.error || `HTTP ${res.status}`) };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================
// Auth API
// ============================================================
export const auth = {
  async signInWithPassword(credentials: { email: string; password: string }) {
    const { data, error } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data?.token) setToken(data.token);
    return { data, error };
  },

  async signUp(params: { email: string; password: string; options?: { data?: Record<string, string> } }) {
    const { data, error } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        name: params.options?.data?.name || '',
      }),
    });
    if (data?.token) setToken(data.token);
    return { data, error };
  },

  async signOut() {
    setToken(null);
  },

  async getSession() {
    const token = getToken();
    if (!token) return { data: { session: null } };
    const { data, error } = await request('/auth/me');
    if (error) return { data: { session: null } };
    return { data: { session: { user: data?.user, access_token: token } } };
  },

  async updateUser(params: { password?: string }) {
    if (params.password) {
      return request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ password: params.password }),
      });
    }
    return { data: null, error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Check initial state
    const token = getToken();
    if (token) {
      request('/auth/me').then(({ data }) => {
        if (data) {
          callback('SIGNED_IN', { user: data.user, access_token: token });
        }
      });
    } else {
      callback('SIGNED_OUT', null);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },
};

// ============================================================
// Database Query Builder (Supabase-compatible interface)
// ============================================================
class QueryBuilder<T = any> {
  private table: string;
  private filters: Record<string, string> = {};
  private selectFields: string = '*';
  private orderField: string = '';
  private limitCount: number | null = null;
  private singleMode: boolean = false;
  private method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET';
  private bodyData: any = null;
  private eqFilters: Array<{ column: string; value: string }> = [];

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    this.method = 'GET';
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]) {
    this.method = 'POST';
    this.bodyData = data;
    return this;
  }

  update(data: Partial<T>) {
    this.method = 'PUT';
    this.bodyData = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column: string, value: any) {
    this.eqFilters.push({ column, value: String(value) });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters[`${column}_like`] = pattern.replace(/%/g, '');
    return this;
  }

  in(column: string, values: any[]) {
    this.filters[`${column}_in`] = values.join(',');
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderField = `${column}.${opts?.ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = true;
    this.limitCount = 1;
    return this;
  }

  async then(resolve: (result: { data: any; error: any }) => void) {
    const result = await this.execute();
    resolve(result);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const params = new URLSearchParams();

    for (const f of this.eqFilters) {
      params.set(f.column, f.value);
    }

    if (this.orderField) params.set('order', this.orderField);
    if (this.limitCount) params.set('limit', String(this.limitCount));

    const queryString = params.toString();

    if (this.method === 'GET') {
      const path = `/${this.table}${queryString ? '?' + queryString : ''}`;
      const { data, error } = await request(path);
      if (error) return { data: null, error };
      if (this.singleMode) {
        return { data: Array.isArray(data) ? data[0] || null : data, error: null };
      }
      return { data, error: null };
    }

    if (this.method === 'POST') {
      if (Array.isArray(this.bodyData)) {
        // Batch insert
        const results = [];
        for (const item of this.bodyData) {
          const { data, error } = await request(`/${this.table}`, {
            method: 'POST',
            body: JSON.stringify(item),
          });
          if (error) return { data: null, error };
          results.push(data);
        }
        return { data: results, error: null };
      }
      return request(`/${this.table}`, {
        method: 'POST',
        body: JSON.stringify(this.bodyData),
      });
    }

    if (this.method === 'PUT') {
      const id = this.eqFilters.find(f => f.column === 'id')?.value;
      if (!id) return { data: null, error: new Error('ID required for update') };
      return request(`/${this.table}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(this.bodyData),
      });
    }

    if (this.method === 'DELETE') {
      const id = this.eqFilters.find(f => f.column === 'id')?.value;
      if (!id) return { data: null, error: new Error('ID required for delete') };
      return request(`/${this.table}/${id}`, { method: 'DELETE' });
    }

    return { data: null, error: new Error('Invalid operation') };
  }
}

// ============================================================
// Storage API
// ============================================================
const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);

        const token = getToken();
        const res = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) return { data: null, error: new Error(data.error) };
        return { data: { path: data.path }, error: null };
      },

      getPublicUrl(path: string) {
        return { data: { publicUrl: `${API_BASE}/uploads/${bucket}/${path}` } };
      },
    };
  },
};

// ============================================================
// Functions API (RPC calls)
// ============================================================
const functions = {
  async invoke(functionName: string, options: { body: any }) {
    return request(`/rpc/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(options.body),
    });
  },
};

// ============================================================
// Main API Client (Supabase-compatible interface)
// ============================================================
export const api = {
  auth,
  storage,
  functions,
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  },
};

export default api;
