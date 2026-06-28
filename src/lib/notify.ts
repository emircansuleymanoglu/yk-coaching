import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

type NotifInput = {
  userId: string;
  type?: string;
  title: string;
  body?: string;
  link?: string;
};

/** Bir kullanıcıya uygulama içi bildirim oluşturur. */
export async function createNotification(
  supabase: SupabaseClient,
  n: NotifInput,
) {
  await supabase.from("notifications").insert({
    user_id: n.userId,
    type: n.type ?? "info",
    title: n.title,
    body: n.body ?? null,
    link: n.link ?? null,
  });
}

/**
 * Bir kullanıcıya e-posta gönderir (Resend). RESEND_API_KEY yoksa sessizce atlar.
 * Alıcı e-postası auth.users'tan admin client ile alınır.
 */
export async function sendEventEmail(
  userId: string,
  subject: string,
  html: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // e-posta yapılandırılmamış

  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    const email = data?.user?.email;
    if (!email) return;

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "YK Coaching <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    });
  } catch (err) {
    console.error("E-posta gönderilemedi:", (err as Error).message);
  }
}
