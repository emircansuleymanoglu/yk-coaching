"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Danışan bir öğünü "yedim/yemedim" olarak işaretler (bugün için). */
export async function toggleMealCheck(mealId: string, date: string, done: boolean) {
  const { supabase, user } = await me();
  if (!user) return;
  await supabase
    .from("meal_checks")
    .upsert(
      { client_id: user.id, meal_id: mealId, date, done },
      { onConflict: "client_id,meal_id,date" },
    );
  revalidatePath("/panel/program");
  revalidatePath("/panel");
}

/** Su tüketimini delta kadar artırır/azaltır (ml). */
export async function addWater(date: string, deltaMl: number, targetMl: number) {
  const { supabase, user } = await me();
  if (!user) return;
  const { data: existing } = await supabase
    .from("water_intake")
    .select("ml")
    .eq("client_id", user.id)
    .eq("date", date)
    .maybeSingle();
  const next = Math.max(0, (existing?.ml ?? 0) + deltaMl);
  await supabase
    .from("water_intake")
    .upsert(
      { client_id: user.id, date, ml: next, target_ml: targetMl },
      { onConflict: "client_id,date" },
    );
  revalidatePath("/panel/program");
}
