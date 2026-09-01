create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_type') then
    create type workspace_type as enum ('solo', 'team', 'brokerage');
  end if;

  if not exists (select 1 from pg_type where typname = 'membership_status') then
    create type membership_status as enum ('invited', 'active', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_kind') then
    create type contact_kind as enum (
      'lead',
      'buyer',
      'seller',
      'tenant',
      'landlord',
      'investor',
      'past_client',
      'referral',
      'vendor',
      'professional',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_stage') then
    create type lead_stage as enum ('new', 'contacted', 'qualified', 'active', 'offer', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_disposition') then
    create type lead_disposition as enum ('open', 'nurture', 'cold', 'lost', 'converted');
  end if;

  if not exists (select 1 from pg_type where typname = 'client_kind') then
    create type client_kind as enum ('buyer', 'seller', 'tenant', 'landlord', 'investor', 'past_client');
  end if;

  if not exists (select 1 from pg_type where typname = 'property_kind') then
    create type property_kind as enum ('house', 'condo', 'townhouse', 'land', 'multi_family', 'commercial', 'rental', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_type') then
    create type listing_type as enum ('sale', 'rent');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type listing_status as enum ('draft', 'coming_soon', 'active', 'under_contract', 'pending', 'sold', 'expired', 'withdrawn', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_type') then
    create type appointment_type as enum ('meeting', 'call', 'showing', 'open_house', 'inspection', 'appraisal', 'deadline', 'closing', 'follow_up', 'task');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'rescheduled');
  end if;

  if not exists (select 1 from pg_type where typname = 'showing_status') then
    create type showing_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type task_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;

  if not exists (select 1 from pg_type where typname = 'offer_status') then
    create type offer_status as enum ('draft', 'sent', 'viewed', 'countered', 'accepted', 'rejected', 'expired');
  end if;

  if not exists (select 1 from pg_type where typname = 'transaction_stage') then
    create type transaction_stage as enum ('offer_accepted', 'under_contract', 'inspection', 'appraisal', 'financing', 'finalization', 'closing', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_category') then
    create type document_category as enum ('general', 'listing', 'offer', 'transaction', 'identification', 'financial', 'receipt', 'photo', 'video');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type document_status as enum ('active', 'archived', 'deleted');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type notification_type as enum ('lead', 'follow_up', 'task', 'showing', 'offer', 'document', 'transaction_deadline', 'commission', 'assignment');
  end if;

  if not exists (select 1 from pg_type where typname = 'expense_category') then
    create type expense_category as enum ('travel', 'fuel', 'advertising', 'photography', 'marketing', 'software', 'meals', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'commission_status') then
    create type commission_status as enum ('expected', 'approved', 'paid');
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type activity_type as enum ('lead', 'call', 'email', 'message', 'note', 'appointment', 'showing', 'property', 'offer', 'transaction', 'document', 'task', 'status_change', 'assignment', 'financial');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.roles (key, name, description)
values
  ('owner', 'Owner', 'Workspace owner with full access'),
  ('broker_admin', 'Broker Admin', 'Brokerage administrator'),
  ('team_admin', 'Team Admin', 'Team manager with elevated access'),
  ('agent', 'Agent', 'Standard producing agent'),
  ('coordinator', 'Coordinator', 'Operations and transaction coordinator'),
  ('assistant', 'Assistant', 'Support user with limited access')
on conflict (key) do nothing;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  workspace_type workspace_type not null default 'solo',
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  full_name text,
  phone text,
  avatar_url text,
  default_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  status membership_status not null default 'active',
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  first_name text,
  last_name text,
  display_name text not null,
  phone text,
  email citext,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text,
  contact_types contact_kind[] not null default array['lead']::contact_kind[],
  lead_source text,
  preferences jsonb not null default '{}'::jsonb,
  budget numeric(14,2),
  location_requirements text,
  timeline text,
  financing_information jsonb not null default '{}'::jsonb,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  stage lead_stage not null default 'new',
  disposition lead_disposition not null default 'open',
  score integer not null default 0 check (score between 0 and 100),
  source text,
  requirements jsonb not null default '{}'::jsonb,
  notes text,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  converted_client_id uuid,
  lost_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (contact_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  client_types client_kind[] not null,
  budget_min numeric(14,2),
  budget_max numeric(14,2),
  preferred_locations text[] not null default '{}',
  property_preferences jsonb not null default '{}'::jsonb,
  financing_status text,
  timeline text,
  stage text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text,
  postal_code text,
  country text not null default 'US',
  latitude numeric(10,7),
  longitude numeric(10,7),
  property_type property_kind not null,
  bedrooms numeric(4,1),
  bathrooms numeric(4,1),
  area_sqft integer,
  lot_size_sqft integer,
  year_built integer,
  parking_spaces integer,
  price numeric(14,2),
  amenities text[] not null default '{}',
  description text,
  lifecycle_status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  seller_contact_id uuid references public.contacts(id) on delete set null,
  assigned_user_id uuid references auth.users(id) on delete set null,
  listing_type listing_type not null default 'sale',
  status listing_status not null default 'draft',
  list_price numeric(14,2),
  description text,
  showing_instructions text,
  open_house_schedule jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  expires_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  transaction_id uuid,
  title text not null,
  description text,
  appointment_type appointment_type not null,
  status appointment_status not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  all_day boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.showing_tours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  agent_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  transaction_id uuid,
  title text not null,
  description text,
  priority task_priority not null default 'medium',
  due_at timestamptz,
  completed_at timestamptz,
  status task_status not null default 'pending',
  notes text,
  automation_source text,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.showings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tour_id uuid references public.showing_tours(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  agent_user_id uuid references auth.users(id) on delete set null,
  status showing_status not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  feedback_rating integer check (feedback_rating between 1 and 5),
  client_reaction text,
  feedback text,
  notes text,
  follow_up_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  contact_id uuid references public.contacts(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  transaction_id uuid,
  activity_type activity_type not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  buyer_client_id uuid references public.clients(id) on delete set null,
  seller_contact_id uuid references public.contacts(id) on delete set null,
  buyer_agent_user_id uuid references auth.users(id) on delete set null,
  seller_agent_user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  status offer_status not null default 'draft',
  offer_price numeric(14,2) not null,
  terms text,
  financing_type text,
  financing_amount numeric(14,2),
  closing_date date,
  contingencies jsonb not null default '[]'::jsonb,
  expiration_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  offer_id uuid unique references public.offers(id) on delete set null,
  buyer_client_id uuid references public.clients(id) on delete set null,
  seller_contact_id uuid references public.contacts(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  stage transaction_stage not null default 'offer_accepted',
  contract_date date,
  closing_date date,
  sale_price numeric(14,2),
  financing_status text,
  risk_level text not null default 'normal',
  summary text,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.appointments
  add constraint appointments_transaction_id_fkey
  foreign key (transaction_id) references public.transactions(id) on delete set null;

alter table public.tasks
  add constraint tasks_transaction_id_fkey
  foreign key (transaction_id) references public.transactions(id) on delete set null;

alter table public.activities
  add constraint activities_transaction_id_fkey
  foreign key (transaction_id) references public.transactions(id) on delete set null;

create table if not exists public.transaction_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  role text not null,
  side text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transaction_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  assigned_user_id uuid references auth.users(id) on delete set null,
  checklist_key text,
  title text not null,
  description text,
  due_at timestamptz,
  status task_status not null default 'pending',
  is_required boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  bucket_id text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  category document_category not null default 'general',
  status document_status not null default 'active',
  version_number integer not null default 1,
  contact_id uuid references public.contacts(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  showing_id uuid references public.showings(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, name)
);

create table if not exists public.entity_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tag_id, entity_type, entity_id)
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  sale_price numeric(14,2) not null,
  commission_percentage numeric(5,2),
  gross_commission numeric(14,2),
  brokerage_split_percentage numeric(5,2),
  agent_split_percentage numeric(5,2),
  referral_fee_amount numeric(14,2) not null default 0,
  expenses_amount numeric(14,2) not null default 0,
  expected_income numeric(14,2),
  final_income numeric(14,2),
  status commission_status not null default 'expected',
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  category expense_category not null,
  amount numeric(14,2) not null,
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  changes jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_org_members_org_user on public.organization_members (organization_id, user_id);
create index if not exists idx_contacts_org_assigned on public.contacts (organization_id, assigned_user_id);
create index if not exists idx_contacts_org_name on public.contacts (organization_id, display_name);
create index if not exists idx_leads_org_stage on public.leads (organization_id, stage, disposition);
create index if not exists idx_clients_org_owner on public.clients (organization_id, owner_user_id);
create index if not exists idx_properties_org_city on public.properties (organization_id, city);
create index if not exists idx_listings_org_status on public.listings (organization_id, status);
create index if not exists idx_appointments_org_starts_at on public.appointments (organization_id, starts_at);
create index if not exists idx_showings_org_starts_at on public.showings (organization_id, starts_at);
create index if not exists idx_tasks_org_due_at on public.tasks (organization_id, due_at, status);
create index if not exists idx_activities_org_entity on public.activities (organization_id, entity_type, entity_id);
create index if not exists idx_offers_org_status on public.offers (organization_id, status);
create index if not exists idx_transactions_org_stage on public.transactions (organization_id, stage);
create index if not exists idx_documents_org_category on public.documents (organization_id, category);
create index if not exists idx_notifications_user_unread on public.notifications (user_id, read_at);
create index if not exists idx_audit_logs_org_entity on public.audit_logs (organization_id, entity_type, entity_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.has_org_role(target_organization_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    join public.roles r on r.id = om.role_id
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and r.key = any (allowed_roles)
  );
$$;

create or replace function public.shares_organization_with_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_user_id
      and mine.status = 'active'
      and theirs.status = 'active'
  );
$$;

create or replace function public.log_audit_event(
  p_organization_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_changes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    changes
  )
  values (
    p_organization_id,
    auth.uid(),
    p_entity_type,
    p_entity_id,
    p_action,
    p_changes
  );
end;
$$;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.ensure_unique_organization_slug(base_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text := public.slugify(base_name);
  candidate text := public.slugify(base_name);
  suffix integer := 1;
begin
  if candidate = '' then
    candidate := concat('workspace-', substring(gen_random_uuid()::text from 1 for 8));
  end if;

  while exists (select 1 from public.organizations where slug = candidate) loop
    suffix := suffix + 1;
    candidate := concat(base_slug, '-', suffix);
  end loop;

  return candidate;
end;
$$;

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at before update on public.organizations
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at before update on public.user_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_organization_members_updated_at on public.organization_members;
create trigger trg_organization_members_updated_at before update on public.organization_members
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at before update on public.contacts
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at before update on public.leads
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at before update on public.clients
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at before update on public.properties
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at before update on public.listings
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at before update on public.appointments
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_showing_tours_updated_at on public.showing_tours;
create trigger trg_showing_tours_updated_at before update on public.showing_tours
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_showings_updated_at on public.showings;
create trigger trg_showings_updated_at before update on public.showings
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_offers_updated_at on public.offers;
create trigger trg_offers_updated_at before update on public.offers
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at before update on public.transactions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_transaction_tasks_updated_at on public.transaction_tasks;
create trigger trg_transaction_tasks_updated_at before update on public.transaction_tasks
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at before update on public.documents
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at before update on public.notes
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_commissions_updated_at on public.commissions;
create trigger trg_commissions_updated_at before update on public.commissions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at before update on public.expenses
for each row execute procedure public.set_updated_at();

alter table public.roles enable row level security;
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.properties enable row level security;
alter table public.listings enable row level security;
alter table public.appointments enable row level security;
alter table public.showing_tours enable row level security;
alter table public.showings enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.offers enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_participants enable row level security;
alter table public.transaction_tasks enable row level security;
alter table public.documents enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.entity_tags enable row level security;
alter table public.commissions enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "roles readable by authenticated users"
on public.roles for select to authenticated
using (true);

create policy "organization members can view organizations"
on public.organizations for select to authenticated
using (public.is_organization_member(id));

create policy "authenticated users can create organizations they own"
on public.organizations for insert to authenticated
with check (owner_user_id = auth.uid());

create policy "organization admins can update organizations"
on public.organizations for update to authenticated
using (public.has_org_role(id, array['owner', 'broker_admin', 'team_admin']))
with check (public.has_org_role(id, array['owner', 'broker_admin', 'team_admin']));

create policy "users can view own profile or colleagues"
on public.user_profiles for select to authenticated
using (id = auth.uid() or public.shares_organization_with_user(id));

create policy "users can update own profile"
on public.user_profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "users can insert own profile"
on public.user_profiles for insert to authenticated
with check (id = auth.uid());

create policy "members can view organization memberships"
on public.organization_members for select to authenticated
using (public.is_organization_member(organization_id));

create policy "owners and admins can manage organization memberships"
on public.organization_members for insert to authenticated
with check (
  exists (
    select 1
    from public.organizations o
    where o.id = organization_id
      and o.owner_user_id = auth.uid()
  )
  or public.has_org_role(organization_id, array['owner', 'broker_admin', 'team_admin'])
);

create policy "owners and admins can update memberships"
on public.organization_members for update to authenticated
using (public.has_org_role(organization_id, array['owner', 'broker_admin', 'team_admin']))
with check (public.has_org_role(organization_id, array['owner', 'broker_admin', 'team_admin']));

create policy "owners and admins can delete memberships"
on public.organization_members for delete to authenticated
using (public.has_org_role(organization_id, array['owner', 'broker_admin', 'team_admin']));

create policy "members can manage contacts in their organization"
on public.contacts for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage leads in their organization"
on public.leads for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage clients in their organization"
on public.clients for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage properties in their organization"
on public.properties for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage listings in their organization"
on public.listings for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage appointments in their organization"
on public.appointments for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage showing tours in their organization"
on public.showing_tours for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage showings in their organization"
on public.showings for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage tasks in their organization"
on public.tasks for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can view activities in their organization"
on public.activities for select to authenticated
using (public.is_organization_member(organization_id));

create policy "members can create activities in their organization"
on public.activities for insert to authenticated
with check (public.is_organization_member(organization_id));

create policy "members can manage offers in their organization"
on public.offers for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage transactions in their organization"
on public.transactions for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage transaction participants in their organization"
on public.transaction_participants for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage transaction tasks in their organization"
on public.transaction_tasks for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage documents in their organization"
on public.documents for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage notes in their organization"
on public.notes for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage tags in their organization"
on public.tags for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage entity tags in their organization"
on public.entity_tags for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage commissions in their organization"
on public.commissions for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "members can manage expenses in their organization"
on public.expenses for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "users can view own notifications"
on public.notifications for select to authenticated
using (user_id = auth.uid() and public.is_organization_member(organization_id));

create policy "users can update own notifications"
on public.notifications for update to authenticated
using (user_id = auth.uid() and public.is_organization_member(organization_id))
with check (user_id = auth.uid() and public.is_organization_member(organization_id));

create policy "members can insert notifications in their organization"
on public.notifications for insert to authenticated
with check (public.is_organization_member(organization_id));

create policy "admins can view audit logs"
on public.audit_logs for select to authenticated
using (public.has_org_role(organization_id, array['owner', 'broker_admin', 'team_admin', 'coordinator']));

create policy "members can insert audit logs"
on public.audit_logs for insert to authenticated
with check (public.is_organization_member(organization_id));

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('property-media', 'property-media', false),
  ('listing-media', 'listing-media', false),
  ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "organization members can read storage objects"
on storage.objects for select to authenticated
using (
  bucket_id in ('documents', 'property-media', 'listing-media', 'receipts')
  and public.is_organization_member(((storage.foldername(name))[1])::uuid)
);

create policy "organization members can upload storage objects"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('documents', 'property-media', 'listing-media', 'receipts')
  and public.is_organization_member(((storage.foldername(name))[1])::uuid)
);

create policy "organization members can update storage objects"
on storage.objects for update to authenticated
using (
  bucket_id in ('documents', 'property-media', 'listing-media', 'receipts')
  and public.is_organization_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id in ('documents', 'property-media', 'listing-media', 'receipts')
  and public.is_organization_member(((storage.foldername(name))[1])::uuid)
);

create policy "organization admins can delete storage objects"
on storage.objects for delete to authenticated
using (
  bucket_id in ('documents', 'property-media', 'listing-media', 'receipts')
  and public.has_org_role(((storage.foldername(name))[1])::uuid, array['owner', 'broker_admin', 'team_admin'])
);
