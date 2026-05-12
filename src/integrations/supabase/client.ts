// Supabase client — env-driven so the same build works against
// Lovable Cloud, Supabase Cloud, OR a self-hosted Supabase instance.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env (or .env.production).
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ezwsrtsqiumhxukwgiou.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d3NydHNxaXVtaHh1a3dnaW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzcxMzksImV4cCI6MjA4OTIxMzEzOX0.NFasz7XQPa3pmyTkzRRsozGXHWoHSldARGuyde6q-iE";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
