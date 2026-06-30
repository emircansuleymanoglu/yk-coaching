import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notify";

/** Rozeti verir (zaten varsa yok sayar) ve kazanılırsa bildirim gönderir. */
async function award(
  supabase: SupabaseClient,
  clientId: string,
  code: string,
  title: string,
) {
  const { data, error } = await supabase
    .from("badges")
    .insert({ client_id: clientId, code, title })
    .select("id")
    .maybeSingle();
  // unique ihlali (zaten var) → sessizce geç
  if (error) return;
  if (data) {
    await createNotification(supabase, {
      userId: clientId,
      type: "info",
      title: "Yeni rozet kazandın! 🏅",
      body: title,
      link: "/panel",
    });
  }
}

const WORKOUT_MILESTONES: [number, string, string][] = [
  [1, "first_workout", "İlk Antrenman 🎯"],
  [10, "workout_10", "10 Antrenman 🔥"],
  [25, "workout_25", "25 Antrenman 💪"],
  [50, "workout_50", "50 Antrenman 🏆"],
  [100, "workout_100", "100 Antrenman 👑"],
];

/** Tamamlanan antrenman sayısına göre kilometre taşı rozetleri. */
export async function checkWorkoutBadges(
  supabase: SupabaseClient,
  clientId: string,
) {
  const { count } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("status", "completed");
  const total = count ?? 0;
  for (const [n, code, title] of WORKOUT_MILESTONES) {
    if (total >= n) await award(supabase, clientId, code, title);
  }
}

/** Check-in sayısına göre rozet. */
export async function checkCheckinBadges(
  supabase: SupabaseClient,
  clientId: string,
) {
  const { count } = await supabase
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);
  const total = count ?? 0;
  if (total >= 1) await award(supabase, clientId, "checkin_1", "İlk Ölçüm 📏");
  if (total >= 5) await award(supabase, clientId, "checkin_5", "5 Ölçüm 📈");
  if (total >= 10) await award(supabase, clientId, "checkin_10", "10 Ölçüm 📊");
}
