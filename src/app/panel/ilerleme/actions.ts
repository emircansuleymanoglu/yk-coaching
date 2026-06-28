"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notify";

/** Danışan yeni bir check-in (ilerleme kaydı) ekler. Fotoğraflar client'ta yüklenir. */
export async function addCheckin(input: {
  weight: number | null;
  bodyFat: number | null;
  measurements: Record<string, number>;
  notes: string | null;
  photoUrls: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum yok" };

  const { error } = await supabase.from("checkins").insert({
    client_id: user.id,
    weight: input.weight,
    body_fat: input.bodyFat,
    measurements:
      Object.keys(input.measurements).length > 0 ? input.measurements : null,
    notes: input.notes,
    photo_urls: input.photoUrls,
  });
  if (error) return { error: error.message };

  revalidatePath("/panel/ilerleme");
  revalidatePath("/panel");
  return { ok: true };
}

/** Koç bir check-in'e geri bildirim (yorum) ekler. */
export async function setCoachComment(
  checkinId: string,
  clientId: string,
  formData: FormData,
) {
  const comment = String(formData.get("comment") || "").trim();
  const supabase = await createClient();
  await supabase
    .from("checkins")
    .update({ coach_comment: comment || null })
    .eq("id", checkinId);

  if (comment) {
    await createNotification(supabase, {
      userId: clientId,
      type: "comment",
      title: "Koçundan geri bildirim",
      body: comment.slice(0, 80),
      link: "/panel/ilerleme",
    });
  }
  revalidatePath(`/panel/danisanlar/${clientId}`);
}
