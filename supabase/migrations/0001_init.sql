-- =============================================================================
-- YK COACHING — Veritabanı şeması + güvenlik (RLS)
-- Supabase SQL Editor'de tek seferde çalıştırın.
-- =============================================================================

-- ---------- ENUM'lar ----------
do $$ begin
  create type user_role as enum ('coach', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type day_type as enum ('low', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type supp_kind as enum ('vitamin', 'supplement');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('bekliyor', 'odendi', 'gecikti');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'client',
  phone text,
  avatar_url text,
  goal text,                         -- danışan hedefi (kilo alma/verme vb.)
  subscription_end date,             -- abonelik bitiş tarihi (manuel)
  payment_status payment_status not null default 'bekliyor',
  created_at timestamptz not null default now()
);

-- ---------- programs ----------
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Program',
  weeks int not null default 8,
  control_date date,                 -- kontrol günü
  next_control date,                 -- gelecek kontrol
  status text not null default 'aktif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_programs_client on public.programs(client_id);

-- ---------- nutrition_plans (low / high days) ----------
create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  day_type day_type not null default 'low',
  target_kcal int,
  notes text,
  sort int not null default 0
);
create index if not exists idx_nutrition_program on public.nutrition_plans(program_id);

-- ---------- meals ----------
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  nutrition_plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  name text not null,                -- Öğün 1 / Antrenman Öncesi / Sonrası vb.
  notes text,
  sort int not null default 0
);
create index if not exists idx_meals_plan on public.meals(nutrition_plan_id);

-- ---------- meal_items (kcal app tarafında hesaplanır) ----------
create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_name text not null,
  grams numeric not null default 0,
  protein numeric not null default 0,
  carb numeric not null default 0,
  fat numeric not null default 0,
  sort int not null default 0
);
create index if not exists idx_items_meal on public.meal_items(meal_id);

-- ---------- supplements & vitamins ----------
create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,
  serving text,                      -- 1 servis / 5 gr vb.
  timing text,                       -- sabah / antrenman esnasında vb.
  kind supp_kind not null default 'supplement',
  sort int not null default 0
);
create index if not exists idx_supp_program on public.supplements(program_id);

-- ---------- workout_days ----------
create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,                -- Gün 1 Pull A vb.
  sort int not null default 0
);
create index if not exists idx_wdays_program on public.workout_days(program_id);

-- ---------- exercises ----------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  name text not null,
  sets text,                         -- "2 work + 1 back-off" gibi serbest metin
  reps text,                         -- "8-10" / "yanana kadar"
  rest text,                         -- "70 saniye"
  notes text,
  sort int not null default 0
);
create index if not exists idx_ex_day on public.exercises(workout_day_id);

-- ---------- checkins (danışan takibi) ----------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  weight numeric,
  measurements jsonb,                -- {bel, kol, gogus...}
  photo_urls text[] default '{}',
  notes text,                        -- danışan notu
  coach_comment text,                -- koç geri bildirimi
  created_at timestamptz not null default now()
);
create index if not exists idx_checkins_client on public.checkins(client_id, date desc);

-- ---------- messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_msg_pair on public.messages(sender_id, recipient_id, created_at);

-- ---------- payments (havale — manuel takip) ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  period text not null,              -- "2026-07" gibi dönem
  amount numeric,
  status payment_status not null default 'bekliyor',
  note text,                         -- havale referansı / açıklama
  created_at timestamptz not null default now()
);
create index if not exists idx_pay_client on public.payments(client_id);

-- =============================================================================
-- Yardımcı: oturum açan kullanıcı koç mu?
-- =============================================================================
create or replace function public.is_coach()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach'
  );
$$;

-- Bir programın sahibi danışan mı? (RLS alt sorguları için)
create or replace function public.program_belongs_to_me(p_program uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.programs
    where id = p_program and client_id = auth.uid()
  );
$$;

-- =============================================================================
-- Yeni kullanıcı kaydında otomatik profil oluştur
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.profiles        enable row level security;
alter table public.programs        enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.meals           enable row level security;
alter table public.meal_items      enable row level security;
alter table public.supplements     enable row level security;
alter table public.workout_days    enable row level security;
alter table public.exercises       enable row level security;
alter table public.checkins        enable row level security;
alter table public.messages        enable row level security;
alter table public.payments        enable row level security;

-- NOT: Politikalar `drop ... if exists` ile önce silinir; böylece bu dosya
-- birden çok kez sorunsuz çalıştırılabilir (idempotent).

-- profiles: herkes kendi profilini görür/günceller; koç hepsini yönetir
drop policy if exists "profil_self_select" on public.profiles;
create policy "profil_self_select" on public.profiles
  for select using (id = auth.uid() or public.is_coach() or role = 'coach');
drop policy if exists "profil_self_update" on public.profiles;
create policy "profil_self_update" on public.profiles
  for update using (id = auth.uid() or public.is_coach());
