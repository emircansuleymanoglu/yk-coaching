-- =============================================================================
-- YK COACHING — Faz 3 şeması (program şablonları, rozetler/streak, hatırlatma logu)
-- Idempotent.
-- =============================================================================

-- ---------- Program şablonları ----------
create table if not exists public.program_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  weeks int not null default 8,
  payload jsonb not null,          -- programın tam ağacı (beslenme/antrenman/takviye)
  created_at timestamptz not null default now()
);
create index if not exists idx_templates_coach on public.program_templates(coach_id);

-- ---------- Rozetler (gamification) ----------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,              -- 'first_workout','streak_7','checkin_5' vb.
  title text not null,
  earned_at timestamptz not null default now(),
  unique (client_id, code)
);
create index if not exists idx_badges_client on public.badges(client_id);

-- ---------- Hatırlatma logu (aynı gün ikinci kez göndermemek için) ----------
create table if not exists public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,              -- 'workout_today','control_soon' vb.
  date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, kind, date)
);

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.program_templates enable row level security;
alter table public.badges            enable row level security;
alter table public.reminder_log      enable row level security;

drop policy if exists "tpl_coach_all" on public.program_templates;
create policy "tpl_coach_all" on public.program_templates
  for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists "badge_read" on public.badges;
create policy "badge_read" on public.badges
  for select using (client_id = auth.uid() or public.is_coach());
drop policy if exists "badge_write" on public.badges;
create policy "badge_write" on public.badges
  for all using (client_id = auth.uid() or public.is_coach())
  with check (client_id = auth.uid() or public.is_coach());

drop policy if exists "reminder_read" on public.reminder_log;
create policy "reminder_read" on public.reminder_log
  for select using (user_id = auth.uid() or public.is_coach());
drop policy if exists "reminder_write" on public.reminder_log;
create policy "reminder_write" on public.reminder_log
  for all using (public.is_coach() or user_id = auth.uid())
  with check (public.is_coach() or user_id = auth.uid());
