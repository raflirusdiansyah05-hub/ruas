-- 0008_notifications.sql
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

alter table public.notifications enable row level security;

-- Pengguna hanya melihat notifikasinya sendiri
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Pengguna dapat update status baca notifikasinya sendiri
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Insert policy (server-side atau staf)
create policy "notifications_insert_policy"
  on public.notifications for insert
  with check (true);
