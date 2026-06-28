import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Oturum açan kullanıcının profilini döndürür (yoksa null).
 * React cache ile aynı render içinde tekrar sorgu yapılmaz.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
});

/** Profil zorunlu — yoksa /login'e yönlendirir. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Yalnızca koç — değilse danışan paneline yönlendirir. */
export async function requireCoach(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "coach") redirect("/panel");
  return profile;
}
