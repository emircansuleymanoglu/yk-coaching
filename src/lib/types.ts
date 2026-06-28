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
  // Faz 2 — kişisel bilgiler
  activity_level: string | null;
  sex: string | null;
  height_cm: number | null;
  birthday: string | null;
  country: string | null;
  city: string | null;
  units: string;
  timezone: string | null;
};

export type SessionStatus = "planned" | "completed" | "skipped";
export type TaskKind = "cardio" | "habit";

export type WorkoutSession = {
  id: string;
  client_id: string;
  program_id: string | null;
  workout_day_id: string | null;
  date: string;
  status: SessionStatus;
  duration_min: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
};

export type SetLog = {
  id: string;
  session_id: string;
  exercise_id: string | null;
  exercise_name: string | null;
  set_no: number;
  reps: number | null;
  weight: number | null;
  done: boolean;
  created_at: string;
};

export type DailyTask = {
  id: string;
  client_id: string;
  date: string;
  title: string;
  detail: string | null;
  kind: TaskKind;
  target: string | null;
  done: boolean;
  created_at: string;
};

export type MealCheck = {
  id: string;
  client_id: string;
  meal_id: string;
  date: string;
  done: boolean;
};

export type WaterIntake = {
  id: string;
  client_id: string;
  date: string;
  ml: number;
  target_ml: number;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
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
  image_url: string | null;
  video_url: string | null;
};

export type Checkin = {
  id: string;
  client_id: string;
  date: string;
  weight: number | null;
  body_fat: number | null;
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
