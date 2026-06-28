import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone, Target, FileText } from "lucide-react";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveProgram, getFullProgram } from "@/lib/queries";
import { ProgramView } from "@/components/program/ProgramView";
import { Button, Card } from "@/components/ui";
import { createProgramForClient } from "./actions";
import type { Profile } from "@/lib/types";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCoach();
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  const client = data as Profile | null;
  if (!client) notFound();

  const program = await getActiveProgram(id);
  const full = program ? await getFullProgram(program.id) : null;

  const createProgram = createProgramForClient.bind(null, id);

  return (
    <div className="space-y-4">
      <Link
        href="/panel/danisanlar"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)]"
      >
        <ArrowLeft className="h-4 w-4" /> Danışanlar
      </Link>

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full brand-gradient text-lg font-bold text-white">
            {initials(client.full_name)}
          </div>
          <div>
            <h1 className="text-lg font-bold">{client.full_name}</h1>
            <p className="text-xs text-[var(--muted)]">{client.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="grid gap-1.5 text-sm">
          {client.phone && (
            <p className="flex items-center gap-2 text-[var(--muted)]">
              <Phone className="h-4 w-4" /> {client.phone}
            </p>
          )}
          {client.goal && (
            <p className="flex items-center gap-2 text-[var(--muted)]">
              <Target className="h-4 w-4" /> {client.goal}
            </p>
          )}
        </div>
      </Card>

      {program ? (
        <Link href={`/panel/danisanlar/${id}/program/${program.id}`}>
          <Button className="w-full">
            <Pencil className="h-4 w-4" /> Programı Düzenle
          </Button>
        </Link>
      ) : (
        <form action={createProgram}>
          <Button type="submit" size="lg" className="w-full">
            <FileText className="h-4 w-4" /> Program Oluştur
          </Button>
        </form>
      )}

      {full ? (
        <ProgramView data={full} />
      ) : (
        <Card className="py-8 text-center text-sm text-[var(--muted)]">
          Bu danışan için henüz program yok.
        </Card>
      )}
    </div>
  );
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
