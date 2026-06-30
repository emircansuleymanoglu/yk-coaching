import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/dal";
import { getFullProgram } from "@/lib/queries";
import { sumMacros } from "@/lib/macros";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/PrintButton";

export default async function PrintProgramPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const me = await requireProfile();
  const { programId } = await params;
  const full = await getFullProgram(programId);
  if (!full) notFound();
  if (me.role !== "coach" && full.program.client_id !== me.id) notFound();

  const { program, nutrition, supplements, workouts } = full;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-white p-8 text-black print:p-0">
      <PrintButton />

      <header className="mb-6 border-b-2 border-violet-600 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-violet-600">YK</span> Coaching
          </h1>
          <span className="text-sm text-gray-500">Yasin K.</span>
        </div>
        <h2 className="mt-3 text-xl font-bold">{program.title}</h2>
        <p className="text-sm text-gray-600">
          {program.weeks} hafta · Kontrol: {formatDate(program.control_date)} ·
          Gelecek: {formatDate(program.next_control)}
        </p>
      </header>

      {/* Beslenme */}
      {nutrition.map((plan) => {
        const totals = sumMacros(plan.meals.flatMap((m) => m.items));
        return (
          <section key={plan.id} className="mb-6 break-inside-avoid">
            <h3 className="mb-2 bg-violet-600 px-3 py-1.5 text-sm font-bold uppercase text-white">
              Beslenme — {plan.day_type === "low" ? "Low Günler" : "High Günler"}{" "}
              ({totals.kcal} kcal)
            </h3>
            {plan.meals.map((meal) => (
              <div key={meal.id} className="mb-3">
                <h4 className="font-semibold">{meal.name}</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {meal.items.map((it) => (
                      <tr key={it.id} className="border-b border-gray-200">
                        <td className="py-1">{it.food_name}</td>
                        <td className="py-1 text-right text-gray-600">
                          {it.grams} g
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        );
      })}

      {/* Takviye */}
      {supplements.length > 0 && (
        <section className="mb-6 break-inside-avoid">
          <h3 className="mb-2 bg-violet-600 px-3 py-1.5 text-sm font-bold uppercase text-white">
            Takviye & Vitamin
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {supplements.map((s) => (
                <tr key={s.id} className="border-b border-gray-200">
                  <td className="py-1 font-medium">{s.name}</td>
                  <td className="py-1 text-gray-600">{s.serving}</td>
                  <td className="py-1 text-right text-gray-600">{s.timing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Antrenman */}
      {workouts.map((day) => (
        <section key={day.id} className="mb-6 break-inside-avoid">
          <h3 className="mb-2 bg-gray-900 px-3 py-1.5 text-sm font-bold uppercase text-white">
            {day.name}
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {day.exercises.map((ex) => (
                <tr key={ex.id} className="border-b border-gray-200">
                  <td className="py-1 font-medium">{ex.name}</td>
                  <td className="py-1 text-right text-gray-600">
                    {[ex.sets, ex.reps, ex.rest].filter(Boolean).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <footer className="mt-8 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
        YK Coaching · {formatDate(program.created_at)}
      </footer>
    </div>
  );
}
