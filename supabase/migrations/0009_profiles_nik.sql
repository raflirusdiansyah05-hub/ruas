-- 0009_profiles_nik.sql
-- Menambahkan kolom NIK pada tabel profiles untuk profil warga/pelapor
alter table public.profiles add column if not exists nik text;

-- Perbarui fungsi trigger handle_new_user agar menyimpan phone dan nik dari metadata user jika tersedia
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, phone, nik, nip, instansi, wilayah, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Pengguna RUAS'),
    coalesce(new.raw_user_meta_data->>'role', 'pelapor'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nik',
    new.raw_user_meta_data->>'nip',
    new.raw_user_meta_data->>'instansi',
    new.raw_user_meta_data->>'wilayah',
    case
      when (new.raw_user_meta_data->>'role') = 'petugas' then 'pending'
      else 'active'
    end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    phone = coalesce(excluded.phone, public.profiles.phone),
    nik = coalesce(excluded.nik, public.profiles.nik),
    nip = coalesce(excluded.nip, public.profiles.nip),
    instansi = coalesce(excluded.instansi, public.profiles.instansi),
    wilayah = coalesce(excluded.wilayah, public.profiles.wilayah);
  return new;
end;
$$ language plpgsql security definer;
