import { BookCopy, Trash2, Dumbbell, Utensils } from "lucide-react";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button, Card } from "@/components/ui";
import { applyTemplateForm, deleteTemplate } from "./actions";
import type { ProgramTemplate } from "@/lib/types";

export default async function TemplatesPage() {
  await requireCoach();
  const supabase = await createClient();

  const [{ data: templates }, { data: clients }] = await Promise.all([
    supabase
      .from("program_templates")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "client")
      .order("full_name"),
  ]);

  const list = (templates ?? []) as ProgramTemplate[];
  const clientList = clients ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Program Şablonları</h1>
        <p className="text-sm text-[var(--muted)]">
          Bir programı bir kez kur, dilediğin danışana tek tıkla uygula.
        </p>
      </div>

      {list.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center text-sm text-[var(--muted)]">
          <BookCopy className="h-7 w-7" />
          Henüz şablon yok. Bir danışanın program editöründe “Şablon olarak
          kaydet” ile oluşturabilirsin.
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((t) => {
            const mealCount = t.payload.nutrition.reduce(
              (a, n) => a + n.meals.length,
              0,
            );
            const exCount = t.payload.workouts.reduce(
              (a, w) => a + w.exercises.length,
              0,
            );
            return (
              <Card key={t.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{t.title}</h3>
                    <p className="text-xs text-[var(--muted)]">
                      {t.weeks} hafta
                    </p>
                  </div>
                  <form action={deleteTemplate.bind(null, t.id)}>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)]"
                      aria-label="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                <div className="flex gap-3 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <Utensils className="h-3.5 w-3.5" /> {mealCount} öğün
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" />{" "}
                    {t.payload.workouts.length} gün · {exCount} egzersiz
                  </span>
                </div>

                {clientList.length > 0 && (
                  <form
                    action={applyTemplateForm.bind(null, t.id)}
                    className="flex gap-2"
                  >
                    <select
                      name="client_id"
                      required
                      className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">Danışan seç…</option>
                      {clientList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="md">
                      Uygula
                    </Button>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
