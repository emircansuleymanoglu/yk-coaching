"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

function str(fd: FormData, key: string) {
  return String(fd.get(key) || "").trim();
}
function num(fd: FormData, key: string) {
  const v = parseFloat(String(fd.get(key) || "0").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
}

async function revalidate(fd: FormData) {
  const clientId = str(fd, "client_id");
  const programId = str(fd, "program_id");
  revalidatePath(`/panel/danisanlar/${clientId}/program/${programId}`);
}

/* --------------------------- Program bilgisi --------------------------- */
export async function updateProgramMeta(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase
    .from("programs")
    .update({
      title: str(fd, "title") || "Program",
      weeks: Math.max(1, Math.round(num(fd, "weeks")) || 8),
      control_date: str(fd, "control_date") || null,
      next_control: str(fd, "next_control") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", str(fd, "program_id"));
  await revalidate(fd);
}

/* --------------------------- Öğün / besin --------------------------- */
export async function addMeal(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("meals").insert({
    nutrition_plan_id: str(fd, "plan_id"),
    name: str(fd, "name") || "Yeni Öğün",
    sort: Math.round(num(fd, "sort")),
  });
  await revalidate(fd);
}

export async function deleteMeal(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("meals").delete().eq("id", str(fd, "meal_id"));
  await revalidate(fd);
}

export async function addMealItem(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("meal_items").insert({
    meal_id: str(fd, "meal_id"),
    food_name: str(fd, "food_name") || "Besin",
    grams: num(fd, "grams"),
    protein: num(fd, "protein"),
    carb: num(fd, "carb"),
    fat: num(fd, "fat"),
  });
  await revalidate(fd);
}

export async function deleteMealItem(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("meal_items").delete().eq("id", str(fd, "item_id"));
  await revalidate(fd);
}

export async function setNutritionTarget(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase
    .from("nutrition_plans")
    .update({ target_kcal: Math.round(num(fd, "target_kcal")) || null })
    .eq("id", str(fd, "plan_id"));
  await revalidate(fd);
}

/* --------------------------- Takviye --------------------------- */
export async function addSupplement(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("supplements").insert({
    program_id: str(fd, "program_id"),
    name: str(fd, "name") || "Takviye",
    serving: str(fd, "serving") || null,
    timing: str(fd, "timing") || null,
    kind: str(fd, "kind") === "vitamin" ? "vitamin" : "supplement",
  });
  await revalidate(fd);
}

export async function deleteSupplement(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("supplements").delete().eq("id", str(fd, "supp_id"));
  await revalidate(fd);
}

/* --------------------------- Antrenman --------------------------- */
export async function addWorkoutDay(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("workout_days").insert({
    program_id: str(fd, "program_id"),
    name: str(fd, "name") || "Yeni Gün",
    sort: Math.round(num(fd, "sort")),
  });
  await revalidate(fd);
}

export async function deleteWorkoutDay(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("workout_days").delete().eq("id", str(fd, "day_id"));
  await revalidate(fd);
}

export async function addExercise(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("exercises").insert({
    workout_day_id: str(fd, "day_id"),
    name: str(fd, "name") || "Egzersiz",
    sets: str(fd, "sets") || null,
    reps: str(fd, "reps") || null,
    rest: str(fd, "rest") || null,
    notes: str(fd, "notes") || null,
  });
  await revalidate(fd);
}

export async function deleteExercise(fd: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("exercises").delete().eq("id", str(fd, "ex_id"));
  await revalidate(fd);
}
