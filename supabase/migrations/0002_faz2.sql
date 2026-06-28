-- =============================================================================
-- YK COACHING — Faz 2 şeması (profil, loglama/takvim, ilerleme, beslenme uyum,
-- mesajlaşma bildirimleri). Idempotent — birden çok kez çalıştırılabilir.
-- =============================================================================

-- ---------- ENUM'lar ----------
do $$ begin create type session_status as enum ('planned','completed','skipped');
exception when duplicate_object then null; end $$;
do $$ begin create type task_kind as enum ('cardio','habit');
exception when duplicate_object then null; end $$;

-- ---------- profiles genişletme ----------
alter table public.profiles add column if not exists activity_level text;
alter table public.profiles add column if not exists sex text;
alter table public.profiles add column if not exists height_cm numeric;
alter table public.profiles add column if not exists birthday date;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists units text not null default 'metric';
alter table public.profiles add column if not exists timezone text;

-- ---------- egzersiz medyası ----------
alter table public.exercises add column if not exists image_url text;
alter table public.exercises add column if not exists video_url text;

-- ---------- takvim + loglama ----------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  date date not null default current_date,
  status session_status not null default 'planned',
  duration_min int,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_sessions_client on public.workout_sessions(client_id, date);

create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text,
  set_no int not null default 1,
  reps int,
  weight numeric,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_setlogs_session on public.set_logs(session_id);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  title text not null,
  detail text,
  kind task_kind not null default 'cardio',
  target text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_tasks_client on public.daily_tasks(client_id, date);

-- ---------- beslenme uyum ----------
create table if not exists public.meal_checks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  date date not null default current_date,
  done boolean not null default true,
  unique (client_id, meal_id, date)
);
create index if not exists idx_mealchecks_client on public.meal_checks(client_id, date);

create table if not exists public.water_intake (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  ml int not null default 0,
  target_ml int not null default 3000,
  unique (client_id, date)
);

-- ---------- bildirim ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, read, created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ---------- check-ins'e yağ % alanı ----------
alter table public.checkins add column if not exists body_fat numeric;

-- =============================================================================
-- Yardımcı: bir session bana mı ait?
-- =============================================================================
create or replace function public.session_is_mine(p_session uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.workout_sessions
    where id = p_session and client_id = auth.uid()
  );
$$;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.workout_sessions enable row level security;
alter table public.set_logs         enable row level security;
alter table public.daily_tasks      enable row level security;
alter table public.meal_checks      enable row level security;
alter table public.water_intake     enable row level security;
alter table public.notifications    enable row level security;
alter table public.push_subscriptions enable row level security;

-- workout_sessions: danışan kendi seanslarını okur/günceller; koç hepsini yönetir
drop policy if exists "sess_read" on public.workout_sessions;
create policy "sess_read" on public.workout_sessions
  for select using (client_id = auth.uid() or public.is_coach());
drop policy if exists "sess_client_update" on public.workout_sessions;
create policy "sess_client_update" on public.workout_sessions
  for update using (client_id = auth.uid() or public.is_coach());
drop policy if exists "sess_coach_write" on public.workout_sessions;
create policy "sess_coach_write" on public.workout_sessions
  for all using (public.is_coach()) with check (public.is_coach());

-- set_logs: seans sahibi danışan + koç
drop policy if exists "setlog_read" on public.set_logs;
create policy "setlog_read" on public.set_logs
  for select using (public.is_coach() or public.session_is_mine(session_id));
drop policy if exists "setlog_client_write" on public.set_logs;
create policy "setlog_client_write" on public.set_logs
  for all using (public.is_coach() or public.session_is_mine(session_id))
  with check (public.is_coach() or public.session_is_mine(session_id));

-- daily_tasks: danışan okur/günceller; koç yönetir
drop policy if exists "task_read" on public.daily_tasks;
create policy "task_read" on public.daily_tasks
  for select using (client_id = auth.uid() or public.is_coach());
drop policy if exists "task_client_update" on public.daily_tasks;
create policy "task_client_update" on public.daily_tasks
  for update using (client_id = auth.uid() or public.is_coach());
drop policy if exists "task_coach_write" on public.daily_tasks;
create policy "task_coach_write" on public.daily_tasks
  for all using (public.is_coach()) with check (public.is_coach());

-- meal_checks: danışan kendi; koç okur
drop policy if exists "mealcheck_all" on public.meal_checks;
create policy "mealcheck_all" on public.meal_checks
  for all using (client_id = auth.uid() or public.is_coach())
  with check (client_id = auth.uid());

-- water_intake: danışan kendi; koç okur
drop policy if exists "water_all" on public.water_intake;
create policy "water_all" on public.water_intake
  for all using (client_id = auth.uid() or public.is_coach())
  with check (client_id = auth.uid());

-- notifications: kullanıcı kendi bildirimlerini okur/günceller; koç başkasına oluşturabilir
drop policy if exists "notif_read" on public.notifications;
create policy "notif_read" on public.notifications
  for select using (user_id = auth.uid());
drop policy if exists "notif_update" on public.notifications;
create policy "notif_update" on public.notifications
  for update using (user_id = auth.uid());
drop policy if exists "notif_insert" on public.notifications;
create policy "notif_insert" on public.notifications
  for insert with check (public.is_coach() or user_id = auth.uid());

-- push_subscriptions: kullanıcı kendi aboneliği
drop policy if exists "push_all" on public.push_subscriptions;
create policy "push_all" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- Storage: egzersiz medyası (public okuma, koç yazma)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

drop policy if exists "exmedia_read" on storage.objects;
create policy "exmedia_read" on storage.objects
  for select using (bucket_id = 'exercise-media');
drop policy if exists "exmedia_coach_write" on storage.objects;
create policy "exmedia_coach_write" on storage.objects
  for insert with check (bucket_id = 'exercise-media' and public.is_coach());

-- =============================================================================
-- Realtime: mesaj ve bildirimleri canlı dinlemek için publication'a ekle
-- =============================================================================
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
