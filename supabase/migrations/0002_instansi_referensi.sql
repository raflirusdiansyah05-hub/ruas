-- 0002_instansi_referensi.sql
-- Data seed/simulasi untuk verifikasi NIP+Instansi (BUKAN integrasi real ke SIMPEG/BKN)
create table if not exists public.instansi_referensi (
  id uuid primary key default gen_random_uuid(),
  nip text unique not null,
  nama_pegawai text not null,
  instansi text not null,
  is_active boolean not null default true
);

alter table public.instansi_referensi enable row level security;

-- Policy RLS: Bisa dibaca oleh siapa saja (atau route handler verify-nip)
create policy "public_read_instansi_referensi"
  on public.instansi_referensi for select
  using (true);
