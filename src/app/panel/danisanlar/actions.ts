"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/server";

export type NewClientState = { error?: string } | undefined;

/**
 * Koç yeni danışan hesabı oluşturur. Service-role anahtarıyla auth kullanıcısı
 * açılır; trigger otomatik profil oluşturur. Danışan bu e-posta + şifre ile girer.
 */
export async function createClientAccount(
  _prev: NewClientState,
  formData: FormData,
): Promise<NewClientState> {
  await requireCoach();

  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const goal = String(formData.get("goal") || "").trim();
  const password = String(formData.get("password") || "");

  if (!full_name || !email || password.length < 6) {
    return { error: "Ad, e-posta ve en az 6 karakterli şifre gerekli." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: "client", phone },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Hesap oluşturulamadı." };
  }

  // trigger profili oluşturur; hedef bilgisini ayrıca güncelle
  if (goal) {
    await admin.from("profiles").update({ goal }).eq("id", data.user.id);
  }

  revalidatePath("/panel/danisanlar");
  redirect(`/panel/danisanlar/${data.user.id}`);
}
