"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal";
import { createNotification } from "@/lib/notify";

/** Mesaj gönderir ve alıcıya bildirim oluşturur. */
export async function sendMessage(recipientId: string, body: string) {
  const text = body.trim();
  if (!text) return { error: "Boş mesaj" };

  const me = await getProfile();
  if (!me) return { error: "Oturum yok" };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    sender_id: me.id,
    recipient_id: recipientId,
    body: text,
  });
  if (error) return { error: error.message };

  await createNotification(supabase, {
    userId: recipientId,
    type: "message",
    title: `${me.full_name || "Yeni"} mesaj gönderdi`,
    body: text.slice(0, 80),
    link: me.role === "coach" ? "/panel/mesajlar" : `/panel/mesajlar/${me.id}`,
  });

  return { ok: true };
}

/** Bir thread'deki (karşı taraftan gelen) mesajları okundu işaretler. */
export async function markThreadRead(otherUserId: string) {
  const me = await getProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("recipient_id", me.id)
    .eq("sender_id", otherUserId)
    .eq("read", false);
  revalidatePath("/panel/mesajlar");
}
