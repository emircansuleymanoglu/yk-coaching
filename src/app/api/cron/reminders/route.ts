import { createAdminClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notify";

/**
 * Günlük hatırlatma işi (Vercel Cron çağırır).
 * - Bugün planlı antrenmanı olan danışana "antrenmanın var" bildirimi
 * - Yaklaşan kontrol tarihi olan danışana hatırlatma
 * reminder_log ile aynı gün tekrar göndermez.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;

  async function once(userId: string, kind: string) {
    const { error } = await admin
      .from("reminder_log")
      .insert({ user_id: userId, kind, date: today });
    return !error; // unique ihlali → zaten gönderilmiş
  }

  // 1) bugünkü antrenmanlar
  const { data: sessions } = await admin
    .from("workout_sessions")
    .select("client_id, workout_days(name)")
    .eq("date", today)
    .eq("status", "planned");

  for (const s of sessions ?? []) {
    if (await once(s.client_id, "workout_today")) {
      const name =
        (s as { workout_days?: { name?: string } | null }).workout_days?.name ??
        "Antrenman";
      await createNotification(admin, {
        userId: s.client_id,
        type: "workout",
        title: "Bugün antrenmanın var 💪",
        body: `${name} — hadi başlayalım!`,
        link: "/panel/takvim",
      });
      sent++;
    }
  }

  // 2) yaklaşan kontrol (bugün veya yarın)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const { data: programs } = await admin
    .from("programs")
    .select("client_id, next_control")
    .in("next_control", [today, tomorrow]);

  for (const p of programs ?? []) {
    if (await once(p.client_id, "control_soon")) {
      await createNotification(admin, {
        userId: p.client_id,
        type: "info",
        title: "Kontrol zamanı yaklaşıyor 📅",
        body: `Kontrol tarihin: ${p.next_control}`,
        link: "/panel/program",
      });
      sent++;
    }
  }

  return Response.json({ ok: true, sent });
}
