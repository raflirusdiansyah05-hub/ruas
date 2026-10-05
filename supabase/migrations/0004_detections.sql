-- 0004_detections.sql
create table if not exists public.detections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  damage_type text not null
    check (damage_type in ('retak_memanjang','retak_melintang','retak_buaya','lubang')),
  confidence numeric(4,3) not null,
  bbox_x numeric not null,
  bbox_y numeric not null,
  bbox_w numeric not null,
  bbox_h numeric not null,
  model_version text not null default 'mock-v0',
  created_at timestamptz not null default now()
);

create index if not exists idx_detections_report on public.detections(report_id);

alter table public.detections enable row level security;

-- Detections bisa dibaca oleh pemilik laporan atau staf
create policy "detections_select_authorized"
  on public.detections for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = public.detections.report_id
      and (
        reports.reporter_id = auth.uid() or
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role in ('admin', 'petugas')
        )
      )
    )
  );

-- Insert via server-side / route handler
create policy "detections_insert_policy"
  on public.detections for insert
  with check (
    exists (
      select 1 from public.reports
      where reports.id = public.detections.report_id
      and reports.reporter_id = auth.uid()
    ) or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
