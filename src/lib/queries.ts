import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Program,
  NutritionPlan,
  Meal,
  MealItem,
  Supplement,
  WorkoutDay,
  Exercise,
} from "@/lib/types";

export type FullNutritionPlan = NutritionPlan & {
  meals: (Meal & { items: MealItem[] })[];
};

export type FullWorkoutDay = WorkoutDay & { exercises: Exercise[] };

export type FullProgram = {
  program: Program;
  nutrition: FullNutritionPlan[];
  supplements: Supplement[];
  workouts: FullWorkoutDay[];
};

/** Bir danışanın en güncel programını getirir (yoksa null). */
export async function getActiveProgram(
  clientId: string,
): Promise<Program | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Program) ?? null;
}

/** Programın tüm detaylarını (beslenme/öğün/besin, supplement, antrenman) getirir. */
export async function getFullProgram(
  programId: string,
): Promise<FullProgram | null> {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programId)
    .single();
  if (!program) return null;

  const [{ data: plans }, { data: supplements }, { data: days }] =
    await Promise.all([
      supabase
        .from("nutrition_plans")
        .select("*")
        .eq("program_id", programId)
        .order("sort"),
      supabase
        .from("supplements")
        .select("*")
        .eq("program_id", programId)
        .order("sort"),
      supabase
        .from("workout_days")
        .select("*")
        .eq("program_id", programId)
        .order("sort"),
    ]);

  const planIds = (plans ?? []).map((p) => p.id);
  const dayIds = (days ?? []).map((d) => d.id);

  const [{ data: meals }, { data: exercises }] = await Promise.all([
    planIds.length
      ? supabase
          .from("meals")
          .select("*")
          .in("nutrition_plan_id", planIds)
          .order("sort")
      : Promise.resolve({ data: [] as Meal[] }),
    dayIds.length
      ? supabase
          .from("exercises")
          .select("*")
          .in("workout_day_id", dayIds)
          .order("sort")
      : Promise.resolve({ data: [] as Exercise[] }),
  ]);

  const mealIds = (meals ?? []).map((m) => m.id);
  const { data: items } = mealIds.length
    ? await supabase.from("meal_items").select("*").in("meal_id", mealIds).order("sort")
    : { data: [] as MealItem[] };

  const nutrition: FullNutritionPlan[] = (plans ?? []).map((plan) => ({
    ...(plan as NutritionPlan),
    meals: (meals ?? [])
      .filter((m) => m.nutrition_plan_id === plan.id)
      .map((m) => ({
        ...(m as Meal),
        items: (items ?? []).filter((it) => it.meal_id === m.id),
      })),
  }));

  const workouts: FullWorkoutDay[] = (days ?? []).map((d) => ({
    ...(d as WorkoutDay),
    exercises: (exercises ?? []).filter((e) => e.workout_day_id === d.id),
  }));

  return {
    program: program as Program,
    nutrition,
    supplements: (supplements ?? []) as Supplement[],
    workouts,
  };
}
