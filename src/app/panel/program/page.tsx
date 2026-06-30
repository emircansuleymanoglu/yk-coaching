import { format } from "date-fns";
import { Download } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveProgram, getFullProgram } from "@/lib/queries";
import { ProgramView, type Compliance } from "@/components/program/ProgramView";
import { Card } from "@/components/ui";

export default async function ClientProgramPage() {
  const profile = await requireProfile();
  if (profile.role === "coach") {
    return (
      <Card className="py-10 text-center text-sm text-[var(--muted)]">
        Bu sayfa danışanlar içindir. Programları “Danışanlar” sekmesinden yönet.
      </Card>
    );
  }

  const program = await getActiveProgram(profile.id);
  if (!program) {
    return (
      <Card className="mt-6 py-10 text-center">
        <p className="font-semibold">Programın hazırlanıyor 🏗️</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Koçun programını yüklediğinde burada görünecek.
        </p>
      </Card>
    );
  }
  const full = await getFullProgram(program.id);
  if (!full) return null;

  // bugünkü beslenme uyumu
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [{ data: checks }, { data: water }] = await Promise.all([
    supabase
      .from("meal_checks")
      .select("meal_id")
      .eq("client_id", profile.id)
      .eq("date", today)
      .eq("done", true),
    supabase
      .from("water_intake")
      .select("ml, target_ml")
      .eq("client_id", profile.id)
      .eq("date", today)
      .maybeSingle(),
  ]);

  const compliance: Compliance = {
    date: today,
    checkedMealIds: (checks ?? []).map((c) => c.meal_id),
    water: { ml: water?.ml ?? 0, target: water?.target_ml ?? 3000 },
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <a
          href={`/yazdir/${program.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
      </div>
      <ProgramView data={full} compliance={compliance} />
    </div>
  );
}
