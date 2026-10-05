-- 0003_reports.sql
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  address_text text,
  description text,
  status text not null default 'baru'
    check (status in ('baru','diverifikasi','dijadwalkan','dikerjakan','selesai','ditolak')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_reporter on public.reports(reporter_id);

alter table public.reports enable row level security;

-- Pelapor dapat melihat laporannya sendiri
create policy "pelapor_select_own_reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- Pelapor dapat insert laporan miliknya
create policy "pelapor_insert_own_reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Staff (Admin & Petugas) dapat membaca seluruh laporan
create policy "staff_select_all_reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'petugas')
    )
  );

-- Admin dapat update status laporan
create policy "admin_update_reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Petugas yang ditugaskan dapat update status laporan
create policy "assigned_petugas_update_reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.assignments
      where assignments.report_id = public.reports.id
      and assignments.petugas_id = auth.uid()
    )
  );
