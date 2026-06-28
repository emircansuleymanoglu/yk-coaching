import Link from "next/link";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { Users, FileText, Plus, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { Button, Card } from "@/components/ui";
import type { DailyTask, Profile } from "@/lib/types";

export default async function PanelHome() {
  const profile = await requireProfile();
  if (profile.role === "coach") return <CoachDashboard />;
  return <ClientHome profile={profile} />;
}

/* ----------------------------- Koç paneli ----------------------------- */
async function CoachDashboard() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, payment_status")
    .eq("role", "client")
    .order("created_at", { ascending: false });
  const { count: programCount } = await supabase
    .from("programs")
    .select("id", { count: "exact", head: true });

  const list = clients ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Hoş geldin, Koç 💪</h1>
        <p className="text-sm text-[var(--muted)]">İşte bugünkü özetin.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="space-y-1">
          <Users className="h-5 w-5 text-[var(--primary-glow)]" />
          <p className="text-2xl font-bold">{list.length}</p>
          <p className="text-xs text-[var(--muted)]">Danışan</p>
        </Card>
        <Card className="space-y-1">
          <FileText className="h-5 w-5 text-[var(--accent)]" />
          <p className="text-2xl font-bold">{programCount ?? 0}</p>
          <p className="text-xs text-[var(--muted)]">Program</p>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Danışanlar</h2>
        <Link href="/panel/danisanlar">
          <Button variant="ghost" size="sm">
            Tümü <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {list.slice(0, 5).map((c) => (
          <Link key={c.id} href={`/panel/danisanlar/${c.id}`}>
            <Card className="flex items-center justify-between hover:border-[var(--primary)]/50">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-2)] font-semibold">
                  {initials(c.full_name)}
                </div>
                <span className="font-medium">{c.full_name || "İsimsiz"}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
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
