"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

/** Danışan için boş bir program oluşturur (low + high beslenme planlarıyla). */
export async function createProgramForClient(clientId: string) {
  await requireCoach();
  const supabase = await createClient();

  const { data: program, error } = await supabase
    .from("programs")
    .insert({ client_id: clientId, title: "Yeni Program" })
    .select("id")
    .single();

  if (error || !program) throw new Error(error?.message ?? "Program açılamadı");

  await supabase.from("nutrition_plans").insert([
    { program_id: program.id, day_type: "low", sort: 0 },
    { program_id: program.id, day_type: "high", sort: 1 },
  ]);

  revalidatePath(`/panel/danisanlar/${clientId}`);
  redirect(`/panel/danisanlar/${clientId}/program/${program.id}`);
}

/** Danışanın ödeme durumunu günceller. */
export async function setPaymentStatus(clientId: string, formData: FormData) {
  await requireCoach();
  const status = String(formData.get("status") || "bekliyor");
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ payment_status: status })
    .eq("id", clientId);
  revalidatePath(`/panel/danisanlar/${clientId}`);
}
