-- ==============================================================================
-- RUAS ALL-IN-ONE SCHEMA & SEED MIGRATION (ORDERED BY DEPENDENCIES)
-- ==============================================================================

-- ==============================================================================
-- STEP 1: CREATE ALL TABLES FIRST
-- ==============================================================================

-- 1.1 PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('pelapor', 'admin', 'petugas')),
  full_name text not null,
  phone text,
  nip text,
  instansi text,
  wilayah text,
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  created_at timestamptz not null default now()
);

-- 1.2 INSTANSI_REFERENSI
create table if not exists public.instansi_referensi (
  id uuid primary key default gen_random_uuid(),
  nip text unique not null,
  nama_pegawai text not null,
  instansi text not null,
  is_active boolean not null default true
);

-- 1.3 REPORTS
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

-- 1.4 DETECTIONS
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

-- 1.5 PRIORITY_SCORES
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

-- 1.6 ASSIGNMENTS
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

-- 1.7 STATUS_HISTORY
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

-- 1.8 NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  related_report_id uuid references public.reports(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read);


-- ==============================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.instansi_referensi enable row level security;
alter table public.reports enable row level security;
alter table public.detections enable row level security;
alter table public.priority_scores enable row level security;
alter table public.assignments enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;


-- ==============================================================================
-- STEP 3: CREATE RLS POLICIES (ALL TABLES EXIST NOW)
-- ==============================================================================

-- 3.1 PROFILES POLICIES
drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff"
  on public.profiles for select
  using (
    auth.uid() = id or
    exists (
      select 1 from public.profiles staff
      where staff.id = auth.uid() and staff.role in ('admin', 'petugas')
    )
  );

drop policy if exists "profiles_insert_service_or_own" on public.profiles;
create policy "profiles_insert_service_or_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 3.2 INSTANSI_REFERENSI POLICIES
drop policy if exists "public_read_instansi_referensi" on public.instansi_referensi;
create policy "public_read_instansi_referensi"
  on public.instansi_referensi for select
  using (true);

-- 3.3 REPORTS POLICIES
drop policy if exists "pelapor_select_own_reports" on public.reports;
create policy "pelapor_select_own_reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

drop policy if exists "pelapor_insert_own_reports" on public.reports;
create policy "pelapor_insert_own_reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "staff_select_all_reports" on public.reports;
create policy "staff_select_all_reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'petugas')
    )
  );

drop policy if exists "admin_update_reports" on public.reports;
create policy "admin_update_reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "assigned_petugas_update_reports" on public.reports;
create policy "assigned_petugas_update_reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.assignments
      where assignments.report_id = public.reports.id
      and assignments.petugas_id = auth.uid()
    )
  );

-- 3.4 DETECTIONS POLICIES
drop policy if exists "detections_select_authorized" on public.detections;
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

drop policy if exists "detections_insert_policy" on public.detections;
create policy "detections_insert_policy"
  on public.detections for insert
  with check (true);

-- 3.5 PRIORITY_SCORES POLICIES
drop policy if exists "priority_scores_select_authorized" on public.priority_scores;
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

drop policy if exists "priority_scores_insert_authorized" on public.priority_scores;
create policy "priority_scores_insert_authorized"
  on public.priority_scores for insert
  with check (true);

-- 3.6 ASSIGNMENTS POLICIES
drop policy if exists "assignments_select_policy" on public.assignments;
create policy "assignments_select_policy"
  on public.assignments for select
  using (
    petugas_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "admin_insert_assignments" on public.assignments;
create policy "admin_insert_assignments"
  on public.assignments for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "assignments_update_policy" on public.assignments;
create policy "assignments_update_policy"
  on public.assignments for update
  using (
    petugas_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 3.7 STATUS_HISTORY POLICIES
drop policy if exists "status_history_select_authorized" on public.status_history;
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

drop policy if exists "status_history_insert_policy" on public.status_history;
create policy "status_history_insert_policy"
  on public.status_history for insert
  with check (true);

-- 3.8 NOTIFICATIONS POLICIES
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "notifications_insert_policy" on public.notifications;
create policy "notifications_insert_policy"
  on public.notifications for insert
  with check (true);


-- ==============================================================================
-- STEP 4: TRIGGER AUTH ON_USER_CREATED
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, nip, instansi, wilayah, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Pengguna RUAS'),
    coalesce(new.raw_user_meta_data->>'role', 'pelapor'),
    new.raw_user_meta_data->>'nip',
    new.raw_user_meta_data->>'instansi',
    new.raw_user_meta_data->>'wilayah',
    case
      when (new.raw_user_meta_data->>'role') = 'petugas' then 'pending'
      else 'active'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==============================================================================
-- STEP 5: SEED DATA INSTANSI REFERENSI
-- ==============================================================================

insert into public.instansi_referensi (nip, nama_pegawai, instansi, is_active)
values
  ('198501012010011001', 'Ir. Budi Santoso, M.T.', 'Dinas Bina Marga dan Penataan Ruang', true),
  ('198803152012022002', 'Siti Rahmawati, S.T.', 'Dinas Pekerjaan Umum dan Perumahan Rakyat', true),
  ('199007202015031003', 'Ahmad Fauzi, S.T.', 'Dinas Pekerjaan Umum Kota', true),
  ('199211102018012004', 'Dewi Lestari, S.T.', 'Dinas Bina Marga Provinsi', true),
  ('198205042008011005', 'Hendra Kusuma, M.Eng.', 'Dinas Perhubungan dan Prasarana Jalan', true),
  ('199501012020121006', 'Pegawai Non-Aktif', 'Dinas Bina Marga dan Penataan Ruang', false)
on conflict (nip) do nothing;


-- ==============================================================================
-- STEP 6: STORAGE BUCKETS (REPORTS & PROOFS)
-- ==============================================================================

insert into storage.buckets (id, name, public)
values 
  ('reports', 'reports', true),
  ('proofs', 'proofs', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Access Reports Bucket" on storage.objects;
create policy "Public Access Reports Bucket"
  on storage.objects for select
  using (bucket_id in ('reports', 'proofs'));

drop policy if exists "Authenticated Upload Reports" on storage.objects;
create policy "Authenticated Upload Reports"
  on storage.objects for insert
  with check (bucket_id in ('reports', 'proofs'));
