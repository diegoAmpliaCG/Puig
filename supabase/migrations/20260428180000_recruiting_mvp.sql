create extension if not exists pgcrypto;

create schema if not exists recruiting;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'gestor', 'team_user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  area text not null,
  location text not null,
  modality text not null check (modality in ('presencial', 'remoto', 'hibrido')),
  seniority text not null,
  description text not null,
  job_description_text text,
  job_description_file_path text,
  status text not null default 'draft' check (status in ('draft', 'cv_selection', 'processing', 'ranking_ready', 'published', 'closed')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  source text not null check (source in ('upload', 'drive', 'sap')),
  drive_file_id text,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  file_role text not null check (file_role in ('job_description', 'candidate_cv')),
  created_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  source text not null default 'upload' check (source in ('upload', 'drive', 'sap', 'demo')),
  status text not null default 'selected' check (status in ('selected', 'processing', 'ranked', 'published', 'viewed_by_team', 'interview_requested', 'booking_opened', 'scheduled', 'interview_done', 'advanced', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  drive_file_id text,
  file_name text not null,
  file_hash text,
  storage_path text not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_evaluations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  overall_score numeric(5,2) not null check (overall_score >= 0 and overall_score <= 100),
  recommendation text not null check (recommendation in ('advance', 'review', 'reject')),
  summary text not null,
  strengths_json jsonb not null default '[]'::jsonb,
  risks_json jsonb not null default '[]'::jsonb,
  criteria_json jsonb not null default '[]'::jsonb,
  interview_questions_json jsonb not null default '[]'::jsonb,
  raw_llm_json jsonb not null default '{}'::jsonb,
  confidence_score numeric(5,2) not null default 0 check (confidence_score >= 0 and confidence_score <= 100),
  created_at timestamptz not null default now(),
  unique (candidate_id, job_id)
);

create table if not exists public.job_publications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  permissions_json jsonb not null default '{"view_ranking":true,"view_candidate":true,"view_cv":true,"view_llm_comments":true,"request_interview":true}'::jsonb,
  published_by uuid references public.profiles(id),
  published_at timestamptz not null default now(),
  unique (job_id, team_id)
);

create table if not exists public.interview_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  requested_by_user_id uuid not null references public.profiles(id),
  interviewer_user_id uuid not null references public.profiles(id),
  duration_minutes integer not null check (duration_minutes in (30, 45, 60)),
  interview_type text not null check (interview_type in ('screening', 'tecnica', 'cultural', 'final')),
  message text,
  booking_token_hash text not null unique,
  status text not null default 'created' check (status in ('created', 'email_sent', 'booking_opened', 'scheduled', 'expired', 'cancelled', 'failed')),
  expires_at timestamptz not null,
  email_sent_at timestamptz,
  booking_opened_at timestamptz,
  scheduled_at timestamptz,
  calendar_event_id text,
  google_meet_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  google_email text not null,
  google_calendar_id text not null default 'primary',
  encrypted_refresh_token text,
  availability_rules_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  interview_request_id uuid references public.interview_requests(id) on delete cascade,
  to_email text not null,
  subject text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null,
  sent_at timestamptz,
  opened_at timestamptz,
  error_message text
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  actor_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_company_idx on public.profiles(company_id);
create index if not exists jobs_company_status_idx on public.jobs(company_id, status);
create index if not exists jobs_created_by_idx on public.jobs(created_by);
create index if not exists candidates_job_status_idx on public.candidates(job_id, status);
create index if not exists candidate_evaluations_job_score_idx on public.candidate_evaluations(job_id, overall_score desc);
create index if not exists job_publications_team_idx on public.job_publications(team_id, job_id);
create index if not exists interview_requests_candidate_idx on public.interview_requests(candidate_id, status);
create index if not exists audit_logs_company_entity_idx on public.audit_logs(company_id, entity_type, entity_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists candidates_set_updated_at on public.candidates;
create trigger candidates_set_updated_at before update on public.candidates for each row execute function public.set_updated_at();
drop trigger if exists interview_requests_set_updated_at on public.interview_requests;
create trigger interview_requests_set_updated_at before update on public.interview_requests for each row execute function public.set_updated_at();
drop trigger if exists calendar_connections_set_updated_at on public.calendar_connections;
create trigger calendar_connections_set_updated_at before update on public.calendar_connections for each row execute function public.set_updated_at();

create or replace function recruiting.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function recruiting.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function recruiting.is_manager()
returns boolean
language sql
stable
as $$
  select recruiting.current_role() in ('admin', 'gestor')
$$;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.jobs enable row level security;
alter table public.job_files enable row level security;
alter table public.candidates enable row level security;
alter table public.candidate_files enable row level security;
alter table public.candidate_evaluations enable row level security;
alter table public.job_publications enable row level security;
alter table public.interview_requests enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.email_logs enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists companies_select_company on public.companies;
create policy companies_select_company on public.companies for select using (id = recruiting.current_company_id());

drop policy if exists profiles_select_company on public.profiles;
create policy profiles_select_company on public.profiles for select using (company_id = recruiting.current_company_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists teams_select_company on public.teams;
create policy teams_select_company on public.teams for select using (company_id = recruiting.current_company_id());

drop policy if exists teams_manager_write on public.teams;
create policy teams_manager_write on public.teams for all using (company_id = recruiting.current_company_id() and recruiting.is_manager()) with check (company_id = recruiting.current_company_id() and recruiting.is_manager());

drop policy if exists team_members_select_company on public.team_members;
create policy team_members_select_company on public.team_members for select using (
  exists (select 1 from public.teams t where t.id = team_id and t.company_id = recruiting.current_company_id())
);

drop policy if exists team_members_manager_write on public.team_members;
create policy team_members_manager_write on public.team_members for all using (
  recruiting.is_manager() and exists (select 1 from public.teams t where t.id = team_id and t.company_id = recruiting.current_company_id())
) with check (
  recruiting.is_manager() and exists (select 1 from public.teams t where t.id = team_id and t.company_id = recruiting.current_company_id())
);

drop policy if exists jobs_manager_all on public.jobs;
create policy jobs_manager_all on public.jobs for all using (company_id = recruiting.current_company_id() and recruiting.is_manager()) with check (company_id = recruiting.current_company_id() and recruiting.is_manager());

drop policy if exists jobs_team_published_select on public.jobs;
create policy jobs_team_published_select on public.jobs for select using (
  company_id = recruiting.current_company_id()
  and status = 'published'
  and exists (
    select 1
    from public.job_publications jp
    join public.team_members tm on tm.team_id = jp.team_id
    where jp.job_id = jobs.id and tm.user_id = auth.uid()
  )
);

drop policy if exists job_publications_company_select on public.job_publications;
create policy job_publications_company_select on public.job_publications for select using (company_id = recruiting.current_company_id());

drop policy if exists job_publications_manager_write on public.job_publications;
create policy job_publications_manager_write on public.job_publications for all using (company_id = recruiting.current_company_id() and recruiting.is_manager()) with check (company_id = recruiting.current_company_id() and recruiting.is_manager());

drop policy if exists candidates_company_select on public.candidates;
create policy candidates_company_select on public.candidates for select using (
  company_id = recruiting.current_company_id()
  and (
    recruiting.is_manager()
    or exists (
      select 1
      from public.job_publications jp
      join public.team_members tm on tm.team_id = jp.team_id
      where jp.job_id = candidates.job_id and tm.user_id = auth.uid()
    )
  )
);

drop policy if exists candidates_manager_write on public.candidates;
create policy candidates_manager_write on public.candidates for all using (company_id = recruiting.current_company_id() and recruiting.is_manager()) with check (company_id = recruiting.current_company_id() and recruiting.is_manager());

drop policy if exists candidates_team_request_update on public.candidates;
create policy candidates_team_request_update on public.candidates for update using (
  company_id = recruiting.current_company_id()
  and exists (
    select 1
    from public.job_publications jp
    join public.team_members tm on tm.team_id = jp.team_id
    where jp.job_id = candidates.job_id and tm.user_id = auth.uid()
  )
) with check (company_id = recruiting.current_company_id());

drop policy if exists job_files_company_select on public.job_files;
create policy job_files_company_select on public.job_files for select using (company_id = recruiting.current_company_id());
drop policy if exists job_files_manager_write on public.job_files;
create policy job_files_manager_write on public.job_files for all using (company_id = recruiting.current_company_id() and recruiting.is_manager()) with check (company_id = recruiting.current_company_id() and recruiting.is_manager());

drop policy if exists candidate_files_company_select on public.candidate_files;
create policy candidate_files_company_select on public.candidate_files for select using (company_id = recruiting.current_company_id());
drop policy if exists candidate_files_manager_write on public.candidate_files;
create policy candidate_files_manager_write on public.candidate_files for all using (company_id = recruiting.current_company_id() and recruiting.is_manager()) with check (company_id = recruiting.current_company_id() and recruiting.is_manager());

drop policy if exists evaluations_company_select on public.candidate_evaluations;
create policy evaluations_company_select on public.candidate_evaluations for select using (company_id = recruiting.current_company_id());
drop policy if exists evaluations_manager_write on public.candidate_evaluations;
create policy evaluations_manager_write on public.candidate_evaluations for all using (company_id = recruiting.current_company_id() and recruiting.is_manager()) with check (company_id = recruiting.current_company_id() and recruiting.is_manager());

drop policy if exists interviews_company_select on public.interview_requests;
create policy interviews_company_select on public.interview_requests for select using (company_id = recruiting.current_company_id());
drop policy if exists interviews_company_insert on public.interview_requests;
create policy interviews_company_insert on public.interview_requests for insert with check (company_id = recruiting.current_company_id());
drop policy if exists interviews_company_update on public.interview_requests;
create policy interviews_company_update on public.interview_requests for update using (company_id = recruiting.current_company_id()) with check (company_id = recruiting.current_company_id());

drop policy if exists calendar_connections_own_select on public.calendar_connections;
create policy calendar_connections_own_select on public.calendar_connections for select using (company_id = recruiting.current_company_id() and (user_id = auth.uid() or recruiting.is_manager()));
drop policy if exists calendar_connections_own_write on public.calendar_connections;
create policy calendar_connections_own_write on public.calendar_connections for all using (company_id = recruiting.current_company_id() and user_id = auth.uid()) with check (company_id = recruiting.current_company_id() and user_id = auth.uid());

drop policy if exists email_logs_company_select on public.email_logs;
create policy email_logs_company_select on public.email_logs for select using (company_id = recruiting.current_company_id());
drop policy if exists email_logs_server_insert on public.email_logs;
create policy email_logs_server_insert on public.email_logs for insert with check (company_id = recruiting.current_company_id());

drop policy if exists audit_logs_company_select on public.audit_logs;
create policy audit_logs_company_select on public.audit_logs for select using (company_id = recruiting.current_company_id());
drop policy if exists audit_logs_company_insert on public.audit_logs;
create policy audit_logs_company_insert on public.audit_logs for insert with check (company_id = recruiting.current_company_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('candidate-cvs', 'candidate-cvs', false, 20971520, array['application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword']),
  ('job-descriptions', 'job-descriptions', false, 20971520, array['application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword'])
on conflict (id) do update set public = false;

drop policy if exists storage_company_read_candidate_cvs on storage.objects;
create policy storage_company_read_candidate_cvs on storage.objects for select to authenticated using (
  bucket_id = 'candidate-cvs'
  and split_part(name, '/', 1) = recruiting.current_company_id()::text
);

drop policy if exists storage_company_read_job_descriptions on storage.objects;
create policy storage_company_read_job_descriptions on storage.objects for select to authenticated using (
  bucket_id = 'job-descriptions'
  and split_part(name, '/', 1) = recruiting.current_company_id()::text
);

drop policy if exists storage_manager_write_candidate_cvs on storage.objects;
create policy storage_manager_write_candidate_cvs on storage.objects for all to authenticated using (
  bucket_id = 'candidate-cvs'
  and split_part(name, '/', 1) = recruiting.current_company_id()::text
  and recruiting.is_manager()
) with check (
  bucket_id = 'candidate-cvs'
  and split_part(name, '/', 1) = recruiting.current_company_id()::text
  and recruiting.is_manager()
);

drop policy if exists storage_manager_write_job_descriptions on storage.objects;
create policy storage_manager_write_job_descriptions on storage.objects for all to authenticated using (
  bucket_id = 'job-descriptions'
  and split_part(name, '/', 1) = recruiting.current_company_id()::text
  and recruiting.is_manager()
) with check (
  bucket_id = 'job-descriptions'
  and split_part(name, '/', 1) = recruiting.current_company_id()::text
  and recruiting.is_manager()
);
