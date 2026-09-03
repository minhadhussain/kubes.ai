# Supabase Compatibility Migration

This document captures the compatibility migration required to align the current live Supabase database with the schema expected by the application.

## Source of truth

The exact migration SQL is stored in:

- `supabase/migrations/0005_compat_realign_live_schema.sql`

That file is the canonical migration artifact and should be copied exactly into Supabase SQL Editor when applying the fix to the current project.

## What this migration fixes

- adds `public.roles.id`
- adds `public.roles.created_at`
- preserves and normalizes existing role rows
- creates `public.organizations`
- creates `public.user_profiles`
- creates `public.organization_members`
- creates all remaining missing application tables required by the current codebase
- creates required enum types
- creates required indexes
- creates required functions and triggers
- enables RLS and creates required policies
- creates AI tables and storage buckets required by the current app

## Apply in Supabase SQL Editor

1. Open the current Supabase project used by `.env.local`
2. Open SQL Editor
3. Open `supabase/migrations/0005_compat_realign_live_schema.sql` locally
4. Copy the entire file contents
5. Paste into SQL Editor
6. Run the SQL once

## Verification SQL

Run the following queries after the migration succeeds.

```sql
-- 1. roles.id exists
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'roles'
  and column_name in ('id', 'key', 'name', 'description', 'created_at')
order by column_name;

-- 2. core tables exist
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'roles',
    'organizations',
    'user_profiles',
    'organization_members',
    'contacts',
    'leads',
    'clients',
    'properties',
    'listings',
    'appointments',
    'showings',
    'tasks',
    'offers',
    'transactions',
    'documents',
    'commissions',
    'ai_runs',
    'ai_artifacts'
  )
order by table_name;

-- 3. required foreign keys exist
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.table_schema = 'public'
  and tc.constraint_type = 'FOREIGN KEY'
  and (
    (tc.table_name = 'organization_members' and kcu.column_name in ('organization_id', 'user_id', 'role_id'))
    or (tc.table_name = 'user_profiles' and kcu.column_name = 'default_organization_id')
    or (tc.table_name = 'transactions' and kcu.column_name in ('property_id', 'listing_id', 'offer_id'))
  )
order by tc.table_name, kcu.column_name;

-- 4. required RLS policies exist
select
  schemaname,
  tablename,
  policyname
from pg_policies
where schemaname = 'public'
  and (
    (tablename = 'roles' and policyname = 'roles readable by authenticated users')
    or (tablename = 'organizations' and policyname in (
      'organization members can view organizations',
      'authenticated users can create organizations they own',
      'organization admins can update organizations'
    ))
    or (tablename = 'user_profiles' and policyname in (
      'users can view own profile or colleagues',
      'users can update own profile',
      'users can insert own profile'
    ))
    or (tablename = 'organization_members' and policyname in (
      'members can view organization memberships',
      'owners and admins can manage organization memberships',
      'owners and admins can update memberships',
      'owners and admins can delete memberships'
    ))
  )
order by tablename, policyname;

-- 5. roles data preserved / present
select
  key,
  name,
  description,
  id is not null as has_id
from public.roles
where key in ('owner', 'broker_admin', 'team_admin', 'agent', 'coordinator', 'assistant')
order by key;
```

## Post-migration app checks

After the SQL is applied and verified:

1. refresh the app
2. sign up or log in
3. complete onboarding
4. verify organization creation succeeds
5. verify membership creation succeeds
6. verify profile default organization is set
7. verify `/dashboard` loads
