-- 0001_profiles.sql
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

alter table public.profiles enable row level security;

-- Policy RLS Profiles
create policy "profiles_select_own_or_staff"
  on public.profiles for select
  using (
    auth.uid() = id or
    exists (
      select 1 from public.profiles staff
      where staff.id = auth.uid() and staff.role in ('admin', 'petugas')
    )
  );

create policy "profiles_insert_service_or_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger otomatis on_auth_user_created untuk populate profiles
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

-- Pasang trigger ke auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
