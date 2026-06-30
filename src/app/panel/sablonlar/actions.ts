"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getFullProgram } from "@/lib/queries";
import type { TemplatePayload } from "@/lib/types";

/** Bir programı şablon olarak kaydeder (tam ağacı jsonb olarak saklar). */
export async function saveAsTemplate(
  programId: string,
  clientId: string,
  formData: FormData,
) {
  const coach = await requireCoach();
  const full = await getFullProgram(programId);
  if (!full) return;

  const payload: TemplatePayload = {
    nutrition: full.nutrition.map((p) => ({
      day_type: p.day_type,
      target_kcal: p.target_kcal,
      notes: p.notes,
      meals: p.meals.map((m) => ({
        name: m.name,
        notes: m.notes,
        items: m.items.map((it) => ({
          food_name: it.food_name,
          grams: it.grams,
          protein: it.protein,
          carb: it.carb,
          fat: it.fat,
        })),
      })),
    })),
    supplements: full.supplements.map((s) => ({
      name: s.name,
      serving: s.serving,
      timing: s.timing,
      kind: s.kind,
    })),
    workouts: full.workouts.map((d) => ({
      name: d.name,
      exercises: d.exercises.map((e) => ({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest,
        notes: e.notes,
        image_url: e.image_url,
        video_url: e.video_url,
      })),
    })),
  };

  const title =
    String(formData.get("title") || "").trim() || full.program.title;
  const supabase = await createClient();
  await supabase.from("program_templates").insert({
    coach_id: coach.id,
    title,
    weeks: full.program.weeks,
    payload,
  });
  revalidatePath("/panel/sablonlar");
  revalidatePath(`/panel/danisanlar/${clientId}/program/${programId}`);
}

/** Şablonu bir danışana uygular: yeni program oluşturup tüm içeriği kurar. */
export async function applyTemplate(templateId: string, clientId: string) {
  await requireCoach();
  const supabase = await createClient();

  const { data: tpl } = await supabase
    .from("program_templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (!tpl) return;

  const payload = tpl.payload as TemplatePayload;

  const { data: program } = await supabase
    .from("programs")
    .insert({ client_id: clientId, title: tpl.title, weeks: tpl.weeks })
    .select("id")
    .single();
  if (!program) return;
  const pid = program.id;

  // beslenme
  for (let i = 0; i < payload.nutrition.length; i++) {
    const np = payload.nutrition[i];
    const { data: plan } = await supabase
      .from("nutrition_plans")
      .insert({
        program_id: pid,
        day_type: np.day_type,
        target_kcal: np.target_kcal,
        notes: np.notes,
        sort: i,
      })
      .select("id")
      .single();
    if (!plan) continue;
    for (let m = 0; m < np.meals.length; m++) {
      const meal = np.meals[m];
      const { data: mealRow } = await supabase
        .from("meals")
        .insert({
          nutrition_plan_id: plan.id,
          name: meal.name,
          notes: meal.notes,
          sort: m,
        })
        .select("id")
        .single();
      if (!mealRow || !meal.items.length) continue;
      await supabase.from("meal_items").insert(
        meal.items.map((it, idx) => ({ ...it, meal_id: mealRow.id, sort: idx })),
      );
    }
  }

  // takviye
  if (payload.supplements.length) {
    await supabase.from("supplements").insert(
      payload.supplements.map((s, idx) => ({ ...s, program_id: pid, sort: idx })),
    );
  }

  // antrenman
  for (let d = 0; d < payload.workouts.length; d++) {
    const day = payload.workouts[d];
    const { data: dayRow } = await supabase
      .from("workout_days")
      .insert({ program_id: pid, name: day.name, sort: d })
      .select("id")
      .single();
    if (!dayRow || !day.exercises.length) continue;
    await supabase.from("exercises").insert(
      day.exercises.map((e, idx) => ({
        ...e,
        workout_day_id: dayRow.id,
        sort: idx,
      })),
    );
  }

  revalidatePath(`/panel/danisanlar/${clientId}`);
  redirect(`/panel/danisanlar/${clientId}/program/${pid}`);
}

/** Form'dan (danışan seçimi) şablon uygular. */
export async function applyTemplateForm(templateId: string, formData: FormData) {
  const clientId = String(formData.get("client_id") || "");
  if (!clientId) return;
  await applyTemplate(templateId, clientId);
}

export async function deleteTemplate(templateId: string) {
  await requireCoach();
  const supabase = await createClient();
  await supabase.from("program_templates").delete().eq("id", templateId);
  revalidatePath("/panel/sablonlar");
}
