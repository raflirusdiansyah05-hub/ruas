-- 0010_fungsi_jalan_and_priority_scores.sql
-- Migrasi Round 3:
-- 1. Tambah kolom fungsi_jalan pada tabel reports
-- 2. Sesuaikan kolom tabel priority_scores (tambah s_norm dan exposure_value)

-- 1. Tambah kolom fungsi_jalan ke public.reports jika belum ada
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reports'
      and column_name = 'fungsi_jalan'
  ) then
    alter table public.reports
      add column fungsi_jalan text not null default 'lokal'
      check (fungsi_jalan in ('arteri','kolektor','lokal','lingkungan'));
    
    -- Hapus default setelah inisialisasi agar data baru wajib mengisi fungsi_jalan
    alter table public.reports alter column fungsi_jalan drop default;
  end if;
end $$;

create index if not exists idx_reports_fungsi_jalan on public.reports(fungsi_jalan);

-- 2. Tambah kolom s_norm dan exposure_value ke public.priority_scores
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'priority_scores'
      and column_name = 's_norm'
  ) then
    alter table public.priority_scores
      add column s_norm numeric not null default 0
      check (s_norm >= 0 and s_norm <= 100);

    alter table public.priority_scores alter column s_norm drop default;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'priority_scores'
      and column_name = 'exposure_value'
  ) then
    alter table public.priority_scores
      add column exposure_value numeric not null default 50
      check (exposure_value in (25, 50, 75, 100));

    alter table public.priority_scores alter column exposure_value drop default;
  end if;
end $$;

-- 3. Izinkan kolom lama pada priority_scores menjadi opsional (nullable) untuk kompatibilitas data lama
alter table public.priority_scores alter column severity_level drop not null;
alter table public.priority_scores alter column confidence_component drop not null;
alter table public.priority_scores alter column density_component drop not null;
