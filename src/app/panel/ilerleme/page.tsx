import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CheckinForm } from "@/components/progress/CheckinForm";
import { ProgressChart } from "@/components/progress/ProgressChart";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Checkin } from "@/lib/types";

export default async function ProgressPage() {
  const profile = await requireProfile();
  if (profile.role === "coach") {
    return (
      <Card className="py-10 text-center text-sm text-[var(--muted)]">
        İlerleme kayıtlarını “Danışanlar → danışan” sayfasından görebilirsin.
      </Card>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("checkins")
    .select("*")
    .eq("client_id", profile.id)
    .order("date", { ascending: true });
  const checkins = (data ?? []) as Checkin[];

  // grafik verisi
  const chartData = checkins.map((c) => ({
    date: format(new Date(c.date), "d MMM", { locale: tr }),
    weight: c.weight,
    body_fat: c.body_fat,
  }));

  // fotoğraflar için imzalı URL'ler
  const allPaths = checkins.flatMap((c) => c.photo_urls ?? []);
  const signedMap = new Map<string, string>();
  if (allPaths.length) {
    const { data: signed } = await supabase.storage
      .from("checkin-photos")
      .createSignedUrls(allPaths, 3600);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedMap.set(s.path, s.signedUrl);
    }
  }

  const history = [...checkins].reverse();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">İlerleme</h1>

      <CheckinForm userId={profile.id} />

      {checkins.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Gelişim Grafiği</h2>
          <ProgressChart data={chartData} />
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold">Geçmiş</h2>
        {history.length === 0 && (
          <Card className="py-8 text-center text-sm text-[var(--muted)]">
            Henüz ölçüm yok. İlk ölçümünü ekleyerek başla.
          </Card>
        )}
        {history.map((c) => (
          <Card key={c.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{formatDate(c.date)}</span>
              <div className="flex gap-3 text-sm">
                {c.weight != null && (
                  <span className="font-semibold">{c.weight} kg</span>
                )}
                {c.body_fat != null && (
                  <span className="text-[var(--accent)]">%{c.body_fat}</span>
                )}
              </div>
            </div>

            {c.measurements && (
              <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                {Object.entries(c.measurements).map(([k, v]) => (
                  <span key={k} className="rounded bg-[var(--surface-2)] px-2 py-0.5">
                    {k}: {v} cm
                  </span>
                ))}
              </div>
            )}

            {c.photo_urls?.length ? (
              <div className="flex gap-2 overflow-x-auto">
                {c.photo_urls.map((p) =>
                  signedMap.get(p) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={p}
                      src={signedMap.get(p)}
                      alt="ilerleme"
                      className="h-28 w-24 shrink-0 rounded-lg object-cover"
                    />
                  ) : null,
                )}
              </div>
            ) : null}

            {c.notes && <p className="text-sm">{c.notes}</p>}

            {c.coach_comment && (
              <div className="flex gap-2 rounded-lg bg-[var(--primary)]/10 px-3 py-2 text-sm">
                <MessageSquare className="h-4 w-4 shrink-0 text-[var(--primary-glow)]" />
                <p>
                  <span className="font-medium text-[var(--primary-glow)]">
                    Koç:{" "}
                  </span>
                  {c.coach_comment}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
