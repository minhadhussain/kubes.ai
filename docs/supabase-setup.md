# Supabase Setup Status

## Connected local environment

The local web app is configured with the provided public Supabase project values through `.env.local`.

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NEXT_PUBLIC_SUPABASE_URL=https://prhoyphnwdeghypdhaua.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is configured locally

## Current status

- Local Next.js development server can start successfully with the configured environment
- The project source already contains the initial production schema in `supabase/migrations/0001_initial_schema.sql`
- Supabase CLI is not installed on this machine, so migrations cannot be applied from the terminal yet

## What remains before full app verification

- Apply `supabase/migrations/0001_initial_schema.sql` to the target Supabase project
- Ensure Supabase Auth redirect settings include:
  - `http://localhost:3000`
  - `http://localhost:3000/auth/callback`

## Verification targets after schema application

- Sign up
- Login
- Organization onboarding
- Dashboard data load
- Protected route access
