# SmartERP — VPS One-Command Installer

Self-hosted deployment with **self-hosted Supabase + Laravel + React**.
No dependency on Lovable or Supabase Cloud.

## Quick start

On a fresh **Ubuntu 22.04 / 24.04** VPS as `root`:

```bash
curl -fsSL https://raw.githubusercontent.com/snsbd247/audit-treasure/main/deploy/vps/install.sh -o install.sh
chmod +x install.sh
DOMAIN=smarterp365.com ADMIN_EMAIL=you@smarterp365.com ./install.sh
```

## Required DNS (A records → your VPS IP)

| Host | Purpose |
|---|---|
| `smarterp365.com` | Main app |
| `www.smarterp365.com` | Redirect / app |
| `supabase.smarterp365.com` | Supabase API gateway (Kong) |
| `studio.smarterp365.com` | Supabase Studio (admin) |

## What it installs

- Docker + self-hosted Supabase stack (Postgres, GoTrue, PostgREST, Realtime, Storage, Studio, Kong)
- Node 20, PHP 8.2-fpm, MySQL 8, Nginx, Certbot (Let's Encrypt SSL)
- Clones the repo, builds the React frontend, configures Laravel API
- Creates the MySQL DB and writes all `.env` files
- Generates JWT secret + ANON / SERVICE_ROLE keys for Supabase
- Saves all credentials to `/root/smarterp-credentials.txt`

## Files

- `install.sh` — the installer (one command)
- `../../docs/VPS_Setup_Guide_BN.pdf` — Bangla setup guide (with screenshots-style steps)
