import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, CalendarX } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { WorkoutLogger } from "@/components/workout/WorkoutLogger";
import { Card } from "@/components/ui";
import type { Exercise } from "@/lib/types";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const profile = await requireProfile();
  const { date } = await params;
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, status, workout_day_id, workout_days(name)")
    .eq("client_id", profile.id)
    .eq("date", date)
    .order("created_at");

  const list = sessions ?? [];

  // her seans için egzersizler + mevcut loglar
  const enriched = await Promise.all(
    list.map(async (s) => {
      const [{ data: exercises }, { data: logs }] = await Promise.all([
        s.workout_day_id
          ? supabase
              .from("exercises")
              .select("*")
              .eq("workout_day_id", s.workout_day_id)
              .order("sort")
          : Promise.resolve({ data: [] as Exercise[] }),
        supabase
          .from("set_logs")
          .select("id, exercise_id, set_no, reps, weight, done")
          .eq("session_id", s.id),
      ]);
      return { session: s, exercises: (exercises ?? []) as Exercise[], logs: logs ?? [] };
    }),
  );

  const prettyDate = format(new Date(date + "T00:00:00"), "d MMMM EEEE", {
    locale: tr,
  });

  return (
    <div className="space-y-4">
      <Link
        href="/panel/takvim"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)]"
      >
        <ArrowLeft className="h-4 w-4" /> Takvim
      </Link>
      <h1 className="text-xl font-bold capitalize">{prettyDate}</h1>

      {!enriched.length && (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <CalendarX className="h-8 w-8 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">
            Bu gün için planlanmış antrenman yok.
          </p>
        </Card>
      )}

      {enriched.map(({ session, exercises, logs }) => {
        const name =
          (session as { workout_days?: { name?: string } | null }).workout_days
            ?.name ?? "Antrenman";
        return (
          <div key={session.id} className="space-y-2">
            <h2 className="font-semibold text-[var(--primary-glow)]">{name}</h2>
            <WorkoutLogger
              sessionId={session.id}
              date={date}
              status={session.status}
              exercises={exercises.map((e) => ({
                id: e.id,
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest: e.rest,
                image_url: e.image_url,
                video_url: e.video_url,
              }))}
              existing={logs}
            />
          </div>
        );
      })}
    </div>
  );
}
