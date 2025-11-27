-- Migration: jobs (lat/long, images), messages, reports, and RLS policies

begin;

-- 1) Geospatial + Media for jobs
alter table public.jobs
  add column if not exists latitude double precision
    check (latitude between -90 and 90),
  add column if not exists longitude double precision
    check (longitude between -180 and 180),
  add column if not exists images text[] not null default '{}'::text[];

-- 2) Messaging table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

-- Helpful indexes
create index if not exists messages_application_id_idx on public.messages(application_id);
create index if not exists messages_application_id_created_at_idx on public.messages(application_id, created_at);

-- 3) Reports table for dispute resolution
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_job_id uuid references public.jobs(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status text not null default 'open', -- e.g. 'open' | 'in_review' | 'resolved'
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.messages enable row level security;
alter table public.reports enable row level security;

-- RLS policies for messages:
-- Users should only see messages for applications they belong to:
-- Belong means: (applications.worker_id = auth.uid()) OR (jobs.provider_id = auth.uid())
create policy "messages_select_app_participants"
  on public.messages for select
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = messages.application_id
        and (a.worker_id = auth.uid() or j.provider_id = auth.uid())
    )
  );

-- Insert messages only by participants and sender must be the authenticated user
create policy "messages_insert_by_sender_participant"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = messages.application_id
        and (a.worker_id = auth.uid() or j.provider_id = auth.uid())
    )
  );

-- Allow updating is_read (e.g., marking messages read) only by participants
create policy "messages_update_is_read_by_participants"
  on public.messages for update
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = messages.application_id
        and (a.worker_id = auth.uid() or j.provider_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = messages.application_id
        and (a.worker_id = auth.uid() or j.provider_id = auth.uid())
    )
  );

-- RLS policies for reports:
-- Insert: reporter creates their own report
create policy "reports_insert_by_reporter"
  on public.reports for insert
  with check (reporter_id = auth.uid());

-- Select: reporter can see their reports;
-- Job provider can see reports about their job;
-- Reported user can see reports where reported_user_id = them
create policy "reports_select_visibility"
  on public.reports for select
  using (
    reporter_id = auth.uid()
    or exists (
      select 1
      from public.jobs j
      where j.id = reports.reported_job_id
        and j.provider_id = auth.uid()
    )
    or reported_user_id = auth.uid()
  );

-- Update: default to only reporter being able to update (e.g. add more info)
create policy "reports_update_by_reporter"
  on public.reports for update
  using (reporter_id = auth.uid())
  with check (reporter_id = auth.uid());

commit;