drop policy if exists "profil_coach_insert" on public.profiles;
create policy "profil_coach_insert" on public.profiles
  for insert with check (public.is_coach() or id = auth.uid());

-- programs: danışan kendi programını okur; koç tümünü yönetir
drop policy if exists "program_read" on public.programs;
create policy "program_read" on public.programs
  for select using (client_id = auth.uid() or public.is_coach());
drop policy if exists "program_coach_write" on public.programs;
create policy "program_coach_write" on public.programs
  for all using (public.is_coach()) with check (public.is_coach());

-- Program'a bağlı tüm alt tablolar için ortak desen:
-- danışan okuyabilir, koç her şeyi yapabilir
drop policy if exists "nutrition_read" on public.nutrition_plans;
create policy "nutrition_read" on public.nutrition_plans
  for select using (public.program_belongs_to_me(program_id) or public.is_coach());
drop policy if exists "nutrition_coach_write" on public.nutrition_plans;
create policy "nutrition_coach_write" on public.nutrition_plans
  for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists "meals_read" on public.meals;
create policy "meals_read" on public.meals
  for select using (
    public.is_coach() or exists (
      select 1 from public.nutrition_plans np
      where np.id = nutrition_plan_id and public.program_belongs_to_me(np.program_id)
    )
  );
drop policy if exists "meals_coach_write" on public.meals;
create policy "meals_coach_write" on public.meals
  for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists "items_read" on public.meal_items;
create policy "items_read" on public.meal_items
  for select using (
    public.is_coach() or exists (
      select 1 from public.meals m
      join public.nutrition_plans np on np.id = m.nutrition_plan_id
      where m.id = meal_id and public.program_belongs_to_me(np.program_id)
    )
  );
drop policy if exists "items_coach_write" on public.meal_items;
create policy "items_coach_write" on public.meal_items
  for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists "supp_read" on public.supplements;
create policy "supp_read" on public.supplements
  for select using (public.program_belongs_to_me(program_id) or public.is_coach());
drop policy if exists "supp_coach_write" on public.supplements;
create policy "supp_coach_write" on public.supplements
  for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists "wdays_read" on public.workout_days;
create policy "wdays_read" on public.workout_days
  for select using (public.program_belongs_to_me(program_id) or public.is_coach());
drop policy if exists "wdays_coach_write" on public.workout_days;
create policy "wdays_coach_write" on public.workout_days
  for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists "ex_read" on public.exercises;
create policy "ex_read" on public.exercises
  for select using (
    public.is_coach() or exists (
      select 1 from public.workout_days wd
      where wd.id = workout_day_id and public.program_belongs_to_me(wd.program_id)
    )
  );
drop policy if exists "ex_coach_write" on public.exercises;
create policy "ex_coach_write" on public.exercises
  for all using (public.is_coach()) with check (public.is_coach());

-- checkins: danışan kendi check-in'ini oluşturur/okur/günceller; koç hepsini görür/yorumlar
drop policy if exists "checkin_read" on public.checkins;
create policy "checkin_read" on public.checkins
  for select using (client_id = auth.uid() or public.is_coach());
drop policy if exists "checkin_client_insert" on public.checkins;
create policy "checkin_client_insert" on public.checkins
  for insert with check (client_id = auth.uid());
drop policy if exists "checkin_update" on public.checkins;
create policy "checkin_update" on public.checkins
  for update using (client_id = auth.uid() or public.is_coach());

-- messages: yalnızca gönderen veya alıcı
drop policy if exists "msg_read" on public.messages;
create policy "msg_read" on public.messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "msg_send" on public.messages;
create policy "msg_send" on public.messages
  for insert with check (sender_id = auth.uid());
drop policy if exists "msg_mark_read" on public.messages;
create policy "msg_mark_read" on public.messages
  for update using (recipient_id = auth.uid() or public.is_coach());

-- payments: danışan kendi ödemelerini okur; koç yönetir
drop policy if exists "pay_read" on public.payments;
create policy "pay_read" on public.payments
  for select using (client_id = auth.uid() or public.is_coach());
drop policy if exists "pay_coach_write" on public.payments;
create policy "pay_coach_write" on public.payments
  for all using (public.is_coach()) with check (public.is_coach());

-- =============================================================================
-- Storage: check-in fotoğrafları için bucket (panelden de oluşturulabilir)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

drop policy if exists "checkin_photos_read" on storage.objects;
create policy "checkin_photos_read" on storage.objects
  for select using (
    bucket_id = 'checkin-photos'
    and (public.is_coach() or owner = auth.uid())
  );
drop policy if exists "checkin_photos_upload" on storage.objects;
create policy "checkin_photos_upload" on storage.objects
  for insert with check (
    bucket_id = 'checkin-photos' and owner = auth.uid()
  );
