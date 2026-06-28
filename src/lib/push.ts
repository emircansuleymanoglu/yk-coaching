import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

type PushPayload = { title: string; body?: string; link?: string };

/**
 * Bir kullanıcının tüm cihazlarına web push bildirimi gönderir.
 * VAPID anahtarları yoksa sessizce atlar. Geçersiz abonelikleri temizler.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;

  try {
    const admin = createAdminClient();
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (!subs?.length) return;

    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@ykcoaching.app",
      pub,
      priv,
    );

    type Sub = { id: string; endpoint: string; p256dh: string; auth: string };
    const body = JSON.stringify(payload);
    await Promise.all(
      (subs as Sub[]).map(async (s: Sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            body,
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
      }),
    );
  } catch (err) {
    console.error("Push gönderilemedi:", (err as Error).message);
  }
}
