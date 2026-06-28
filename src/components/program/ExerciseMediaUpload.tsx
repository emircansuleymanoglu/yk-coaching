"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setExerciseMedia } from "@/app/panel/danisanlar/[id]/program/[programId]/actions";

export function ExerciseMediaUpload({
  exerciseId,
  clientId,
  programId,
  hasImage,
}: {
  exerciseId: string;
  clientId: string;
  programId: string;
  hasImage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(hasImage);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const isVideo = file.type.startsWith("video");
      const path = `${exerciseId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage
        .from("exercise-media")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from("exercise-media")
        .getPublicUrl(path);
      start(async () => {
        await setExerciseMedia({
          exerciseId,
          clientId,
          programId,
          ...(isVideo
            ? { videoUrl: data.publicUrl }
            : { imageUrl: data.publicUrl }),
        });
        setDone(true);
        router.refresh();
      });
    } catch (err) {
      alert("Yükleme hatası: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--primary-glow)]">
      {uploading || pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : done ? (
        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
      ) : (
        <ImagePlus className="h-3.5 w-3.5" />
      )}
      {done ? "Medya ekli" : "Görsel/Video"}
      <input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onFile}
        disabled={uploading || pending}
      />
    </label>
  );
}
