"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkWorkoutBadges } from "@/lib/gamify";

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Danışan bir setin reps/kilo değerini kaydeder veya işaretler (upsert). */
export async function saveSetLog(input: {
  sessionId: string;
  exerciseId: string | null;
  exerciseName: string;
  setNo: number;
  reps: number | null;
  weight: number | null;
  done: boolean;
  logId?: string | null;
}) {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Oturum yok" };

  if (input.logId) {
    await supabase
      .from("set_logs")
      .update({
        reps: input.reps,
        weight: input.weight,
        done: input.done,
      })
      .eq("id", input.logId);
  } else {
    await supabase.from("set_logs").insert({
      session_id: input.sessionId,
      exercise_id: input.exerciseId,
      exercise_name: input.exerciseName,
      set_no: input.setNo,
      reps: input.reps,
      weight: input.weight,
      done: input.done,
    });
  }
  return { ok: true };
}

export async function deleteSetLog(logId: string) {
  const { supabase } = await currentUser();
  await supabase.from("set_logs").delete().eq("id", logId);
  return { ok: true };
}

/** Seansı tamamlandı olarak işaretler. */
export async function completeSession(sessionId: string, date: string) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase
    .from("workout_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("client_id", user.id);
  await checkWorkoutBadges(supabase, user.id);
  revalidatePath(`/panel/takvim/${date}`);
  revalidatePath("/panel/takvim");
  revalidatePath("/panel");
}

export async function reopenSession(sessionId: string, date: string) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase
    .from("workout_sessions")
    .update({ status: "planned", completed_at: null })
    .eq("id", sessionId)
    .eq("client_id", user.id);
  revalidatePath(`/panel/takvim/${date}`);
  revalidatePath("/panel/takvim");
}
