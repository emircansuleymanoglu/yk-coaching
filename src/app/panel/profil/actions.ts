"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { ok?: boolean; error?: string } | undefined;

function s(fd: FormData, k: string) {
  const v = String(fd.get(k) || "").trim();
  return v === "" ? null : v;
}

export async function updateProfile(
  _prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const height = s(fd, "height_cm");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: s(fd, "full_name") ?? "",
      phone: s(fd, "phone"),
      goal: s(fd, "goal"),
      activity_level: s(fd, "activity_level"),
      sex: s(fd, "sex"),
      height_cm: height ? Number(height) : null,
      birthday: s(fd, "birthday"),
      country: s(fd, "country"),
      city: s(fd, "city"),
      units: s(fd, "units") ?? "metric",
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/panel/profil");
  revalidatePath("/panel");
  return { ok: true };
}
