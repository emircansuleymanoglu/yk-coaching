// Veritabanı tablolarına karşılık gelen uygulama tipleri.

export type UserRole = "coach" | "client";
export type DayType = "low" | "high";
export type SuppKind = "vitamin" | "supplement";
export type PaymentStatus = "bekliyor" | "odendi" | "gecikti";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  goal: string | null;
  subscription_end: string | null;
  payment_status: PaymentStatus;
  created_at: string;
};

export type Program = {
  id: string;
  client_id: string;
  title: string;
  weeks: number;
  control_date: string | null;
  next_control: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type NutritionPlan = {
  id: string;
  program_id: string;
  day_type: DayType;
  target_kcal: number | null;
  notes: string | null;
  sort: number;
};

export type Meal = {
  id: string;
  nutrition_plan_id: string;
  name: string;
  notes: string | null;
  sort: number;
};

export type MealItem = {
  id: string;
  meal_id: string;
  food_name: string;
  grams: number;
  protein: number;
  carb: number;
  fat: number;
  sort: number;
};

export type Supplement = {
  id: string;
  program_id: string;
  name: string;
  serving: string | null;
  timing: string | null;
  kind: SuppKind;
  sort: number;
};

export type WorkoutDay = {
  id: string;
  program_id: string;
  name: string;
  sort: number;
};

export type Exercise = {
  id: string;
  workout_day_id: string;
  name: string;
  sets: string | null;
  reps: string | null;
  rest: string | null;
  notes: string | null;
  sort: number;
};

export type Checkin = {
  id: string;
  client_id: string;
  date: string;
  weight: number | null;
  measurements: Record<string, number> | null;
  photo_urls: string[];
  notes: string | null;
  coach_comment: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
};

export type Payment = {
  id: string;
  client_id: string;
  period: string;
  amount: number | null;
  status: PaymentStatus;
  note: string | null;
  created_at: string;
};
