"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Danışan günlük görevi (kardiyo/alışkanlık) tamamlandı olarak işaretler. */
export async function toggleDailyTask(taskId: string, done: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("daily_tasks")
    .update({ done })
    .eq("id", taskId)
    .eq("client_id", user.id);
  revalidatePath("/panel");
}
