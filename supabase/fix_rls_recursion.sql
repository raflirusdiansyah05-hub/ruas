-- ==============================================================================
-- FIX RLS INFINITE RECURSION MIGRATION
-- Jalankan skrip ini langsung di Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Buat helper function security definer untuk cek role tanpa memicu RLS loop
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer stable;

-- 2. Perbaiki Policy di public.profiles
drop policy if exists "profiles_select_own_or_staff" on public.profiles;
drop policy if exists "profiles_select_policy" on public.profiles;

create policy "profiles_select_policy"
  on public.profiles for select
  using (
    auth.uid() = id or
    public.current_user_role() in ('admin', 'petugas')
  );

-- 3. Perbaiki Policy di public.reports
drop policy if exists "staff_select_all_reports" on public.reports;
drop policy if exists "admin_update_reports" on public.reports;

create policy "staff_select_all_reports"
  on public.reports for select
  using (
    public.current_user_role() in ('admin', 'petugas')
  );

create policy "admin_update_reports"
  on public.reports for update
  using (
    public.current_user_role() = 'admin'
  );

-- 4. Perbaiki Policy di public.detections
drop policy if exists "detections_select_authorized" on public.detections;

create policy "detections_select_authorized"
  on public.detections for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = public.detections.report_id
      and (
        reports.reporter_id = auth.uid() or
        public.current_user_role() in ('admin', 'petugas')
      )
    )
  );

-- 5. Perbaiki Policy di public.priority_scores
drop policy if exists "priority_scores_select_authorized" on public.priority_scores;

create policy "priority_scores_select_authorized"
  on public.priority_scores for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = public.priority_scores.report_id
      and (
        reports.reporter_id = auth.uid() or
        public.current_user_role() in ('admin', 'petugas')
      )
    )
  );

-- 6. Perbaiki Policy di public.assignments
drop policy if exists "assignments_select_policy" on public.assignments;
drop policy if exists "admin_insert_assignments" on public.assignments;

create policy "assignments_select_policy"
  on public.assignments for select
  using (
    petugas_id = auth.uid() or
    public.current_user_role() = 'admin'
  );

create policy "admin_insert_assignments"
  on public.assignments for insert
  with check (
    public.current_user_role() = 'admin'
  );

-- 7. Perbaiki Policy di public.status_history
drop policy if exists "status_history_select_authorized" on public.status_history;

create policy "status_history_select_authorized"
  on public.status_history for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = public.status_history.report_id
      and (
        reports.reporter_id = auth.uid() or
        public.current_user_role() in ('admin', 'petugas')
      )
    )
  );
