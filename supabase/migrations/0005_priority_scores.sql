-- 0005_priority_scores.sql
create table if not exists public.priority_scores (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  severity_level text not null check (severity_level in ('low','medium','high','critical')),
  severity_value numeric not null,
  confidence_component numeric not null,
  density_component numeric not null,
  priority_value numeric not null,
  computed_at timestamptz not null default now()
);

create index if not exists idx_priority_value on public.priority_scores(priority_value desc);

alter table public.priority_scores enable row level security;

-- Prioritas & Severity transparan: bisa dibaca oleh pelapor pemilik dan staf
create policy "priority_scores_select_authorized"
  on public.priority_scores for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = public.priority_scores.report_id
      and (
        reports.reporter_id = auth.uid() or
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role in ('admin', 'petugas')
        )
      )
    )
  );

create policy "priority_scores_insert_authorized"
  on public.priority_scores for insert
  with check (
    exists (
      select 1 from public.reports
      where reports.id = public.priority_scores.report_id
      and reports.reporter_id = auth.uid()
    ) or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
