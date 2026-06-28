import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone, Target, FileText } from "lucide-react";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveProgram, getFullProgram } from "@/lib/queries";
import { ProgramView } from "@/components/program/ProgramView";
import { Button, Card, Input } from "@/components/ui";
import {
  createProgramForClient,
  assignSession,
  addDailyTask,
} from "./actions";
import { setCoachComment } from "@/app/panel/ilerleme/actions";
import { formatDate } from "@/lib/utils";
import type { Checkin, Profile } from "@/lib/types";

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

  const { data: checkinData } = await supabase
    .from("checkins")
    .select("*")
    .eq("client_id", id)
    .order("date", { ascending: false })
    .limit(5);
  const checkins = (checkinData ?? []) as Checkin[];

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

      {full && full.workouts.length > 0 && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Takvime Planla</h2>
          <form action={assignSession.bind(null, id)} className="grid gap-2">
            <select
              name="workout_day_id"
              required
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">Antrenman günü seç…</option>
              {full.workouts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input type="date" name="date" required className="flex-1" />
              <Button type="submit" size="md">
                Ata
              </Button>
            </div>
          </form>

          <form
            action={addDailyTask.bind(null, id)}
            className="grid gap-2 border-t border-[var(--border)] pt-3"
          >
            <p className="text-xs text-[var(--muted)]">Kardiyo / görev ekle</p>
            <Input name="title" placeholder="Örn. 25 dk yürüyüş bandı" required />
            <div className="flex gap-2">
              <Input type="date" name="date" required className="flex-1" />
              <Button type="submit" variant="outline" size="md">
                Görev Ekle
              </Button>
            </div>
          </form>
        </Card>
      )}

      {checkins.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Son Ölçümler</h2>
          {checkins.map((c) => (
            <div
              key={c.id}
              className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{formatDate(c.date)}</span>
                <span className="text-[var(--muted)]">
                  {c.weight != null ? `${c.weight} kg` : "—"}
                  {c.body_fat != null ? ` · %${c.body_fat}` : ""}
                </span>
              </div>
              {c.notes && <p className="text-sm text-[var(--muted)]">{c.notes}</p>}
              <form
                action={setCoachComment.bind(null, c.id, id)}
                className="flex gap-2"
              >
                <Input
                  name="comment"
                  defaultValue={c.coach_comment ?? ""}
                  placeholder="Geri bildirim yaz…"
                  className="flex-1"
                />
                <Button type="submit" size="sm" variant="outline">
                  Gönder
                </Button>
              </form>
            </div>
          ))}
        </Card>
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
