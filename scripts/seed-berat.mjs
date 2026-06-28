// PDF'teki Berat Bulut programını test verisi olarak yükler.
// Çalıştır: node scripts/seed-berat.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EMAIL = "berat@ykcoaching.com";
const PASSWORD = "berat1234";

async function main() {
  // 1) danışan hesabı (varsa bul)
  let userId;
  const { data: created, error: cErr } = await sb.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Berat Bulut", role: "client", phone: "" },
  });
  if (cErr && !String(cErr.message).includes("already")) throw cErr;
  if (created?.user) userId = created.user.id;
  if (!userId) {
    const { data } = await sb
      .from("profiles")
      .select("id")
      .eq("full_name", "Berat Bulut")
      .maybeSingle();
    userId = data?.id;
  }
  if (!userId) throw new Error("Danışan id bulunamadı");
  await sb
    .from("profiles")
    .update({ goal: "Yağ yakımı / kondisyon — 8 hafta", payment_status: "odendi" })
    .eq("id", userId);

  // eski programları temizle (idempotent seed)
  await sb.from("programs").delete().eq("client_id", userId);

  // 2) program
  const { data: program } = await sb
    .from("programs")
    .insert({
      client_id: userId,
      title: "8 Haftalık Kontrol Programı",
      weeks: 8,
      control_date: "2026-06-27",
      next_control: "2026-08-04",
    })
    .select("id")
    .single();
  const pid = program.id;

  // 3) beslenme — low & high
  const lowMeals = mealsFor("low");
  const highMeals = mealsFor("high");
  await insertPlan(pid, "low", 2590, lowMeals);
  await insertPlan(pid, "high", 2980, highMeals);

  // 4) takviye
  const supps = [
    ["Multivitamin", "1 servis", "Sabah", "vitamin"],
    ["Vitamin C", "1000 mg", "Sabah / Akşam", "vitamin"],
    ["D3 + K2", "2000 IU", "Sabah", "vitamin"],
    ["Omega 3", "1 tablet", "Sabah / Akşam", "vitamin"],
    ["Tribulus", "1 tablet", "Sabah / Akşam", "vitamin"],
    ["Kreatin Monohidrat", "5 gr", "Sabah kahvaltı yanında", "supplement"],
    ["Glutamin", "1 servis", "Akşam", "supplement"],
    ["EAA", "10 gr", "Antrenman esnasında", "supplement"],
  ];
  await sb.from("supplements").insert(
    supps.map(([name, serving, timing, kind], i) => ({
      program_id: pid,
      name,
      serving,
      timing,
      kind,
      sort: i,
    })),
  );

  // 5) antrenman
  const days = [
    [
      "Gün 1 — Pull A",
      [
        ["Wide Grip Lat Pulldown", "2 work + 1 back-off", "8-10 / 12-15", "70 sn"],
        ["Cable Row (üçgen)", "2 work + 1 back-off", "8-10 / 12-15", "70 sn"],
        ["T-Bar Row (chest support)", "2 work + 1 back-off", "8-10 / 12-15", "70 sn"],
        ["Barbell Bent Over Row", "2 work + 1 back-off", "8-10 / 12-15", "70 sn"],
        ["Reverse Fly Machine", "2 work + 1 back-off", "8-10 / 12-15", "50 sn"],
        ["Incline Biceps Curls", "2 work + 1 back-off", "8-10 / 12-15", "50 sn"],
        ["Hammer Curls", "2 work + 1 back-off", "8-10 / 12-15", "50 sn"],
      ],
    ],
    [
      "Gün 2 — Push A",
      [
        ["Seated Cable Fly", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Smith Incline Chest Press", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Machine Chest Press", "—", "8-6-10", "1 dk"],
        ["Push Up", "3 set", "20", "30 sn"],
        ["DB Lateral Raises", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["EZ Skullcrusher + Rope Ext (superset)", "2 work + 1 back-off", "8-10 / 12-15", "80 sn"],
      ],
    ],
    [
      "Gün 3 — Legs / Abs",
      [
        ["Leg Extension", "4 set (1 ısınma + 3 tüken)", "yanana kadar", "90 sn"],
        ["Hack Squat", "4 set", "20 / yanana kadar", "90 sn"],
        ["Leg Press (omuz hizası)", "3 set", "15-12-12-10", "90 sn"],
        ["Lunge with Dumbbell", "3 set", "her bacak 20", "90 sn"],
        ["Seated Leg Curl", "3 set", "15", "1 dk"],
        ["Lying Leg Curl", "3 set", "15", "1 dk"],
        ["Calves Machine", "4 set", "yanana kadar", "1 dk"],
        ["Cable Crunch", "3 set", "15", "1 dk"],
        ["Decline Sit-ups", "3 set", "15", "1 dk"],
        ["Plank", "3 set", "max süre", "1 dk"],
      ],
    ],
    [
      "Gün 4 — Push B",
      [
        ["Cable Seated Lower Chest Fly", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Smith Shoulder Press (high incline)", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Incline Dumbbell Press", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Seated Dumbbell Lateral Raises", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Cable Front Raises (tek kol)", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Cable Pushdown", "2 work + 1 back-off", "8-10 / 12-15", "50 sn"],
        ["Close Grip Bench Press", "2 work + 1 back-off", "8-10 / 12-15", "50 sn"],
      ],
    ],
    [
      "Gün 5 — Pull B",
      [
        ["Rope Straight Arm Pulldown", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Smith Machine Back Row", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Machine Close Grip Pulldown", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Machine Seated Row (tek kol)", "2 work + 1 back-off", "8-10 / 12-15", "1 dk"],
        ["Barbell Curls (geniş tutuş)", "2 work + 1 back-off", "8-10 / 12-15", "45 sn"],
        ["Cable Double Biceps Curls", "2 work + 1 back-off", "8-10 / 12-15", "50 sn"],
      ],
    ],
  ];
  for (let d = 0; d < days.length; d++) {
    const [name, exs] = days[d];
    const { data: day } = await sb
      .from("workout_days")
      .insert({ program_id: pid, name, sort: d })
      .select("id")
      .single();
    await sb.from("exercises").insert(
      exs.map(([n, sets, reps, rest], i) => ({
        workout_day_id: day.id,
        name: n,
        sets,
        reps,
        rest,
        sort: i,
      })),
    );
  }

  console.log("✓ Berat Bulut programı yüklendi.");
  console.log("  Danışan girişi →", EMAIL, "/", PASSWORD);
}

/* yardımcılar */
function it(food_name, grams, protein, carb, fat) {
  return { food_name, grams, protein, carb, fat };
}

function mealsFor(type) {
  const hi = type === "high";
  return [
    [
      "Öğün 1",
      [
        it("Yumurta Beyazı (5 adet)", 165, 18, 1.2, 0.3),
        it("Tam Yumurta", 50, 6.3, 0.4, 5.3),
        it("Yulaf", hi ? 90 : 70, hi ? 11.7 : 9.1, hi ? 60.3 : 46.9, hi ? 6.3 : 4.9),
        it("Badem Ezmesi", 10, 2.1, 1.9, 5),
        it("Orman Meyvesi", 70, 0.5, 9.8, 0.2),
        it("Muz (orta boy)", 120, 1.3, 27.6, 0.4),
      ],
    ],
    [
      "Antrenman Öncesi",
      [
        it("Whey Protein İzolat", 60, 48, 4.8, 3.6),
        it("Rice Cream", hi ? 100 : 60, hi ? 7 : 4.2, hi ? 80 : 48, hi ? 1 : 0.6),
        it("Kuşkonmaz", 80, 1.8, 3.1, 0.1),
        it("Ispanak", 50, 1.5, 1.8, 0.2),
      ],
    ],
    [
      "Antrenman Sonrası",
      [
        it("Yağsız Kıyma / Et", 140, 36.4, 0, 14),
        it("Pirinç (pişmiş)", hi ? 280 : 220, hi ? 7.6 : 5.9, hi ? 78.4 : 61.6, hi ? 0.8 : 0.7),
      ],
    ],
    [
      "Öğün 4",
      [
        it("Tavuk Göğüs (pişmiş)", 150, 46.5, 0, 5.4),
        it("Basmati Pirinç (pişmiş)", hi ? 150 : 125, hi ? 4.1 : 3.4, hi ? 42 : 35, hi ? 0.5 : 0.4),
        it("Yeşillik (zeytinyağlı)", 80, 1.5, 3, 5),
      ],
    ],
    [
      "Öğün 5",
      [
        it("Whey Protein İzolat", 40, 32, 3.2, 2.4),
        it("Rice Cream", hi ? 70 : 50, hi ? 4.9 : 3.5, hi ? 56 : 40, hi ? 0.7 : 0.5),
      ],
    ],
  ];
}

async function insertPlan(pid, dayType, target, meals) {
  const { data: plan } = await sb
    .from("nutrition_plans")
    .insert({
      program_id: pid,
      day_type: dayType,
      target_kcal: target,
      sort: dayType === "low" ? 0 : 1,
    })
    .select("id")
    .single();
  for (let m = 0; m < meals.length; m++) {
    const [name, items] = meals[m];
    const { data: meal } = await sb
      .from("meals")
      .insert({ nutrition_plan_id: plan.id, name, sort: m })
      .select("id")
      .single();
    await sb
      .from("meal_items")
      .insert(items.map((x, i) => ({ ...x, meal_id: meal.id, sort: i })));
  }
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
