do $$
begin
  if not exists (select 1 from pg_type where typname = 'ai_run_status') then
    create type ai_run_status as enum ('processing', 'completed', 'needs_review', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_artifact_type') then
    create type ai_artifact_type as enum ('lead_qualification', 'next_actions', 'activity_summary', 'follow_up_draft');
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_approval_status') then
    create type ai_approval_status as enum ('pending_review', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_action_status') then
    create type ai_action_status as enum ('draft', 'saved', 'approved', 'failed');
  end if;
end $$;

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  feature_key text not null,
  entity_type text not null,
  entity_id uuid,
  provider text,
  model text,
  prompt_version text,
  source_context jsonb not null default '{}'::jsonb,
  status ai_run_status not null default 'processing',
  error_message text,
  retry_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table if not exists public.ai_artifacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_id uuid not null references public.ai_runs(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  artifact_type ai_artifact_type not null,
  entity_type text not null,
  entity_id uuid,
  title text,
  summary text,
  content jsonb not null default '{}'::jsonb,
  confidence numeric(5,2),
  source_context jsonb not null default '{}'::jsonb,
  approval_status ai_approval_status not null default 'pending_review',
  action_status ai_action_status not null default 'draft',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ai_runs_org_entity on public.ai_runs (organization_id, entity_type, entity_id, created_at desc);
create index if not exists idx_ai_artifacts_org_entity on public.ai_artifacts (organization_id, entity_type, entity_id, created_at desc);
create index if not exists idx_ai_artifacts_type on public.ai_artifacts (organization_id, artifact_type, created_at desc);

alter table public.ai_runs enable row level security;
alter table public.ai_artifacts enable row level security;

create policy "members can manage ai runs in their organization"
on public.ai_runs for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage ai artifacts in their organization"
on public.ai_artifacts for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop trigger if exists trg_ai_artifacts_updated_at on public.ai_artifacts;
create trigger trg_ai_artifacts_updated_at before update on public.ai_artifacts
for each row execute procedure public.set_updated_at();
