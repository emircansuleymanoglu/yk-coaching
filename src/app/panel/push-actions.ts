"use server";

import { createClient } from "@/lib/supabase/server";

type Sub = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Tarayıcı push aboneliğini kaydeder (cihaz başına). */
export async function savePushSubscription(sub: Sub) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum yok" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) return { error: error.message };
  return { ok: true };
}
