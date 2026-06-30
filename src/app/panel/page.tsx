import Link from "next/link";
import { startOfWeek, endOfWeek, format, differenceInCalendarDays } from "date-fns";
import {
  Users,
  Plus,
  ChevronRight,
  Activity,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { Badge, Button, Card } from "@/components/ui";
import type { DailyTask, Profile } from "@/lib/types";

export default async function PanelHome() {
  const profile = await requireProfile();
  if (profile.role === "coach") return <CoachDashboard />;
  return <ClientHome profile={profile} />;
}

/* ----------------------------- Koç paneli ----------------------------- */
async function CoachDashboard() {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [{ data: clients }, { data: sessions }, { data: checkins }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, payment_status")
        .eq("role", "client")
        .order("full_name"),
      supabase
        .from("workout_sessions")
        .select("client_id, date")
        .eq("status", "completed"),
      supabase.from("checkins").select("client_id, date"),
    ]);

  const list = clients ?? [];

  // her danışan için son aktivite + bu hafta tamamlanan
  const lastActivity = new Map<string, string>();
  const weekDone = new Map<string, number>();
  for (const s of sessions ?? []) {
    if (!lastActivity.get(s.client_id) || s.date > lastActivity.get(s.client_id)!)
      lastActivity.set(s.client_id, s.date);
    if (s.date >= weekStart)
      weekDone.set(s.client_id, (weekDone.get(s.client_id) ?? 0) + 1);
  }
  for (const c of checkins ?? []) {
    if (!lastActivity.get(c.client_id) || c.date > lastActivity.get(c.client_id)!)
      lastActivity.set(c.client_id, c.date);
  }

  const enriched = list.map((c) => {
    const last = lastActivity.get(c.id) ?? null;
    const days = last ? differenceInCalendarDays(now, new Date(last)) : null;
    const status: "active" | "quiet" | "risk" =
      days === null || days > 7 ? "risk" : days <= 3 ? "active" : "quiet";
    return { ...c, last, days, status, week: weekDone.get(c.id) ?? 0 };
  });

  const activeCount = enriched.filter((e) => e.week > 0).length;
  const riskCount = enriched.filter((e) => e.status === "risk").length;
  const pendingPay = enriched.filter(
    (e) => e.payment_status !== "odendi",
  ).length;

  const atRisk = enriched.filter((e) => e.status === "risk");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Hoş geldin, Koç 💪</h1>
        <p className="text-sm text-[var(--muted)]">İşte bu haftanın özeti.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          value={list.length}
          label="Danışan"
          tone="primary"
        />
        <StatCard
          icon={Activity}
          value={activeCount}
          label="Bu hafta aktif"
          tone="success"
        />
        <StatCard
          icon={AlertTriangle}
          value={riskCount}
          label="Risk altında"
          tone="danger"
        />
      </div>

      {atRisk.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-1.5 font-semibold text-[var(--warning)]">
            <AlertTriangle className="h-4 w-4" /> İlgilenmen gerekenler
          </h2>
          {atRisk.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/panel/danisanlar/${c.id}`}>
              <Card className="flex items-center justify-between border-[var(--warning)]/30 hover:border-[var(--warning)]/60">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-2)] font-semibold">
                    {initials(c.full_name)}
                  </div>
                  <div>
                    <p className="font-medium">{c.full_name || "İsimsiz"}</p>
                    <p className="text-xs text-[var(--warning)]">
                      {c.days === null
                        ? "Hiç aktivite yok"
                        : `${c.days} gündür sessiz`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Tüm Danışanlar</h2>
        {pendingPay > 0 && (
          <span className="flex items-center gap-1 text-xs text-[var(--warning)]">
            <Wallet className="h-3.5 w-3.5" /> {pendingPay} ödeme bekliyor
          </span>
        )}
      </div>

      <div className="space-y-2">
        {enriched.map((c) => (
          <Link key={c.id} href={`/panel/danisanlar/${c.id}`}>
            <Card className="flex items-center justify-between hover:border-[var(--primary)]/50">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-2)] font-semibold">
                  {initials(c.full_name)}
                </div>
                <div>
                  <span className="font-medium">{c.full_name || "İsimsiz"}</span>
                  <p className="text-xs text-[var(--muted)]">
                    Bu hafta {c.week} antrenman
                  </p>
                </div>
              </div>
              <StatusDot status={c.status} />
            </Card>
          </Link>
        ))}
        {!list.length && (
          <Card className="py-8 text-center text-sm text-[var(--muted)]">
            Henüz danışan yok. İlk danışanını ekleyerek başla.
          </Card>
        )}
      </div>

      <Link href="/panel/danisanlar/yeni">
        <Button size="lg" className="w-full">
          <Plus className="h-4 w-4" /> Yeni Danışan Ekle
        </Button>
      </Link>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  tone: "primary" | "success" | "danger";
}) {
  const color = {
    primary: "text-[var(--primary-glow)]",
    success: "text-[var(--success)]",
    danger: "text-[var(--danger)]",
  }[tone];
  return (
    <Card className="space-y-1">
      <Icon className={`h-5 w-5 ${color}`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] leading-tight text-[var(--muted)]">{label}</p>
    </Card>
  );
}

function StatusDot({ status }: { status: "active" | "quiet" | "risk" }) {
  const map = {
    active: { tone: "success" as const, label: "Aktif" },
    quiet: { tone: "warning" as const, label: "Sessiz" },
    risk: { tone: "danger" as const, label: "Risk" },
  };
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/* ----------------------------- Danışan ana ekranı ----------------------------- */
async function ClientHome({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const now = new Date();
  const todayISO = format(now, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [
    { data: latestCheckin },
    { data: program },
    { count: weekDoneCount },
    { data: todaySession },
    { data: todayTasks },
    { count: totalWorkouts },
    { data: badges },
  ] = await Promise.all([
    supabase
      .from("checkins")
      .select("weight, body_fat")
      .eq("client_id", profile.id)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("programs")
      .select("next_control")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("client_id", profile.id)
      .eq("status", "completed")
      .gte("date", weekStart)
      .lte("date", weekEnd),
    supabase
      .from("workout_sessions")
      .select("id, workout_day_id, status, workout_days(name)")
      .eq("client_id", profile.id)
      .eq("date", todayISO)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_tasks")
      .select("*")
      .eq("client_id", profile.id)
      .eq("date", todayISO)
      .order("created_at"),
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("client_id", profile.id)
      .eq("status", "completed"),
    supabase
      .from("badges")
      .select("code, title")
      .eq("client_id", profile.id)
      .order("earned_at", { ascending: false }),
  ]);

  const sessionLabel =
    todaySession && (todaySession as { workout_days?: { name?: string } | null })
      ? ((todaySession as { workout_days?: { name?: string } | null }).workout_days
          ?.name ?? "Antrenman")
      : null;

  return (
    <HomeDashboard
      name={profile.full_name}
      todayISO={todayISO}
      weekDoneCount={weekDoneCount ?? 0}
      latest={
        latestCheckin
          ? {
              weight: latestCheckin.weight ?? null,
              body_fat: latestCheckin.body_fat ?? null,
            }
          : null
      }
      nextControl={program?.next_control ?? null}
      todaySessionLabel={sessionLabel}
      todayTasks={(todayTasks ?? []) as DailyTask[]}
      totalWorkouts={totalWorkouts ?? 0}
      badges={(badges ?? []).map((b) => b.title)}
    />
  );
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
