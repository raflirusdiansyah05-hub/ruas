-- 0006_assignments.sql
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  petugas_id uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  status text not null default 'ditugaskan'
    check (status in ('ditugaskan','dikerjakan','selesai')),
  proof_photo_url text,
  completed_at timestamptz
);

create index if not exists idx_assignments_petugas on public.assignments(petugas_id);
create index if not exists idx_assignments_report on public.assignments(report_id);

alter table public.assignments enable row level security;

-- Petugas melihat tugas miliknya, Admin melihat semua
create policy "assignments_select_policy"
  on public.assignments for select
  using (
    petugas_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admin dapat insert penugasan
create policy "admin_insert_assignments"
  on public.assignments for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Petugas dapat update status tugas miliknya, Admin juga dapat update
create policy "assignments_update_policy"
  on public.assignments for update
  using (
    petugas_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
