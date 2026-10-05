-- 0007_status_history.sql
create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  status_from text,
  status_to text not null,
  changed_by uuid not null references public.profiles(id),
  changed_at timestamptz not null default now(),
  note text
);

create index if not exists idx_status_history_report on public.status_history(report_id);

alter table public.status_history enable row level security;

-- Pelapor pemilik laporan dan staf berwenang melihat riwayat status
create policy "status_history_select_authorized"
  on public.status_history for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = public.status_history.report_id
      and (
        reports.reporter_id = auth.uid() or
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role in ('admin', 'petugas')
        )
      )
    )
  );

-- Insert diizinkan untuk pengguna yang terautentikasi (atau via server)
create policy "status_history_insert_policy"
  on public.status_history for insert
  with check (auth.uid() = changed_by);
