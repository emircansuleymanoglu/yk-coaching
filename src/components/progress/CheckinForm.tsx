"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addCheckin } from "@/app/panel/ilerleme/actions";
import { Button, Card, Input, Label } from "@/components/ui";

const MEASURES = [
  ["bel", "Bel"],
  ["gogus", "Göğüs"],
  ["kol", "Kol"],
  ["bacak", "Bacak"],
] as const;

export function CheckinForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const added: string[] = [];
      for (const file of files) {
        const path = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const { error } = await supabase.storage
          .from("checkin-photos")
          .upload(path, file, { upsert: true });
        if (error) throw error;
        added.push(path);
      }
      setPaths((p) => [...p, ...added]);
    } catch (err) {
      setMsg("Foto yükleme hatası: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function submit(formData: FormData) {
    const measurements: Record<string, number> = {};
    for (const [key] of MEASURES) {
      const v = parseFloat(String(formData.get(key) || "").replace(",", "."));
      if (Number.isFinite(v)) measurements[key] = v;
    }
    const w = parseFloat(String(formData.get("weight") || "").replace(",", "."));
    const bf = parseFloat(String(formData.get("body_fat") || "").replace(",", "."));
    start(async () => {
      const res = await addCheckin({
        weight: Number.isFinite(w) ? w : null,
        bodyFat: Number.isFinite(bf) ? bf : null,
        measurements,
        notes: String(formData.get("notes") || "").trim() || null,
        photoUrls: paths,
      });
      if (res?.error) {
        setMsg(res.error);
      } else {
        setMsg(null);
        setPaths([]);
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Yeni Ölçüm Ekle
      </Button>
    );
  }

  return (
    <Card>
      <form action={submit} className="grid gap-4">
        <h2 className="font-semibold">Yeni Ölçüm</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="weight">Kilo (kg)</Label>
            <Input id="weight" name="weight" inputMode="decimal" placeholder="82.5" />
          </div>
          <div>
            <Label htmlFor="body_fat">Yağ Oranı (%)</Label>
            <Input id="body_fat" name="body_fat" inputMode="decimal" placeholder="18" />
          </div>
        </div>

        <div>
          <Label>Ölçüler (cm)</Label>
          <div className="grid grid-cols-4 gap-2">
            {MEASURES.map(([key, label]) => (
              <div key={key}>
                <input
                  name={key}
                  inputMode="decimal"
                  placeholder={label}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 text-center text-sm outline-none focus:border-[var(--primary)]"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Fotoğraflar</Label>
          <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {paths.length ? `${paths.length} foto eklendi` : "Foto ekle"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPhoto}
            />
          </label>
        </div>

        <div>
          <Label htmlFor="notes">Not</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Bu hafta nasıl hissediyorsun?"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>

        {msg && <p className="text-sm text-[var(--danger)]">{msg}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending || uploading} className="flex-1">
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            İptal
          </Button>
        </div>
      </form>
    </Card>
  );
}
