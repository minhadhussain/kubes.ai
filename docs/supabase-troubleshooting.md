# Supabase Troubleshooting

## Organization creation fails with "owner role" error

If onboarding shows an error about the owner role not being configured, the Supabase project does not yet have the seeded role catalog required by the app.

### Root cause

The application expects the initial schema in `supabase/migrations/0001_initial_schema.sql` to be applied to the target Supabase project. That migration creates the `roles` table and inserts the required records such as `owner`, `agent`, and `coordinator`.

### Required fix in Supabase

Run the full schema from:

- `supabase/migrations/0001_initial_schema.sql`

If the rest of the schema already exists and only the role seed is missing, the minimum SQL needed is:

```sql
insert into public.roles (key, name, description)
values
  ('owner', 'Owner', 'Workspace owner with full access'),
  ('broker_admin', 'Broker Admin', 'Brokerage administrator'),
  ('team_admin', 'Team Admin', 'Team manager with elevated access'),
  ('agent', 'Agent', 'Standard producing agent'),
  ('coordinator', 'Coordinator', 'Operations and transaction coordinator'),
  ('assistant', 'Assistant', 'Support user with limited access')
on conflict (key) do nothing;
```

### After applying the SQL

Retry onboarding:

1. Sign in
2. Open `/onboarding`
3. Create the organization again

Once the role seed exists, the current onboarding flow should create the organization, owner membership, and default organization successfully.
