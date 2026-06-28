import Link from "next/link";
import { startOfWeek, endOfWeek, addDays, format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Dumbbell, Flame, Check, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export default async function TakvimPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const profile = await requireProfile();
  if (profile.role === "coach") {
    return (
      <Card className="py-10 text-center text-sm text-[var(--muted)]">
        Takvim danışan içindir. Antrenman planlamayı “Danışanlar → danışan” sayfasından yap.
      </Card>
    );
  }

  const offset = parseInt((await searchParams).w ?? "0", 10) || 0;
  const base = addDays(new Date(), offset * 7);
  const weekStart = startOfWeek(base, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(base, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const supabase = await createClient();
  const [{ data: sessions }, { data: tasks }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, date, status, workout_days(name)")
      .eq("client_id", profile.id)
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd")),
    supabase
      .from("daily_tasks")
      .select("id, date, title, done, kind")
      .eq("client_id", profile.id)
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd")),
  ]);

  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Takvim</h1>
        <div className="flex gap-1.5 text-sm">
          <Link
            href={`/panel/takvim?w=${offset - 1}`}
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-[var(--muted)]"
          >
            ‹
          </Link>
          <Link
            href={`/panel/takvim?w=0`}
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-[var(--muted)]"
          >
            Bugün
          </Link>
          <Link
            href={`/panel/takvim?w=${offset + 1}`}
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-[var(--muted)]"
          >
            ›
          </Link>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        {format(weekStart, "d MMM", { locale: tr })} –{" "}
        {format(weekEnd, "d MMM yyyy", { locale: tr })}
      </p>

      <div className="space-y-3">
        {days.map((d) => {
          const dISO = format(d, "yyyy-MM-dd");
          const daySessions = (sessions ?? []).filter((s) => s.date === dISO);
          const dayTasks = (tasks ?? []).filter((t) => t.date === dISO);
          const isToday = isSameDay(d, today);
          const empty = !daySessions.length && !dayTasks.length;

          return (
            <div key={dISO}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-[var(--primary-glow)]" : "text-[var(--muted)]",
                  )}
                >
                  {format(d, "EEEE, d MMM", { locale: tr })}
                </span>
                {isToday && <Badge tone="primary">Bugün</Badge>}
              </div>

              {empty ? (
                <p className="px-1 text-xs text-[var(--muted)]">—</p>
              ) : (
                <div className="space-y-2">
                  {daySessions.map((s) => {
                    const name =
                      (s as { workout_days?: { name?: string } | null })
                        .workout_days?.name ?? "Antrenman";
                    const done = s.status === "completed";
                    return (
                      <Link key={s.id} href={`/panel/takvim/${dISO}`}>
                        <Card className="flex items-center justify-between hover:border-[var(--primary)]/50">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "grid h-10 w-10 place-items-center rounded-xl",
                                done
                                  ? "bg-[var(--success)]/15 text-[var(--success)]"
                                  : "bg-[var(--primary)]/15 text-[var(--primary-glow)]",
                              )}
                            >
                              {done ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <Dumbbell className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-xs text-[var(--muted)]">
                                {done ? "Tamamlandı" : "Planlandı"}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                        </Card>
                      </Link>
                    );
                  })}
                  {dayTasks.map((t) => (
                    <Card key={t.id} className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
                        <Flame className="h-5 w-5" />
                      </div>
                      <p
                        className={cn(
                          "font-medium",
                          t.done && "text-[var(--muted)] line-through",
                        )}
                      >
                        {t.title}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
