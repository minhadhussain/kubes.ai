alter table public.ai_artifacts
  drop constraint if exists ai_artifacts_action_status_check;

alter type ai_action_status rename to ai_action_status_old;

create type ai_action_status as enum ('draft', 'pending', 'saved', 'approved', 'executed', 'failed', 'cancelled');

alter table public.ai_artifacts
  alter column action_status type ai_action_status
  using action_status::text::ai_action_status;

drop type ai_action_status_old;
