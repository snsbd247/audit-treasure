# SmartERP - Migration Guide: Supabase → cPanel/MySQL

## Overview

This guide explains how to switch the frontend from Supabase to the PHP/MySQL backend.

## Quick Migration

### Option 1: Global Replace (Recommended)

1. Copy `deploy/src/api-client.ts` to `src/lib/api-client.ts`

2. In every file that imports from Supabase, change:
   ```typescript
   // FROM:
   import { supabase } from "@/integrations/supabase/client";
   
   // TO:
   import { api as supabase } from "@/lib/api-client";
   ```

3. The `api-client.ts` provides a Supabase-compatible interface, so most
   existing code like `supabase.from('table').select('*')` will work unchanged.

### Option 2: Environment-Based Switching

Create a wrapper that selects the backend based on environment:

```typescript
// src/lib/db.ts
const USE_SUPABASE = import.meta.env.VITE_BACKEND === 'supabase';

export const db = USE_SUPABASE 
  ? (await import('@/integrations/supabase/client')).supabase
  : (await import('@/lib/api-client')).api;
```

## Key Differences

| Feature | Supabase | PHP/MySQL Backend |
|---------|----------|-------------------|
| Auth | Supabase Auth | JWT + bcrypt |
| Real-time | Supported | Not supported |
| Storage | Supabase Storage | Local filesystem |
| RPC | Edge Functions | PHP endpoints |
| RLS | Database-level | Application-level |

## What Won't Work on cPanel

1. **Real-time subscriptions** - Need WebSocket server (not included)
2. **Supabase Edge Functions** - Replaced by PHP API endpoints
3. **RLS policies** - Handled by PHP auth middleware
4. **OAuth providers** - Need custom implementation

## Files to Deploy

```
erp/
├── index.html          (from dist/)
├── assets/             (from dist/)
├── .htaccess           (from deploy/)
├── erp_mysql.sql       (import then delete)
├── api/
│   ├── .htaccess
│   ├── index.php       (REST API)
│   ├── config.php      (DB config)
│   ├── db.php          (PDO connection)
│   ├── auth.php        (JWT auth)
│   ├── install.php     (delete after use)
│   └── uploads/
```
