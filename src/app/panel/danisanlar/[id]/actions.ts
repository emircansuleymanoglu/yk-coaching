"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

/** Danışan için boş bir program oluşturur (low + high beslenme planlarıyla). */
export async function createProgramForClient(clientId: string) {
  await requireCoach();
  const supabase = await createClient();

  const { data: program, error } = await supabase
    .from("programs")
    .insert({ client_id: clientId, title: "Yeni Program" })
    .select("id")
    .single();

  if (error || !program) throw new Error(error?.message ?? "Program açılamadı");

  await supabase.from("nutrition_plans").insert([
    { program_id: program.id, day_type: "low", sort: 0 },
    { program_id: program.id, day_type: "high", sort: 1 },
  ]);

  revalidatePath(`/panel/danisanlar/${clientId}`);
  redirect(`/panel/danisanlar/${clientId}/program/${program.id}`);
}

/** Koç bir antrenman gününü danışanın takvimine (bir tarihe) atar. */
export async function assignSession(clientId: string, formData: FormData) {
  await requireCoach();
  const supabase = await createClient();
  const workoutDayId = String(formData.get("workout_day_id") || "");
  const date = String(formData.get("date") || "");
  if (!workoutDayId || !date) return;

  const { data: day } = await supabase
    .from("workout_days")
    .select("program_id")
    .eq("id", workoutDayId)
    .single();

  await supabase.from("workout_sessions").insert({
    client_id: clientId,
    program_id: day?.program_id ?? null,
    workout_day_id: workoutDayId,
    date,
    status: "planned",
  });
  revalidatePath(`/panel/danisanlar/${clientId}`);
}

/** Koç bir danışana günlük görev (kardiyo/alışkanlık) ekler. */
export async function addDailyTask(clientId: string, formData: FormData) {
  await requireCoach();
  const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  if (!title || !date) return;
  await supabase.from("daily_tasks").insert({
    client_id: clientId,
    date,
    title,
    detail: String(formData.get("detail") || "").trim() || null,
    kind: "cardio",
  });
  revalidatePath(`/panel/danisanlar/${clientId}`);
}

export async function deleteSession(clientId: string, sessionId: string) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("workout_sessions").delete().eq("id", sessionId);
  revalidatePath(`/panel/danisanlar/${clientId}`);
}

/** Danışanın ödeme durumunu günceller. */
export async function setPaymentStatus(clientId: string, formData: FormData) {
  await requireCoach();
  const status = String(formData.get("status") || "bekliyor");
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ payment_status: status })
    .eq("id", clientId);
  revalidatePath(`/panel/danisanlar/${clientId}`);
}
