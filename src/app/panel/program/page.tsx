import { requireProfile } from "@/lib/dal";
import { getActiveProgram, getFullProgram } from "@/lib/queries";
import { ProgramView } from "@/components/program/ProgramView";
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
  return <ProgramView data={full} />;
}
